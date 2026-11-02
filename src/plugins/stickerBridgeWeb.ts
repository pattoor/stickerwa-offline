import { WebPlugin } from "@capacitor/core";
import type { StickerBridgePlugin } from "./stickerBridge";

export class StickerBridgeWeb extends WebPlugin implements StickerBridgePlugin {
  async importPack(): Promise<{ imported: boolean }> {
    // Web fallback: cannot import to WhatsApp. Open instructions.
    alert("La importación a WhatsApp solo funciona en la app Android.");
    return { imported: false };
  }
  async sharePack(): Promise<void> {
    // Web fallback: use browser share if available
    if (navigator.share) {
      await navigator.share({ title: "Sticker pack" });
    }
  }
}