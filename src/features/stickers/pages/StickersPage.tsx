import { useEffect, useState } from "react";
import { Plus, Search, Sticker as StickerIcon, Trash2, Heart, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { stickerRepo, packRepo } from "@/lib/db";
import type { Sticker, Pack } from "@/lib/db";
import { getFavorites, toggleFavorite } from "@/lib/db/favorites";
import { exportPackToBlob, validatePackForExport } from "@/lib/stickers/packExport";
import { CURATED_PACKS } from "@/lib/stickers/curatedPacks";
import { StickerBridge } from "@/plugins/stickerBridge";
import { addProgress } from "@/lib/gamification/achievements";
import { useProfileStore } from "@/stores/profileStore";
import { cn } from "@/lib/utils";

type Tab = "mine" | "favorites" | "gallery";

export function StickersPage() {
  const [tab, setTab] = useState<Tab>("mine");
  const [query, setQuery] = useState("");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [favs, setFavs] = useState<Set<string>>(getFavorites());
  const [exporting, setExporting] = useState(false);
  const inc = useProfileStore((s) => s.inc);
  const name = useProfileStore((s) => s.name);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [s, p] = await Promise.all([stickerRepo.listStickers(), packRepo.listPacks()]);
      if (!cancelled) {
        setStickers(s);
        setPacks(p);
      }
    }
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  async function deleteSticker(id: string) {
    await stickerRepo.deleteSticker(id);
    const [s, p] = await Promise.all([stickerRepo.listStickers(), packRepo.listPacks()]);
    setStickers(s);
    setPacks(p);
  }

  function handleFav(id: string) {
    toggleFavorite(id);
    setFavs(getFavorites());
  }

  async function exportPack(pack: Pack) {
    const packStickers = stickers.filter((s) => s.packId === pack.id);
    const err = validatePackForExport(packStickers);
    if (err) {
      alert(err);
      return;
    }
    setExporting(true);
    try {
      const blob = await exportPackToBlob(pack, packStickers, name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pack.name}.wastickers`;
      a.click();
      URL.revokeObjectURL(url);
      await packRepo.savePack({ ...pack, exportedAt: Date.now(), updatedAt: Date.now() });
      const [s, p] = await Promise.all([stickerRepo.listStickers(), packRepo.listPacks()]);
      setStickers(s);
      setPacks(p);
      inc("packsExported");
      addProgress("first_export");
    } finally {
      setExporting(false);
    }
  }

  async function importToWhatsApp(pack: Pack) {
    await StickerBridge.importPack({ packId: pack.id });
    inc("packsShared");
    addProgress("first_share");
  }

  function importPackFromFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".wastickers,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as { manifest: { name: string }; stickers: string[] };
        const pack = {
          id: crypto.randomUUID(),
          name: data.manifest?.name ?? file.name.replace(/\.[^.]+$/, ""),
          trayIconPath: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          exportedAt: null,
          isCurated: false,
        };
        await packRepo.savePack(pack);
        for (const img of data.stickers ?? []) {
          await stickerRepo.saveSticker({
            id: crypto.randomUUID(),
            packId: pack.id,
            imagePath: img,
            width: 512,
            height: 512,
            sizeBytes: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
        const [s, p] = await Promise.all([stickerRepo.listStickers(), packRepo.listPacks()]);
        setStickers(s);
        setPacks(p);
        inc("packsCreated");
      } catch (e) {
        alert("Archivo inválido.");
        console.error(e);
      }
    };
    input.click();
  }

  const filtered = stickers.filter((s) => {
    if (tab === "favorites" && !favs.has(s.id)) return false;
    if (!query) return true;
    return s.id.toLowerCase().includes(query.toLowerCase());
  });

  const userPacks = packs.filter((p) => !p.isCurated);

  return (
    <div className="mx-auto max-w-md px-3 pt-3">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Stickers</h1>
        <div className="flex gap-2">
          <button
            onClick={importPackFromFile}
            className="flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 active:scale-95 dark:bg-slate-700 dark:text-slate-200"
          >
            <Upload className="h-4 w-4" />
          </button>
          <Link
            to="/stickers/new"
            className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </header>

      <div className="mb-3 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(["mine", "favorites", "gallery"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {t === "mine" ? "Mis" : t === "favorites" ? "Favoritos" : "Galería"}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {tab === "mine" && userPacks.length > 0 && (
        <div className="mb-3 space-y-2">
          {userPacks.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="text-sm font-medium">
                {p.name} ({stickers.filter((s) => s.packId === p.id).length})
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => exportPack(p)}
                  disabled={exporting}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700"
                >
                  Exportar
                </button>
                <button
                  onClick={() => importToWhatsApp(p)}
                  className="rounded-md bg-brand-600 px-2 py-1 text-xs text-white"
                >
                  Importar a WA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "gallery" ? (
        <div className="space-y-2">
          {CURATED_PACKS.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="text-3xl">{p.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{p.description}</div>
              </div>
              <button className="rounded-md bg-brand-600 px-2 py-1 text-xs text-white">
                Importar
              </button>
            </div>
          ))}
          <p className="pt-2 text-center text-xs text-slate-400">
            La galería curada se actualiza con cada release.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-2 rounded-full bg-slate-100 p-3 dark:bg-slate-800">
            <StickerIcon className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tab === "favorites" ? "No tenés favoritos todavía." : "Todavía no creaste stickers. Tocá “Nuevo” para empezar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((s) => (
            <div key={s.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <img src={s.imagePath} alt="sticker" className="h-full w-full object-contain" />
              <button
                onClick={() => handleFav(s.id)}
                className="absolute left-1 top-1 rounded-full bg-white/80 p-1 shadow"
              >
                <Heart className={cn("h-3 w-3", favs.has(s.id) ? "fill-red-500 text-red-500" : "text-slate-400")} />
              </button>
              <button
                onClick={() => deleteSticker(s.id)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}