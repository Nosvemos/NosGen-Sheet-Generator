import type {
  AtlasLayout,
  FrameData,
  KeyframePoint,
  PivotMode,
  SpriteDirection,
} from "@/lib/editor-types";

export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];
export const MIN_EXPORT_SCALE = 0.5;
export const MAX_EXPORT_SCALE = 4;
export const EXPORT_SCALE_STEP = 0.5;
export const MIN_FRAME_ZOOM = 0.5;
export const MAX_FRAME_ZOOM = 8;
export const ZOOM_STEP = 1.1;
export const DEFAULT_ROWS = 4;
export const DEFAULT_PADDING = 6;
export const DEFAULT_FPS = 12;

export const PIVOT_OPTIONS: PivotMode[] = ["top-left", "bottom-left", "center"];

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pt-${Math.random().toString(36).slice(2, 10)}`;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const createPointColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 55%)`;
};

export const normalizeExportName = (value: string, fallback: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const safe = trimmed
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  return safe || fallback;
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
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? colorA : colorB;
      ctx.fillRect(x, y, size, size);
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

export const computeAtlasLayout = (
  frames: FrameData[],
  rows: number,
  padding: number
): AtlasLayout => {
  const safePadding = Math.max(0, Math.round(padding));
  const safeRows = Math.max(1, Math.round(rows) || 1);
  const cellWidth = Math.max(1, ...frames.map((frame) => frame.width));
  const cellHeight = Math.max(1, ...frames.map((frame) => frame.height));
  const columns = Math.max(1, Math.ceil(frames.length / safeRows));
  const width = columns * cellWidth + safePadding * (columns + 1);
  const height = safeRows * cellHeight + safePadding * (safeRows + 1);
  const positions = frames.map((_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      x: safePadding + column * (cellWidth + safePadding),
      y: safePadding + row * (cellHeight + safePadding),
      w: cellWidth,
      h: cellHeight,
    };
  });

  return {
    rows: safeRows,
    columns,
    padding: safePadding,
    cellWidth,
    cellHeight,
    width,
    height,
    positions,
  };
};

export const toPivotCoords = (
  point: { x: number; y: number },
  frame: { width: number; height: number },
  mode: PivotMode
) => {
  if (mode === "center") {
    return {
      x: point.x - frame.width / 2,
      y: point.y - frame.height / 2,
    };
  }
  if (mode === "bottom-left") {
    return {
      x: point.x,
      y: frame.height - point.y,
    };
  }
  return { x: point.x, y: point.y };
};

export const fromPivotCoords = (
  point: { x: number; y: number },
  frame: { width: number; height: number },
  mode: PivotMode
) => {
  if (mode === "center") {
    return {
      x: point.x + frame.width / 2,
      y: point.y + frame.height / 2,
    };
  }
  if (mode === "bottom-left") {
    return {
      x: point.x,
      y: frame.height - point.y,
    };
  }
  return { x: point.x, y: point.y };
};

const solveLinear = (inputs: number[], outputs: number[]) => {
  const count = inputs.length;
  if (count === 0) {
    return { intercept: 0, slope: 0, valid: false };
  }
  let sumInput = 0;
  let sumInput2 = 0;
  let sumOutput = 0;
  let sumOutputInput = 0;
  for (let i = 0; i < count; i += 1) {
    const input = inputs[i];
    const output = outputs[i];
    sumInput += input;
    sumInput2 += input * input;
    sumOutput += output;
    sumOutputInput += output * input;
  }
  const det = count * sumInput2 - sumInput * sumInput;
  if (Math.abs(det) < 1e-6) {
    return {
      intercept: sumOutput / count,
      slope: 0,
      valid: false,
    };
  }
  const intercept = (sumOutput * sumInput2 - sumInput * sumOutputInput) / det;
  const slope = (count * sumOutputInput - sumInput * sumOutput) / det;
  return { intercept, slope, valid: true };
};

