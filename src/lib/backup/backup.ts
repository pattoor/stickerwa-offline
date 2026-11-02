import { stickerRepo, packRepo } from "@/lib/db";
import { getFavorites } from "@/lib/db/favorites";
import { getRecents } from "@/lib/db/recents";
import { getProgress } from "@/lib/gamification/achievements";
import { useProfileStore } from "@/stores/profileStore";
import { useThemeStore } from "@/stores/themeStore";

export interface BackupData {
  version: number;
  createdAt: number;
  stickers: any[];
  packs: any[];
  favorites: string[];
  recents: string[];
  achievements: Record<string, number>;
  profile: { name: string; metrics: any };
  theme: { mode: string; isDark: boolean };
}

export async function createBackup(): Promise<BackupData> {
  const [stickers, packs] = await Promise.all([stickerRepo.listStickers(), packRepo.listPacks()]);
  const profile = useProfileStore.getState();
  const theme = useThemeStore.getState();
  return {
    version: 1,
    createdAt: Date.now(),
    stickers,
    packs,
    favorites: [...getFavorites()],
    recents: getRecents(),
    achievements: getProgress(),
    profile: { name: profile.name, metrics: profile.metrics },
    theme: { mode: theme.mode, isDark: theme.isDark },
  };
}

export async function downloadBackup(): Promise<void> {
  const data = await createBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stickers-wpp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as BackupData;
    if (!data.version || !data.stickers || !data.packs) {
      return { success: false, message: "Archivo de backup inválido." };
    }
    // Restore packs
    for (const pack of data.packs) {
      await packRepo.savePack(pack);
    }
    // Restore stickers
    for (const sticker of data.stickers) {
      await stickerRepo.saveSticker(sticker);
    }
    // Restore favorites
    if (data.favorites) {
      localStorage.setItem("stickers-wpp:favorites", JSON.stringify(data.favorites));
    }
    // Restore recents
    if (data.recents) {
      localStorage.setItem("stickers-wpp:recents", JSON.stringify(data.recents));
    }
    // Restore achievements
    if (data.achievements) {
      localStorage.setItem("stickers-wpp:ach-progress", JSON.stringify(data.achievements));
    }
    // Restore profile
    if (data.profile) {
      useProfileStore.getState().setName(data.profile.name);
    }
    // Restore theme
    if (data.theme) {
      useThemeStore.getState().setMode(data.theme.mode as any);
    }
    return { success: true, message: `Backup restaurado: ${data.stickers.length} stickers, ${data.packs.length} packs.` };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Error al restaurar el backup." };
  }
}