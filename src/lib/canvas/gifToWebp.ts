import { parseGIF, decompressFrames } from "gifuct-js";

export interface GifFrame {
  canvas: HTMLCanvasElement;
  delay: number; // ms
}

export async function parseGif(file: File): Promise<{ width: number; height: number; frames: GifFrame[] }> {
  const buffer = await file.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);
  const width = gif.lsd.width;
  const height = gif.lsd.height;

  const result: GifFrame[] = [];
  // Render each frame
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  // Patch-based rendering: accumulate patches
  let currentCanvas = document.createElement("canvas");
  currentCanvas.width = width;
  currentCanvas.height = height;
  const currentCtx = currentCanvas.getContext("2d")!;

  for (const frame of frames) {
    const { dims, patch, delay } = frame;
    // Draw patch
    const patchCanvas = document.createElement("canvas");
    patchCanvas.width = dims.width;
    patchCanvas.height = dims.height;
    const patchCtx = patchCanvas.getContext("2d")!;
    const imageData = new ImageData(new Uint8ClampedArray(patch), dims.width, dims.height);
    patchCtx.putImageData(imageData, 0, 0);

    // Composite
    if (frame.disposalType === 2) {
      currentCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
    }
    currentCtx.drawImage(patchCanvas, dims.left, dims.top);

    // Clone for this frame
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    frameCanvas.getContext("2d")!.drawImage(currentCanvas, 0, 0);

    result.push({ canvas: frameCanvas, delay: delay || 100 });

    if (frame.disposalType === 2) {
      currentCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
    }
  }

  return { width, height, frames: result };
}

export async function gifFramesToAnimatedWebp(
  frames: GifFrame[],
  targetSize: number = 512,
): Promise<Blob> {
  // Render each frame to target size and encode as static WEBP
  const encodedFrames: { blob: Blob; delay: number }[] = [];
  for (const f of frames) {
    const c = document.createElement("canvas");
    c.width = targetSize;
    c.height = targetSize;
    const ctx = c.getContext("2d")!;
    // Fit to square
    const scale = Math.min(targetSize / f.canvas.width, targetSize / f.canvas.height);
    const w = f.canvas.width * scale;
    const h = f.canvas.height * scale;
    const x = (targetSize - w) / 2;
    const y = (targetSize - h) / 2;
    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.drawImage(f.canvas, x, y, w, h);
    const blob = await new Promise<Blob>((resolve) => {
      c.toBlob((b) => resolve(b!), "image/webp", 0.9);
    });
    encodedFrames.push({ blob, delay: f.delay });
  }

  // Construct animated WEBP RIFF container
  return buildAnimatedWebp(encodedFrames, targetSize, targetSize);
}