export const computeEllipseFit = (
  keyframes: KeyframePoint[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const baseAngles = keyframes.map(
    (point) =>
      directionSign * (point.frameIndex / totalFrames) * Math.PI * 2
  );
  const xs = keyframes.map((point) => point.x);
  const ys = keyframes.map((point) => point.y);
  const phaseSteps = 720;
  let best:
    | {
        error: number;
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        phase: number;
      }
    | undefined;

  for (let step = 0; step < phaseSteps; step += 1) {
    const phase = (step / phaseSteps) * Math.PI * 2;
    const cosValues = baseAngles.map((angle) => Math.cos(angle + phase));
    const sinValues = baseAngles.map((angle) => Math.sin(angle + phase));
    const xFit = solveLinear(cosValues, xs);
    const yFit = solveLinear(sinValues, ys);
    if (!xFit.valid || !yFit.valid) {
      continue;
    }
    const cx = xFit.intercept;
    const cy = yFit.intercept;
    const rx = xFit.slope;
    const ry = yFit.slope;
    const error = keyframes.reduce((acc, point, index) => {
      const x = cx + rx * cosValues[index];
      const y = cy + ry * sinValues[index];
      return acc + (x - point.x) ** 2 + (y - point.y) ** 2;
    }, 0);
    if (!best || error < best.error) {
      best = { error, cx, cy, rx, ry, phase };
    }
  }

  if (!best) {
    return null;
  }
  return {
    cx: best.cx,
    cy: best.cy,
    rx: Math.abs(best.rx),
    ry: Math.abs(best.ry),
    phase: best.phase,
  };
};

export const computeCircleFit = (
  keyframes: KeyframePoint[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const baseAngles = keyframes.map(
    (point) =>
      directionSign * (point.frameIndex / totalFrames) * Math.PI * 2
  );
  const phaseSteps = 720;
  let best:
    | {
        error: number;
        cx: number;
        cy: number;
        r: number;
        phase: number;
      }
    | undefined;

  for (let step = 0; step < phaseSteps; step += 1) {
    const phase = (step / phaseSteps) * Math.PI * 2;
    const cosValues = baseAngles.map((angle) => Math.cos(angle + phase));
    const sinValues = baseAngles.map((angle) => Math.sin(angle + phase));
    const sumC = cosValues.reduce((sum, value) => sum + value, 0);
    const sumS = sinValues.reduce((sum, value) => sum + value, 0);
    const count = keyframes.length;
    const sumX = keyframes.reduce((sum, point) => sum + point.x, 0);
    const sumY = keyframes.reduce((sum, point) => sum + point.y, 0);
    const term = (sumC * sumX + sumS * sumY) / count;
    const r =
      (sumX * sumC + sumY * sumS - count * term) /
      (sumC * sumC + sumS * sumS || 1);
    const cx = (sumX - r * sumC) / count;
    const cy = (sumY - r * sumS) / count;
    const error = keyframes.reduce((acc, point, index) => {
      const x = cx + r * cosValues[index];
      const y = cy + r * sinValues[index];
      return acc + (x - point.x) ** 2 + (y - point.y) ** 2;
    }, 0);
    if (!best || error < best.error) {
      best = { error, cx, cy, r: Math.abs(r), phase };
    }
  }

  if (!best) {
    return null;
  }
  return {
    cx: best.cx,
    cy: best.cy,
    r: Math.abs(best.r),
    phase: best.phase,
  };
};

const normalizeCycle = (value: number) => ((value % 1) + 1) % 1;

const computeSquareParam = (
  point: KeyframePoint,
  cx: number,
  cy: number,
  size: number
) => {
  const dx = point.x - cx;
  const dy = point.y - cy;
  const clampAxis = (value: number) => clamp(value, -size, size);
  const nx = clampAxis(dx);
  const ny = clampAxis(dy);
  const absX = Math.abs(nx);
  const absY = Math.abs(ny);
  if (absX >= absY) {
    return nx >= 0 ? ny / (2 * size) : 0.5 + ny / (2 * size);
  }
  return ny >= 0
    ? 0.25 + nx / (2 * size)
    : 0.75 + nx / (2 * size);
};

export const computeSquareFit = (
  keyframes: KeyframePoint[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const xs = keyframes.map((point) => point.x);
  const ys = keyframes.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const size = Math.max(maxX - minX, maxY - minY) / 2 || 1;
  const directionSign = direction === "clockwise" ? 1 : -1;
  const params = keyframes.map((point) =>
    computeSquareParam(point, cx, cy, size)
  );
  const normalizedParams = params.map((param) =>
    normalizeCycle(param * directionSign)
  );
  const offsets = normalizedParams.map(
    (param, index) => param - keyframes[index].frameIndex / totalFrames
  );
  const averageOffset =
    offsets.reduce((sum, value) => sum + value, 0) / offsets.length;
  const phase = normalizeCycle(averageOffset);
  return { cx, cy, size, phase };
};

export const squarePointAt = (
  cx: number,
  cy: number,
  size: number,
  turn: number
) => {
  const normalized = normalizeCycle(turn);
  const step = normalized * 4;
  const segment = Math.floor(step);
  const local = step - segment;
  switch (segment) {
    case 0:
      return { x: cx + size, y: cy - size + local * 2 * size };
    case 1:
      return { x: cx + size - local * 2 * size, y: cy + size };
    case 2:
      return { x: cx - size, y: cy + size - local * 2 * size };
    default:
      return { x: cx - size + local * 2 * size, y: cy - size };
  }
};

const resolveCyclicSegment = (
  points: KeyframePoint[],
  index: number,
  totalFrames: number
) => {
  if (points.length === 0 || totalFrames <= 0) {
    return null;
  }
  const sorted = [...points].sort((a, b) => a.frameIndex - b.frameIndex);
  const frame = index % totalFrames;
  let startIndex = sorted.length - 1;
  let endIndex = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].frameIndex <= frame) {
      startIndex = i;
    }
    if (sorted[i].frameIndex > frame) {
      endIndex = i;
      break;
    }
  }
  const start = sorted[startIndex];
  const end = sorted[endIndex % sorted.length];
  const startFrame = start.frameIndex;
  const endFrame =
    end.frameIndex <= startFrame ? end.frameIndex + totalFrames : end.frameIndex;
  const position =
    frame < startFrame ? frame + totalFrames : frame;
  const t = (position - startFrame) / (endFrame - startFrame || 1);
  return { start, end, t, startIndex, endIndex: endIndex % sorted.length };
};

