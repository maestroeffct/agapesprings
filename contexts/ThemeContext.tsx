// import { darkTheme, lightTheme } from "@/constants/theme";
// import React, { createContext, ReactNode, useEffect, useState } from "react";
// import { Appearance } from "react-native";

// type Theme = "light" | "dark";

// interface ThemeContextType {
//   theme: Theme;
//   themeColors: typeof lightTheme;
//   toggleTheme: () => void;
// }

// export const ThemeContext = createContext<ThemeContextType>({
//   theme: "light",
//   themeColors: lightTheme,
//   toggleTheme: () => {},
// });

// interface Props {
//   children: ReactNode;
// }

// export const ThemeProvider = ({ children }: Props) => {
//   const [theme, setTheme] = useState<Theme>(
//     Appearance.getColorScheme() === "dark" ? "dark" : "light"
//   );

//   useEffect(() => {
//     const subscription = Appearance.addChangeListener(({ colorScheme }) => {
//       if (colorScheme) {
//         setTheme(colorScheme === "dark" ? "dark" : "light");
//       }
//     });
//     return () => subscription.remove();
//   }, []);

//   const toggleTheme = () => {
//     setTheme((prev) => (prev === "light" ? "dark" : "light"));
//   };

//   const themeColors = theme === "dark" ? darkTheme : lightTheme;

//   return (
//     <ThemeContext.Provider value={{ theme, themeColors, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };
