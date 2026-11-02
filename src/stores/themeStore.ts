import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  mode: "auto" | "dark" | "light";
  isDark: boolean;
  setMode: (mode: "auto" | "dark" | "light") => void;
  toggle: () => void;
}

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "auto",
      isDark: getSystemDark(),
      setMode: (mode) => {
        const isDark = mode === "auto" ? getSystemDark() : mode === "dark";
        set({ mode, isDark });
      },
      toggle: () => {
        const { mode, isDark } = get();
        if (mode === "auto") {
          set({ mode: isDark ? "light" : "dark", isDark: !isDark });
        } else {
          const newDark = !isDark;
          set({ mode: newDark ? "dark" : "light", isDark: newDark });
        }
      },
    }),
    { name: "stickers-theme" },
  ),
);

// Listen to system preference changes when in auto mode
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", (e) => {
    const store = useThemeStore.getState();
    if (store.mode === "auto") {
      useThemeStore.setState({ isDark: e.matches });
    }
  });
}