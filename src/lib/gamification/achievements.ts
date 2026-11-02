export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  target: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: "first_sticker", title: "Primer sticker", description: "Creaste tu primer sticker", icon: "🎨", target: 1 },
  { key: "ten_stickers", title: "10 stickers", description: "Creaste 10 stickers", icon: "🔥", target: 10 },
  { key: "first_pack", title: "Primer pack", description: "Creaste tu primer pack", icon: "📦", target: 1 },
  { key: "first_export", title: "Primer export", description: "Exportaste un pack", icon: "📤", target: 1 },
  { key: "first_share", title: "Compartido", description: "Compartiste un pack", icon: "🤝", target: 1 },
];

const PROGRESS_KEY = "stickers-wpp:ach-progress";

type Progress = Record<string, number>;

export function getProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

export function addProgress(key: string, amount = 1): { unlocked: string[] } {
  const progress = getProgress();
  const ach = ACHIEVEMENTS.find((a) => a.key === key);
  if (!ach) return { unlocked: [] };
  progress[key] = (progress[key] ?? 0) + amount;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  const unlocked: string[] = [];
  if (progress[key] >= ach.target) {
    unlocked.push(key);
  }
  return { unlocked };
}

export function isUnlocked(key: string): boolean {
  const progress = getProgress();
  const ach = ACHIEVEMENTS.find((a) => a.key === key);
  if (!ach) return false;
  return (progress[key] ?? 0) >= ach.target;
}