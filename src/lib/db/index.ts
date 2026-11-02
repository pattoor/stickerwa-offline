import { WebStickerRepository, WebPackRepository } from "./webStorage";
import type { StickerRepository, PackRepository } from "./types";

export type { Sticker, Pack, StickerRepository, PackRepository } from "./types";

// Dev/web implementation. Swap to SQLite adapter when running on native.
export const stickerRepo: StickerRepository = new WebStickerRepository();
export const packRepo: PackRepository = new WebPackRepository();