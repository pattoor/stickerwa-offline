import type { ReactNode } from "react";
import { Moon, Sun, Info, Download, HardDrive, Upload, FileDown } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { isBgModelCached } from "@/lib/canvas/bgRemoval";
import { downloadBackup, restoreBackup } from "@/lib/backup/backup";

export function SettingsPage() {
  const { isDark, mode, setMode } = useThemeStore();

  return (
    <div className="mx-auto max-w-md px-3 pt-3">
      <h1 className="mb-3 text-xl font-bold">Configuración</h1>

      <section className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800">
        <Row
          icon={isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          title="Tema"
          subtitle={mode === "auto" ? "Automático (sistema)" : isDark ? "Oscuro" : "Claro"}
          right={
            <div className="flex gap-1">
              {(["auto", "dark", "light"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2 py-1 text-xs ${mode === m ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
                >
                  {m === "auto" ? "Auto" : m === "dark" ? "Oscuro" : "Claro"}
                </button>
              ))}
            </div>
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

      <section className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800">
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Backup / Restore</span>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Exportá todos tus stickers, packs y configuración. Restaurá desde un backup anterior.
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadBackup}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-xs font-medium text-white"
            >
              <FileDown className="h-4 w-4" />
              Exportar backup
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json,application/json";
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  const result = await restoreBackup(file);
                  alert(result.message);
                };
                input.click();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-medium dark:bg-slate-700"
            >
              <Upload className="h-4 w-4" />
              Importar backup
            </button>
          </div>
        </div>
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