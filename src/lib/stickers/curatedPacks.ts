export interface CuratedPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  stickers: string[]; // data URLs or asset paths
}

export const CURATED_PACKS: CuratedPack[] = [
  {
    id: "curated-emojis",
    name: "Emojis básicos",
    description: "Pack de ejemplo con emojis",
    icon: "😀",
    stickers: [],
  },
  {
    id: "curated-animals",
    name: "Animales",
    description: "Pack de ejemplo con animales",
    icon: "🐾",
    stickers: [],
  },
];