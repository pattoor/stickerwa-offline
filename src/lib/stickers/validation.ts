export const STICKER_SIZE = 512;
export const TRAY_ICON_SIZE = 96;
export const MAX_STICKER_BYTES = 100 * 1024; // 100 KB
export const MAX_TRAY_BYTES = 50 * 1024; // 50 KB
export const MIN_PACK_SIZE = 3;
export const MAX_PACK_SIZE = 30;

export function validateSticker(blob: Blob): string | null {
  if (blob.size > MAX_STICKER_BYTES) {
    return `El sticker pesa ${(blob.size / 1024).toFixed(1)}KB, máximo ${MAX_STICKER_BYTES / 1024}KB.`;
  }
  return null;
}

export function validatePackSize(count: number): string | null {
  if (count < MIN_PACK_SIZE) return `Un pack necesita al menos ${MIN_PACK_SIZE} stickers.`;
  if (count > MAX_PACK_SIZE) return `Un pack puede tener hasta ${MAX_PACK_SIZE} stickers.`;
  return null;
}