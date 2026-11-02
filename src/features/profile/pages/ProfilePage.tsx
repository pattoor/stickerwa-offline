import { useState } from "react";
import { User, Edit3 } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS, isUnlocked } from "@/lib/gamification/achievements";

export function ProfilePage() {
  const { name, setName, metrics } = useProfileStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  return (
    <div className="mx-auto max-w-md px-3 pt-3">
      <h1 className="mb-3 text-xl font-bold">Perfil</h1>

      {/* Avatar + name */}
      <div className="mb-6 flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <User className="h-7 w-7" />
        </div>
        <div className="flex-1">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Tu nombre"
                autoFocus
              />
              <button
                onClick={() => {
                  setName(draft.trim() || "Anónimo");
                  setEditing(false);
                }}
                className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{name}</span>
              <button onClick={() => { setDraft(name); setEditing(true); }}>
                <Edit3 className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Se usa al exportar packs de stickers.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Métricas
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Metric label="Stickers creados" value={metrics.stickersCreated} />
        <Metric label="Packs creados" value={metrics.packsCreated} />
        <Metric label="Packs exportados" value={metrics.packsExported} />
        <Metric label="Compartidos" value={metrics.packsShared} />
      </div>

      {/* Achievements */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Logros
      </h2>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = isUnlocked(a.key);
          return (
            <div
              key={a.key}
              className={cn(
                "flex flex-col items-center rounded-xl p-3 text-center",
                unlocked
                  ? "bg-white shadow-sm dark:bg-slate-800"
                  : "bg-slate-100 opacity-50 dark:bg-slate-800/50",
              )}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="mt-1 text-xs font-medium">{a.title}</span>
            </div>
          );
        })}
      </div>

      {/* Export info note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">Exportación de packs</p>
        <p>
          Al exportar un pack, se incluye tu nombre y la info del pack (nombre, cantidad de stickers,
          fecha) en el archivo <code>.wastickers</code>.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
      <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}