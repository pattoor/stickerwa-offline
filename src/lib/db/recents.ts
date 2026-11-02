const RECENTS_KEY = "stickers-wpp:recents";
const MAX_RECENTS = 20;

export function getRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecent(id: string): void {
  const recents = getRecents().filter((r) => r !== id);
  recents.unshift(id);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}