import { useEffect, useRef } from "react";
import * as fabric from "fabric";

interface Props {
  bgColor?: string;
  onReady?: (canvas: fabric.Canvas) => void;
}

export function StickerCanvas({ bgColor = "transparent", onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current.parentElement;
    const w = container?.clientWidth || window.innerWidth;
    const h = container?.clientHeight || window.innerHeight;
    const c = new fabric.Canvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: bgColor === "transparent" ? "transparent" : bgColor,
    });
    canvasInstance.current = c;
    onReady?.(c);
    return () => {
      c.dispose();
      canvasInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update background color when it changes
  useEffect(() => {
    const c = canvasInstance.current;
    if (c) {
      c.backgroundColor = bgColor === "transparent" ? "transparent" : bgColor;
      c.renderAll();
    }
  }, [bgColor]);

  const isTransparent = bgColor === "transparent";
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: isTransparent ? "transparent" : bgColor,
        backgroundImage: isTransparent
          ? "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)"
          : "none",
        backgroundSize: isTransparent ? "16px 16px" : undefined,
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

export type { fabric };