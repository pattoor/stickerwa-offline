import { useEffect, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useThemeStore } from "@/stores/themeStore";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const isDark = useThemeStore((s) => s.isDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <main className={hideNav ? "" : "pb-20"}>{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}