export const interpolateLinear = (
  points: KeyframePoint[],
  index: number,
  totalFrames: number
) => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const segment = resolveCyclicSegment(points, index, totalFrames);
  if (!segment) {
    return { x: points[0].x, y: points[0].y };
  }
  const { start, end, t } = segment;
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
};

const catmullRom = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
) =>
  0.5 *
  (2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

export const interpolateTangent = (
  points: KeyframePoint[],
  index: number,
  totalFrames: number
) => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const segment = resolveCyclicSegment(points, index, totalFrames);
  if (!segment) {
    return { x: points[0].x, y: points[0].y };
  }
  const { start, end, t, startIndex, endIndex } = segment;
  const count = points.length;
  const p0 = points[(startIndex - 1 + count) % count] ?? start;
  const p3 = points[(endIndex + 1) % count] ?? end;
  return {
    x: catmullRom(p0.x, start.x, end.x, p3.x, t),
    y: catmullRom(p0.y, start.y, end.y, p3.y, t),
  };
};

export const loadFrameFromFile = (file: File): Promise<FrameData> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const frame: FrameData = {
        id: createId(),
        name: file.name,
        image: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        points: [],
      };
      URL.revokeObjectURL(url);
      resolve(frame);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load ${file.name}`));
    };
    img.src = url;
  });

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load ${file.name}`));
    };
    img.src = url;
  });

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
