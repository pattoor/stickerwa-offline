const FAV_KEY = "stickers-wpp:favorites";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  if (favs.has(id)) {
    favs.delete(id);
  } else {
    favs.add(id);
  }
  localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  return favs.has(id);
}

export function isFavorite(id: string): boolean {
  return getFavorites().has(id);
}