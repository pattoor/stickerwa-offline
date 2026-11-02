const MODEL_CACHE_KEY = "stickers-wpp:bg-model-cached";

export function isBgModelCached(): boolean {
  return localStorage.getItem(MODEL_CACHE_KEY) === "1";
}

export function setBgModelCached(): void {
  localStorage.setItem(MODEL_CACHE_KEY, "1");
}

export async function removeBackground(imageBlob: Blob, onProgress?: (p: number) => void): Promise<Blob> {
  // Lazy import to keep bundle small
  const { removeBackground: remove } = await import("@imgly/background-removal");
  const result = await remove(imageBlob, {
    progress: (_key: string, current: number, total: number) => {
      if (total > 0) onProgress?.(current / total);
    },
  });
  setBgModelCached();
  return result;
}