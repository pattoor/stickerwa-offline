export interface Sticker {
  id: string;
  packId: string;
  imagePath: string;
  width: number;
  height: number;
  sizeBytes: number;
  createdAt: number;
  updatedAt: number;
}

export interface Pack {
  id: string;
  name: string;
  trayIconPath: string | null;
  createdAt: number;
  updatedAt: number;
  exportedAt: number | null;
  isCurated: boolean;
}

export interface StickerRepository {
  listStickers(packId?: string): Promise<Sticker[]>;
  getSticker(id: string): Promise<Sticker | null>;
  saveSticker(sticker: Sticker): Promise<void>;
  deleteSticker(id: string): Promise<void>;
}

export interface PackRepository {
  listPacks(): Promise<Pack[]>;
  getPack(id: string): Promise<Pack | null>;
  savePack(pack: Pack): Promise<void>;
  deletePack(id: string): Promise<void>;
}