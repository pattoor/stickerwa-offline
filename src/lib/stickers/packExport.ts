import type { Pack, Sticker } from "@/lib/db";
import { validatePackSize } from "./validation";

export interface WastickersManifest {
  identifier: string;
  name: string;
  publisher: string;
  trayImageFile: string;
  stickers: { imageFile: string; emojis: string[] }[];
  iosAppStoreLink?: string;
  androidPlayStoreLink?: string;
}

export function buildManifest(pack: Pack, stickers: Sticker[], publisher: string): WastickersManifest {
  return {
    identifier: pack.id,
    name: pack.name,
    publisher,
    trayImageFile: "tray.png",
    stickers: stickers.map((_s, i) => ({ imageFile: `sticker_${i}.webp`, emojis: [] })),
  };
}

export function validatePackForExport(stickers: Sticker[]): string | null {
  return validatePackSize(stickers.length);
}

export async function exportPackToBlob(pack: Pack, stickers: Sticker[], publisher: string): Promise<Blob> {
  // Build a zip-like structure is not trivial in browser without a lib.
  // For MVP, export as JSON manifest + data URLs combined.
  const manifest = buildManifest(pack, stickers, publisher);
  const payload = { manifest, stickers: stickers.map((s) => s.imagePath) };
  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}