// Build animated WEBP from encoded static WEBP frames
async function buildAnimatedWebp(
  frames: { blob: Blob; delay: number }[],
  width: number,
  height: number,
): Promise<Blob> {
  // Extract VP8/VP8L data from each WEBP frame
  const frameData: Uint8Array[] = [];
  for (const f of frames) {
    const buf = await f.blob.arrayBuffer();
    const data = extractFrameData(new Uint8Array(buf));
    frameData.push(data);
  }

  // Construct RIFF
  // VP8X chunk
  const vp8x = new Uint8Array(10);
  const dv = new DataView(vp8x.buffer);
  dv.setUint32(0, 0x00000002, true); // animation flag (bit 1)
  dv.setUint32(4, width - 1, true); // canvas width - 1
  dv.setUint32(8, height - 1, true); // canvas height - 1... wait, this is wrong
  // VP8X: flags(1) + reserved(3) + canvas_width-1(3) + canvas_height-1(3)
  // Let me redo
  const vp8x2 = new Uint8Array(10);
  const dv2 = new DataView(vp8x2.buffer);
  dv2.setUint8(0, 0x02); // animation flag
  dv2.setUint8(1, 0);
  dv2.setUint8(2, 0);
  dv2.setUint8(3, 0);
  // canvas width - 1 (24 bits)
  dv2.setUint8(4, (width - 1) & 0xff);
  dv2.setUint8(5, ((width - 1) >> 8) & 0xff);
  dv2.setUint8(6, ((width - 1) >> 16) & 0xff);
  // canvas height - 1 (24 bits)
  dv2.setUint8(7, (height - 1) & 0xff);
  dv2.setUint8(8, ((height - 1) >> 8) & 0xff);
  dv2.setUint8(9, ((height - 1) >> 16) & 0xff);

  // ANIM chunk: bgcolor(4) + loop_count(2)
  const anim = new Uint8Array(6);
  const animDv = new DataView(anim.buffer);
  animDv.setUint32(0, 0x00000000, true); // bgcolor
  animDv.setUint16(4, 0, true); // loop count (0 = infinite)

  // Build chunks
  const chunks: Uint8Array[] = [];
  // VP8X
  chunks.push(makeChunk("VP8X", vp8x2));
  // ANIM
  chunks.push(makeChunk("ANIM", anim));

  // ANMF for each frame
  for (let i = 0; i < frames.length; i++) {
    const fd = frameData[i];
    const delay = Math.round(frames[i].delay / 10); // in 10ms units
    // ANMF header: x(3) + y(3) + width-1(3) + height-1(3) + duration(3) + flags(1) = 16 bytes
    const anmfHeader = new Uint8Array(16);
    const ad = new DataView(anmfHeader.buffer);
    ad.setUint8(0, 0); ad.setUint8(1, 0); ad.setUint8(2, 0); // x
    ad.setUint8(3, 0); ad.setUint8(4, 0); ad.setUint8(5, 0); // y
    ad.setUint8(6, (width - 1) & 0xff); ad.setUint8(7, ((width - 1) >> 8) & 0xff); ad.setUint8(8, ((width - 1) >> 16) & 0xff); // width-1
    ad.setUint8(9, (height - 1) & 0xff); ad.setUint8(10, ((height - 1) >> 8) & 0xff); ad.setUint8(11, ((height - 1) >> 16) & 0xff); // height-1
    ad.setUint8(12, delay & 0xff); ad.setUint8(13, (delay >> 8) & 0xff); ad.setUint8(14, (delay >> 16) & 0xff); // duration
    ad.setUint8(15, 0); // flags (0 = use alpha, no blending... simplified)

    const anmfPayload = new Uint8Array(anmfHeader.length + fd.length);
    anmfPayload.set(anmfHeader, 0);
    anmfPayload.set(fd, anmfHeader.length);
    chunks.push(makeChunk("ANMF", anmfPayload));
  }

  // Build RIFF
  let totalSize = 4; // "WEBP"
  for (const c of chunks) totalSize += 8 + c.length + (c.length % 2);

  const riff = new Uint8Array(12 + totalSize);
  const riffDv = new DataView(riff.buffer);
  // "RIFF"
  riff[0] = 0x52; riff[1] = 0x49; riff[2] = 0x46; riff[3] = 0x46;
  riffDv.setUint32(4, totalSize, true);
  // "WEBP"
  riff[4] = 0x57; riff[5] = 0x45; riff[6] = 0x42; riff[7] = 0x50;
  // Wait, that's wrong. Let me fix offsets.
  // RIFF: "RIFF" (4) + size (4) + "WEBP" (4) = 12 header
  // Then chunks

  // Redo properly
  const header = new Uint8Array(12);
  header[0] = 0x52; header[1] = 0x49; header[2] = 0x46; header[3] = 0x46; // RIFF
  new DataView(header.buffer).setUint32(4, totalSize, true);
  header[8] = 0x57; header[9] = 0x45; header[10] = 0x42; header[11] = 0x50; // WEBP

  const parts: Uint8Array[] = [header];
  for (const c of chunks) {
    parts.push(c);
    if (c.length % 2 !== 0) parts.push(new Uint8Array(1)); // padding
  }

  const totalLen = parts.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(totalLen);
  let off = 0;
  for (const p of parts) {
    result.set(p, off);
    off += p.length;
  }
  return new Blob([result], { type: "image/webp" });
}

function makeChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(8 + data.length);
  const dv = new DataView(chunk.buffer);
  for (let i = 0; i < 4; i++) chunk[i] = fourcc.charCodeAt(i);
  dv.setUint32(4, data.length, true);
  chunk.set(data, 8);
  return chunk;
}

function extractFrameData(webpBytes: Uint8Array): Uint8Array {
  // Parse RIFF WEBP, extract VP8/VP8L chunk data
  // Find "VP8 " or "VP8L" chunk
  let i = 12; // skip RIFF header
  while (i < webpBytes.length - 8) {
    const fourcc = String.fromCharCode(webpBytes[i], webpBytes[i + 1], webpBytes[i + 2], webpBytes[i + 3]);
    const size = new DataView(webpBytes.buffer, webpBytes.byteOffset + i + 4, 4).getUint32(0, true);
    if (fourcc === "VP8 " || fourcc === "VP8L") {
      // Return the chunk including header
      return webpBytes.slice(i, i + 8 + size);
    }
    i += 8 + size + (size % 2);
  }
  // Fallback: return whole thing
  return webpBytes;
}