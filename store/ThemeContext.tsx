// store/ThemeContext.tsx
import { darkColors, lightColors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";

type ThemeName = "light" | "dark" | "system";
type ThemeColors = typeof lightColors;

type Ctx = {
  themeName: ThemeName;
  systemScheme: ColorSchemeName;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (name: ThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeCtx = createContext<Ctx | null>(null);
const KEY = "app.theme.v1";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("light"); 
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeName(saved);
      }
    });

    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme)
    );
    return () => sub.remove();
  }, []);

  const isDark =
    themeName === "system" ? systemScheme === "dark" : themeName === "dark";

  const colors = isDark ? darkColors : lightColors;

  const setTheme = async (name: ThemeName) => {
    setThemeName(name);
    await AsyncStorage.setItem(KEY, name);
  };

  const toggleTheme = async () =>
    setTheme(isDark ? "light" : "dark");

  const value = useMemo(
    () => ({ themeName, systemScheme, colors, isDark, setTheme, toggleTheme }),
    [themeName, systemScheme, isDark]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
};
