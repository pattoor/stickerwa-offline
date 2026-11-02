import { TRAY_ICON_SIZE } from "./validation";

export async function generateTrayIcon(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TRAY_ICON_SIZE;
      canvas.height = TRAY_ICON_SIZE;
      const ctx = canvas.getContext("2d")!;
      // Center-crop to square then resize
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, TRAY_ICON_SIZE, TRAY_ICON_SIZE);
      resolve(canvas.toDataURL("image/webp", 0.8));
    };
    img.src = imageDataUrl;
  });
}