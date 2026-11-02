import type { Sticker, Pack, StickerRepository, PackRepository } from "./types";

const STICKERS_KEY = "stickers-wpp:stickers";
const PACKS_KEY = "stickers-wpp:packs";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export class WebStickerRepository implements StickerRepository {
  async listStickers(packId?: string): Promise<Sticker[]> {
    const all = readJson<Sticker[]>(STICKERS_KEY, []);
    return packId ? all.filter((s) => s.packId === packId) : all;
  }
  async getSticker(id: string): Promise<Sticker | null> {
    const all = readJson<Sticker[]>(STICKERS_KEY, []);
    return all.find((s) => s.id === id) ?? null;
  }
  async saveSticker(sticker: Sticker): Promise<void> {
    const all = readJson<Sticker[]>(STICKERS_KEY, []);
    const idx = all.findIndex((s) => s.id === sticker.id);
    if (idx >= 0) all[idx] = sticker;
    else all.push(sticker);
    writeJson(STICKERS_KEY, all);
  }
  async deleteSticker(id: string): Promise<void> {
    const all = readJson<Sticker[]>(STICKERS_KEY, []);
    writeJson(STICKERS_KEY, all.filter((s) => s.id !== id));
  }
}

export class WebPackRepository implements PackRepository {
  async listPacks(): Promise<Pack[]> {
    return readJson<Pack[]>(PACKS_KEY, []);
  }
  async getPack(id: string): Promise<Pack | null> {
    const all = readJson<Pack[]>(PACKS_KEY, []);
    return all.find((p) => p.id === id) ?? null;
  }
  async savePack(pack: Pack): Promise<void> {
    const all = readJson<Pack[]>(PACKS_KEY, []);
    const idx = all.findIndex((p) => p.id === pack.id);
    if (idx >= 0) all[idx] = pack;
    else all.push(pack);
    writeJson(PACKS_KEY, all);
  }
  async deletePack(id: string): Promise<void> {
    const all = readJson<Pack[]>(PACKS_KEY, []);
    writeJson(PACKS_KEY, all.filter((p) => p.id !== id));
  }
}