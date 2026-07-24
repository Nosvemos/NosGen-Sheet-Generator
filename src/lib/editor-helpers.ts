import type { FrameData, PivotMode } from "@/lib/editor-types";
import { loadAtlasImageFromFile } from "@/lib/texture-codecs";

export {
  computeAtlasLayout,
  computeTightAtlasLayout,
  computeShelfAtlasLayout,
  computeAtlasLayoutByMode,
  resolveFramePlacements,
  type SizedItem,
  type ShelfAtlasLayout,
  type FramePlacement,
} from "@/lib/atlas-layout";

// Pure math lives in sprite-math so the headless CLI can share it. Import the
// editor-facing surface locally (some helpers below use it) and re-export it to
// keep existing import sites stable.
import {
  clamp,
  createId,
  createPointColor,
  normalizeExportName,
  sanitizeFrameName,
  toPivotCoords,
  fromPivotCoords,
  computeEllipseFit,
  computeCircleFit,
  computeSquareFit,
  squarePointAt,
  interpolateLinear,
  interpolateTangent,
} from "@/lib/sprite-math";

export {
  clamp,
  createId,
  createPointColor,
  normalizeExportName,
  sanitizeFrameName,
  toPivotCoords,
  fromPivotCoords,
  computeEllipseFit,
  computeCircleFit,
  computeSquareFit,
  squarePointAt,
  interpolateLinear,
  interpolateTangent,
};

export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];
export const MIN_EXPORT_SCALE = 0.25;
export const MAX_EXPORT_SCALE = 4;
export const EXPORT_SCALE_STEP = 0.25;
export const MIN_FRAME_ZOOM = 0.5;
export const MAX_FRAME_ZOOM = 8;
export const ZOOM_STEP = 1.1;
export const DEFAULT_ROWS = 4;
export const DEFAULT_PADDING = 6;
export const DEFAULT_FPS = 12;

export const PIVOT_OPTIONS: PivotMode[] = ["top-left", "bottom-left", "center"];

export const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const checkerboardPatternCache = new Map<string, CanvasPattern>();

const getCheckerboardPattern = (
  ctx: CanvasRenderingContext2D,
  size = 18,
  colorA = "rgba(255, 255, 255, 0.65)",
  colorB = "rgba(233, 233, 233, 0.7)"
) => {
  const key = `${size}|${colorA}|${colorB}`;
  const cached = checkerboardPatternCache.get(key);
  if (cached) {
    return cached;
  }
  const pCanvas = document.createElement("canvas");
  pCanvas.width = size * 2;
  pCanvas.height = size * 2;
  const pCtx = pCanvas.getContext("2d");
  if (!pCtx) {
    return null;
  }
  pCtx.fillStyle = colorA;
  pCtx.fillRect(0, 0, size * 2, size * 2);
  pCtx.fillStyle = colorB;
  pCtx.fillRect(0, 0, size, size);
  pCtx.fillRect(size, size, size, size);
  const pattern = ctx.createPattern(pCanvas, "repeat");
  if (pattern) {
    checkerboardPatternCache.set(key, pattern);
  }
  return pattern;
};

export const drawCheckerboard = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  size = 18,
  colorA = "rgba(255, 255, 255, 0.65)",
  colorB = "rgba(233, 233, 233, 0.7)"
) => {
  ctx.save();
  const pattern = getCheckerboardPattern(ctx, size, colorA, colorB);
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  } else {
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? colorA : colorB;
        ctx.fillRect(x, y, size, size);
      }
    }
  }
  ctx.restore();
};

export const toHslColor = (raw: string, fallback: string, alpha?: number) => {
  const value = raw.trim();
  if (!value) {
    return fallback;
  }
  if (typeof alpha === "number") {
    return `hsl(${value} / ${alpha})`;
  }
  return `hsl(${value})`;
};

export const loadFrameFromFile = async (file: File): Promise<FrameData> => {
  const img = await loadAtlasImageFromFile(file);
  return {
    id: createId(),
    name: sanitizeFrameName(file.name),
    image: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    points: [],
  };
};

export const loadImageFromFile = (file: File) => loadAtlasImageFromFile(file);

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
