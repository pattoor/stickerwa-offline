import { useRef, useState } from "react";
import { ArrowLeft, Type, Image as ImageIcon, Download, Undo2, Redo2, Trash2, Eraser, Pen } from "lucide-react";
import { Link } from "react-router-dom";
import * as fabric from "fabric";
import { StickerCanvas } from "../components/StickerCanvas";
import { BgRemovalModal } from "../components/BgRemovalModal";
import { parseGif, gifFramesToAnimatedWebp } from "@/lib/canvas/gifToWebp";
import type { GifFrame } from "@/lib/canvas/gifToWebp";
import { useProfileStore } from "@/stores/profileStore";
import { stickerRepo, packRepo } from "@/lib/db";
import { validateSticker } from "@/lib/stickers/validation";
import { generateTrayIcon } from "@/lib/stickers/trayIcon";
import { addRecent } from "@/lib/db/recents";
import { addProgress } from "@/lib/gamification/achievements";

const PEN_COLORS = ["#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];
const PEN_SIZES = [2, 4, 8, 12, 20];

export function EditorPage() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBgModal, setShowBgModal] = useState(false);
  const [bgImageBlob, setBgImageBlob] = useState<Blob | null>(null);
  const [animatedFrames, setAnimatedFrames] = useState<GifFrame[] | null>(null);
  const [bgColor, setBgColor] = useState("transparent");
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(4);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showTextOptions, setShowTextOptions] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [textFont, setTextFont] = useState("sans-serif");
  const TEXT_FONTS = ["sans-serif", "serif", "monospace", "cursive", "fantasy"];
  const inc = useProfileStore((s) => s.inc);

  function pushHistory() {
    const c = canvasRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    setHistory((h) => {
      const next = h.slice(0, historyIdx + 1);
      next.push(json);
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIdx((i) => Math.min(i + 1, 49));
  }

  function undo() {
    if (historyIdx <= 0) return;
    const c = canvasRef.current;
    if (!c) return;
    const idx = historyIdx - 1;
    c.loadFromJSON(history[idx]).then(() => c.renderAll());
    setHistoryIdx(idx);
  }

  function redo() {
    if (historyIdx >= history.length - 1) return;
    const c = canvasRef.current;
    if (!c) return;
    const idx = historyIdx + 1;
    c.loadFromJSON(history[idx]).then(() => c.renderAll());
    setHistoryIdx(idx);
  }

  function setBackground(color: string) {
    const c = canvasRef.current;
    if (!c) return;
    setBgColor(color);
    c.backgroundColor = color === "transparent" ? "transparent" : color;
    c.renderAll();
    pushHistory();
  }

  function togglePen() {
    const c = canvasRef.current;
    if (!c) return;
    const newMode = !penMode;
    setPenMode(newMode);
    if (newMode) {
      c.isDrawingMode = true;
      const brush = new fabric.PencilBrush(c);
      brush.color = penColor;
      brush.width = penSize;
      c.freeDrawingBrush = brush;
    } else {
      c.isDrawingMode = false;
    }
  }

  function updatePenColor(color: string) {
    setPenColor(color);
    const c = canvasRef.current;
    if (c && c.freeDrawingBrush) {
      c.freeDrawingBrush.color = color;
    }
  }

  function updatePenSize(size: number) {
    setPenSize(size);
    const c = canvasRef.current;
    if (c && c.freeDrawingBrush) {
      c.freeDrawingBrush.width = size;
    }
  }

  function updateActiveTextFont(font: string) {
    const c = canvasRef.current;
    const active = c?.getActiveObject();
    if (active && active.type === "i-text") {
      (active as any).set("fontFamily", font);
      c?.renderAll();
      pushHistory();
    }
  }

  function updateActiveTextColor(color: string) {
    const c = canvasRef.current;
    const active = c?.getActiveObject();
    if (active && active.type === "i-text") {
      (active as any).set("fill", color);
      c?.renderAll();
      pushHistory();
    }
  }

  function addText() {
    const c = canvasRef.current;
    if (!c) return;
    const t = new fabric.IText("Texto", {
      left: 100, top: 200, fontSize: 48, fill: textColor, fontFamily: textFont,
    });
    c.add(t);
    c.setActiveObject(t);
    c.renderAll();
    pushHistory();
  }

  function addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
      if (isGif) {
        try {
          const { frames } = await parseGif(file);
          if (frames.length === 0) return;
          setAnimatedFrames(frames);
        } catch (e) {
          console.error("GIF parse error", e);
          alert("No se pudo leer el GIF.");
          return;
        }
      } else {
        setAnimatedFrames(null);
      }
      const img = await fabric.FabricImage.fromURL(url);
      c_addImage(img);
    };
    input.click();
  }

  function c_addImage(img: fabric.FabricImage) {
    const c = canvasRef.current;
    if (!c) return;
    const scale = Math.min(512 / (img.width || 512), 512 / (img.height || 512)) * 0.9;
    img.scale(scale);
    img.set({ left: (512 - (img.width || 0) * scale) / 2, top: (512 - (img.height || 0) * scale) / 2 });
    c.add(img);
    c.setActiveObject(img);
    c.renderAll();
    pushHistory();
  }

  function deleteSelected() {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObjects();
    active.forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.renderAll();
    pushHistory();
  }

  // Auto-crop: find bounding box of non-transparent pixels and resize to 512x512
  async function autoCropAndExport(canvas: fabric.Canvas): Promise<{ dataUrl: string; blob: Blob }> {
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
    const img = new Image();
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl; });

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = img.width;
    tmpCanvas.height = img.height;
    const ctx = tmpCanvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;

    let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const idx = (y * img.width + x) * 4;
        if (pixels[idx + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If no content found, use full canvas
    if (maxX < minX || maxY < minY) {
      minX = 0; minY = 0; maxX = img.width - 1; maxY = img.height - 1;
    }

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const pad = Math.round(Math.max(cropW, cropH) * 0.05);

    const srcX = Math.max(0, minX - pad);
    const srcY = Math.max(0, minY - pad);
    const srcW = Math.min(img.width - srcX, cropW + pad * 2);
    const srcH = Math.min(img.height - srcY, cropH + pad * 2);

    // Create 512x512 output with centered content
    const outCanvas = document.createElement("canvas");
    outCanvas.width = 512;
    outCanvas.height = 512;
    const outCtx = outCanvas.getContext("2d")!;
    outCtx.clearRect(0, 0, 512, 512);

    const scale = Math.min(512 / srcW, 512 / srcH) * 0.9;
    const dw = srcW * scale;
    const dh = srcH * scale;
    const dx = (512 - dw) / 2;
    const dy = (512 - dh) / 2;
    outCtx.drawImage(tmpCanvas, srcX, srcY, srcW, srcH, dx, dy, dw, dh);

    const outDataUrl = outCanvas.toDataURL("image/webp", 0.9);
    const res = await fetch(outDataUrl);
    const blob = await res.blob();
    return { dataUrl: outDataUrl, blob };
  }

  async function exportSticker() {
    const c = canvasRef.current;
    if (!c) return;
    setExporting(true);
    setError(null);
    try {
      let dataUrl: string;
      let blob: Blob;

      if (animatedFrames && animatedFrames.length > 1) {
        blob = await gifFramesToAnimatedWebp(animatedFrames, 512);
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const result = await autoCropAndExport(c);
        dataUrl = result.dataUrl;
        blob = result.blob;
      }

      const err = validateSticker(blob);
      if (err) {
        setError(err);
        setExporting(false);
        return;
      }

      let packs = await packRepo.listPacks();
      let pack = packs.find((p) => !p.isCurated);
      if (!pack) {
        const trayIcon = await generateTrayIcon(dataUrl);
        pack = {
          id: crypto.randomUUID(),
          name: "Mis stickers",
          trayIconPath: trayIcon,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          exportedAt: null,
          isCurated: false,
        };
        await packRepo.savePack(pack);
        inc("packsCreated");
        addProgress("first_pack");
      } else if (!pack.trayIconPath) {
        const trayIcon = await generateTrayIcon(dataUrl);
        pack = { ...pack, trayIconPath: trayIcon };
        await packRepo.savePack(pack);
      }

      const sticker = {
        id: crypto.randomUUID(),
        packId: pack.id,
        imagePath: dataUrl,
        width: 512,
        height: 512,
        sizeBytes: blob.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await stickerRepo.saveSticker(sticker);
      addRecent(sticker.id);
      setAnimatedFrames(null);
      inc("stickersCreated");
      addProgress("first_sticker");
      addProgress("ten_stickers");
      await packRepo.savePack({ ...pack, updatedAt: Date.now() });
    } catch (e) {
      setError("Error al exportar el sticker.");
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
      {/* Canvas fills entire screen */}
      <div className="absolute inset-0">
        <StickerCanvas bgColor={bgColor} onReady={(c) => { canvasRef.current = c; pushHistory(); }} />
      </div>

      {/* Top floating bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent px-3 py-2">
        <Link to="/stickers" className="rounded-full bg-white/80 p-2 shadow dark:bg-slate-800/80">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold shadow dark:bg-slate-800/80">
          Editor de sticker
        </span>
        <div className="flex gap-1">
          <button onClick={undo} disabled={historyIdx <= 0} className="rounded-full bg-white/80 p-2 shadow disabled:opacity-30 dark:bg-slate-800/80">
            <Undo2 className="h-5 w-5" />
          </button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} className="rounded-full bg-white/80 p-2 shadow disabled:opacity-30 dark:bg-slate-800/80">
            <Redo2 className="h-5 w-5" />
          </button>
          <button
            onClick={exportSticker}
            disabled={exporting}
            className="rounded-full bg-brand-600 px-3 py-2 text-xs font-medium text-white shadow disabled:opacity-50"
          >
            {exporting ? "..." : <Download className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute left-3 right-3 top-14 z-10 rounded-lg bg-red-50/90 px-3 py-2 text-xs text-red-600 shadow dark:bg-red-900/80 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Bottom floating toolbar - organized bottom to top: bg colors → tools → expanded options */}
      <div className="absolute bottom-4 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-slate-800/90">
        {/* Layer 1 (bottom): Background colors - always visible */}
        <div className="flex items-center justify-center gap-1.5 pb-1.5">
          <span className="text-[10px] text-slate-400">Fondo:</span>
          {["transparent", "#ffffff", "#000000", "#f87171", "#60a5fa", "#34d399"].map((color) => (
            <button
              key={color}
              onClick={() => setBackground(color)}
              className={`h-5 w-5 shrink-0 rounded-full border-2 ${bgColor === color ? "border-brand-600" : "border-slate-300 dark:border-slate-600"}`}
              style={{ backgroundColor: color === "transparent" ? "transparent" : color, backgroundImage: color === "transparent" ? "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)" : "none", backgroundSize: "6px 6px" }}
              aria-label={color}
            />
          ))}
        </div>

        {/* Layer 2 (middle): Scrollable toolbar */}
        <div className="flex justify-between gap-1 overflow-x-auto border-t border-slate-200 pt-1.5 scrollbar-hide dark:border-slate-700">
          <button onClick={() => { if (!showTextOptions) addText(); setShowTextOptions((v) => !v); setShowPenOptions(false); }} className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 active:bg-slate-100 dark:active:bg-slate-700">
            <Type className="h-5 w-5" />
            <span className="text-[10px]">Texto</span>
          </button>
          <button onClick={addImage} className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 active:bg-slate-100 dark:active:bg-slate-700">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px]">Imagen</span>
          </button>
          <button onClick={deleteSelected} className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 active:bg-slate-100 dark:active:bg-slate-700">
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px]">Borrar</span>
          </button>
          <button
            onClick={() => { togglePen(); setShowPenOptions(!showPenOptions); setShowTextOptions(false); }}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 active:bg-slate-100 dark:active:bg-slate-700 ${penMode ? "bg-brand-100 dark:bg-brand-900/40" : ""}`}
          >
            <Pen className="h-5 w-5" />
            <span className="text-[10px]">Lápiz</span>
          </button>
          <button
            onClick={async () => {
              const c = canvasRef.current;
              const active = c?.getActiveObject();
              if (!active || active.type !== "image") {
                alert("Seleccioná una imagen primero.");
                return;
              }
              const imgEl = (active as any)._element as HTMLImageElement | undefined;
              if (imgEl?.src) {
                const res = await fetch(imgEl.src);
                const blob = await res.blob();
                setBgImageBlob(blob);
                setShowBgModal(true);
              }
            }}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 active:bg-slate-100 dark:active:bg-slate-700"
          >
            <Eraser className="h-5 w-5" />
            <span className="text-[10px]">Fondo</span>
          </button>
        </div>

        {/* Layer 3 (top): Expanded options - Text */}
        {showTextOptions && (
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Fuente:</span>
              <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
                {TEXT_FONTS.map((font) => (
                  <button
                    key={font}
                    onClick={() => { setTextFont(font); updateActiveTextFont(font); }}
                    className={`shrink-0 rounded px-2 py-0.5 text-[10px] ${textFont === font ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Color:</span>
              <div className="flex gap-1">
                {PEN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setTextColor(color); updateActiveTextColor(color); }}
                    className={`h-5 w-5 rounded-full border ${textColor === color ? "border-brand-600 ring-1 ring-brand-600" : "border-slate-300"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layer 3 (top): Expanded options - Pen */}
        {showPenOptions && (
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Color:</span>
              <div className="flex gap-1">
                {PEN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updatePenColor(color)}
                    className={`h-5 w-5 rounded-full border ${penColor === color ? "border-brand-600 ring-1 ring-brand-600" : "border-slate-300"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Grosor:</span>
              <div className="flex gap-1">
                {PEN_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => updatePenSize(size)}
                    className={`flex h-6 w-6 items-center justify-center rounded ${penSize === size ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
                  >
                    <div className="rounded-full bg-current" style={{ width: Math.min(size, 12), height: Math.min(size, 12) }} />
                  </button>
                ))}
              </div>
              <button
                onClick={togglePen}
                className={`ml-auto rounded-lg px-3 py-1 text-[10px] font-medium ${penMode ? "bg-red-500 text-white" : "bg-brand-600 text-white"}`}
              >
                {penMode ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showBgModal && (
        <BgRemovalModal
          imageBlob={bgImageBlob}
          onClose={() => { setShowBgModal(false); setBgImageBlob(null); }}
          onResult={async (blob) => {
            const c = canvasRef.current;
            if (!c) return;
            const url = URL.createObjectURL(blob);
            const newImg = await fabric.FabricImage.fromURL(url);
            const active = c.getActiveObject();
            if (active) {
              newImg.set({ left: active.left, top: active.top, scaleX: active.scaleX, scaleY: active.scaleY });
              c.remove(active);
            }
            c.add(newImg);
            c.setActiveObject(newImg);
            c.renderAll();
            pushHistory();
          }}
        />
      )}
    </div>
  );
}