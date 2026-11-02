import { registerPlugin } from "@capacitor/core";

export interface StickerBridgePlugin {
  importPack(options: { packId: string }): Promise<{ imported: boolean }>;
  sharePack(options: { packId: string; filePath: string }): Promise<void>;
}

export const StickerBridge = registerPlugin<StickerBridgePlugin>("StickerBridge", {
  web: () => import("./stickerBridgeWeb").then((m) => new m.StickerBridgeWeb()),
});