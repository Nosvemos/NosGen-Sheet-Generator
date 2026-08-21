// Pure, DOM-free math shared by the web editor (editor-helpers) and the
// headless CLI (cli/math). Keep this file free of browser/node APIs and of
// path-alias imports so both build targets (vite + tsx) can consume it.
import type { PivotMode, SpriteDirection } from "./editor-types";
export {
  createId,
  createPointColor,
  deterministicColor,
  normalizeExportName,
} from "./sprite-identifiers";

export type MathKeyframe = { frameIndex: number; x: number; y: number };

export const sanitizeFrameName = (name: string): string => {
  if (!name) return "frame";
  let clean = name.trim();
  while (/\.(png|jpg|jpeg|webp|ktx2|json)$/i.test(clean)) {
    clean = clean.replace(/\.[^/.]+$/, "");
  }
  return clean.trim() || "frame";
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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
  keyframes: MathKeyframe[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const baseAngles = keyframes.map(
    (point) => directionSign * (point.frameIndex / totalFrames) * Math.PI * 2
  );
  const phaseSteps = 720;
  const rotationSteps = 180;
  let best:
    | {
        error: number;
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        phase: number;
        rotation: number;
      }
    | undefined;

  for (let rotStep = 0; rotStep < rotationSteps; rotStep += 1) {
    const rotation = (rotStep / rotationSteps) * Math.PI;
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);
    const xs = keyframes.map((point) => point.x * cosRot + point.y * sinRot);
    const ys = keyframes.map((point) => -point.x * sinRot + point.y * cosRot);
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
      const error = xs.reduce((acc, value, index) => {
        const x = cx + rx * cosValues[index];
        const y = cy + ry * sinValues[index];
        return acc + (x - value) ** 2 + (y - ys[index]) ** 2;
      }, 0);
      if (!best || error < best.error) {
        best = { error, cx, cy, rx, ry, phase, rotation };
      }
    }
  }

  if (!best) {
    return null;
  }
  const cosRot = Math.cos(best.rotation);
  const sinRot = Math.sin(best.rotation);
  const cx = best.cx * cosRot - best.cy * sinRot;
  const cy = best.cx * sinRot + best.cy * cosRot;
  return {
    cx,
    cy,
    rx: best.rx,
    ry: best.ry,
    phase: best.phase,
    rotation: best.rotation,
  };
};

export const computeCircleFit = (
  keyframes: MathKeyframe[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const baseAngles = keyframes.map(
    (point) => directionSign * (point.frameIndex / totalFrames) * Math.PI * 2
  );
  const xs = keyframes.map((point) => point.x);
  const ys = keyframes.map((point) => point.y);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
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
    const meanCos =
      cosValues.reduce((sum, value) => sum + value, 0) / cosValues.length;
    const meanSin =
      sinValues.reduce((sum, value) => sum + value, 0) / sinValues.length;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < keyframes.length; i += 1) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      const cosDelta = cosValues[i] - meanCos;
      const sinDelta = sinValues[i] - meanSin;
      numerator += dx * cosDelta + dy * sinDelta;
      denominator += cosDelta * cosDelta + sinDelta * sinDelta;
    }
    if (Math.abs(denominator) < 1e-6) {
      continue;
    }
    const r = numerator / denominator;
    const cx = meanX - r * meanCos;
    const cy = meanY - r * meanSin;
    const error = keyframes.reduce((acc, point, index) => {
      const x = cx + r * cosValues[index];
      const y = cy + r * sinValues[index];
      return acc + (x - point.x) ** 2 + (y - point.y) ** 2;
    }, 0);
    if (!best || error < best.error) {
      best = { error, cx, cy, r, phase };
    }
  }

  if (!best) {
    return null;
  }
  return {
    cx: best.cx,
    cy: best.cy,
    r: best.r,
    phase: best.phase,
  };
};

const normalizeCycle = (value: number) => ((value % 1) + 1) % 1;

const computeSquareParam = (
  point: { x: number; y: number },
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
    return nx >= 0
      ? 0.125 + ny / (8 * size)
      : 0.625 - ny / (8 * size);
  }
  return ny >= 0
    ? 0.375 - nx / (8 * size)
    : 0.875 + nx / (8 * size);
};

export const computeSquareFit = (
  keyframes: MathKeyframe[],
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
  const sinSum = offsets.reduce(
    (sum, val) => sum + Math.sin(val * Math.PI * 2),
    0
  );
  const cosSum = offsets.reduce(
    (sum, val) => sum + Math.cos(val * Math.PI * 2),
    0
  );
  const averageAngle = Math.atan2(sinSum, cosSum);
  const phase = normalizeCycle(averageAngle / (Math.PI * 2));
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
  points: MathKeyframe[],
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
  const position = frame < startFrame ? frame + totalFrames : frame;
  const t = (position - startFrame) / (endFrame - startFrame || 1);
  return { start, end, t, startIndex, endIndex: endIndex % sorted.length, sorted };
};

export const interpolateLinear = (
  points: MathKeyframe[],
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
) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
};

export const interpolateTangent = (
  points: MathKeyframe[],
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
  const { start, end, t, startIndex, endIndex, sorted } = segment;
  const count = sorted.length;
  const p0 = sorted[(startIndex - 1 + count) % count] ?? start;
  const p3 = sorted[(endIndex + 1) % count] ?? end;
  return {
    x: catmullRom(p0.x, start.x, end.x, p3.x, t),
    y: catmullRom(p0.y, start.y, end.y, p3.y, t),
  };
};
