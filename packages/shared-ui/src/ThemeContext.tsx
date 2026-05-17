import { createContext, ReactNode, useContext } from "react";

export type Theme = 'light' | 'dark';

const ThemeContext = createContext<Theme>('light');

export function ThemeProvider({ theme, children }: { theme:Theme; children: ReactNode}) {
  return <ThemeContext.Provider value={theme}>
    {children}
  </ThemeContext.Provider>
};

export const useTheme = () => useContext(ThemeContext);