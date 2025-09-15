// store/ThemeModalHost.tsx
import ThemePickerModal from "@/components/ThemePickerModal";
import React, { createContext, useCallback, useContext, useState } from "react";

type Ctx = { open: () => void; close: () => void };
const ThemeModalCtx = createContext<Ctx | null>(null);

export function ThemeModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <ThemeModalCtx.Provider value={{ open, close }}>
      {children}
      <ThemePickerModal visible={visible} onClose={close} />
    </ThemeModalCtx.Provider>
  );
}

export const useThemeModal = () => {
  const v = useContext(ThemeModalCtx);
  if (!v)
    throw new Error("useThemeModal must be used within ThemeModalProvider");
  return v;
};
