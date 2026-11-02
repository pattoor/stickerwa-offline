import { useState } from "react";
import { X } from "lucide-react";
import { isBgModelCached, removeBackground } from "@/lib/canvas/bgRemoval";

interface Props {
  imageBlob: Blob | null;
  onClose: () => void;
  onResult: (blob: Blob) => void;
}

export function BgRemovalModal({ imageBlob, onClose, onResult }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cached = isBgModelCached();

  async function run() {
    if (!imageBlob) return;
    setDownloading(true);
    setError(null);
    try {
      const result = await removeBackground(imageBlob, (p) => setProgress(p));
      onResult(result);
      onClose();
    } catch (e) {
      setError("Error al procesar. Intentá de nuevo.");
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Quitar fondo</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {!cached && !downloading && (
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Se descargará el modelo de IA (~40MB) la primera vez. ¿Continuar?
          </p>
        )}
        {downloading && (
          <div className="mb-4">
            <div className="mb-1 text-xs text-slate-500">{Math.round(progress * 100)}%</div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-slate-100 py-2 text-sm dark:bg-slate-700">
            Cancelar
          </button>
          <button
            onClick={run}
            disabled={downloading}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {downloading ? "Procesando..." : cached ? "Quitar fondo" : "Descargar y quitar"}
          </button>
        </div>
      </div>
    </div>
  );
}