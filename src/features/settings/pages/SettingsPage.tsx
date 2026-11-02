import type { ReactNode } from "react";
import { Moon, Sun, Info, Download } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { isBgModelCached } from "@/lib/canvas/bgRemoval";

export function SettingsPage() {
  const { isDark, toggle } = useThemeStore();

  return (
    <div className="mx-auto max-w-md px-3 pt-3">
      <h1 className="mb-3 text-xl font-bold">Configuración</h1>

      <section className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800">
        <Row
          icon={isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          title="Modo oscuro"
          subtitle={isDark ? "Activado" : "Desactivado"}
          right={
            <button
              onClick={toggle}
              className={`relative h-6 w-11 rounded-full transition-colors ${isDark ? "bg-brand-600" : "bg-slate-300"}`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          }
        />
      </section>

      <section className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800">
        <Row
          icon={<Download className="h-5 w-5" />}
          title="Quitar fondo (IA)"
          subtitle={isBgModelCached() ? "Modelo descargado" : "Descarga opcional (~40MB) en el primer uso"}
          right={<span className="text-xs text-slate-400">{isBgModelCached() ? "Listo" : "Opcional"}</span>}
        />
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800">
        <Row
          icon={<Info className="h-5 w-5" />}
          title="Acerca de"
          subtitle="Stickers WPP v0.1.0 — offline-first"
          right={null}
        />
      </section>
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="text-slate-500 dark:text-slate-400">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}