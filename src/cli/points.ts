import type { CliPoint, CliPointGroup } from "./types.ts";
import type { CliFrame } from "./frame-types.ts";
import * as math from "./math.ts";

export function processPoints(frames: CliFrame[], pointsConfig?: CliPoint[]) {
  if (!pointsConfig || pointsConfig.length === 0) {
    return;
  }
  const totalFrames = frames.length;
  const nameToId = new Map<string, string>();

  for (const pointConfig of pointsConfig) {
    const id = nameToId.get(pointConfig.name) ?? math.createId();
    nameToId.set(pointConfig.name, id);
    const color = pointConfig.color ?? math.deterministicColor(pointConfig.name);

    let positions: Array<{ x: number; y: number }>;

    if (pointConfig.positions && pointConfig.positions.length > 0) {
      positions = pointConfig.positions.map((point) =>
        point ? { x: point.x, y: point.y } : { x: 0, y: 0 }
      );
      while (positions.length < totalFrames) {
        positions.push({ x: 0, y: 0 });
      }
    } else if (
      pointConfig.keyframes &&
      pointConfig.keyframes.length > 0 &&
      pointConfig.autoFill &&
      pointConfig.autoFill.enabled !== false
    ) {
      positions = buildAutoFillPositions(pointConfig, totalFrames);
    } else {
      positions = Array.from({ length: totalFrames }, () => ({ x: 0, y: 0 }));
    }

    for (let index = 0; index < totalFrames; index++) {
      const frame = frames[index];
      const position = positions[index];
      const isKeyframe =
        pointConfig.keyframes?.some((keyframe) => keyframe.frameIndex === index) ??
        false;
      frame.points.push({
        id,
        name: pointConfig.name,
        x: math.clamp(Math.round(position.x), 0, frame.width),
        y: math.clamp(Math.round(position.y), 0, frame.height),
        color,
        isKeyframe,
      });
    }
  }
}

const buildAutoFillPositions = (pointConfig: CliPoint, totalFrames: number) => {
  const positions: Array<{ x: number; y: number }> = [];
  const keyframes = pointConfig.keyframes ?? [];
  const autoFill = pointConfig.autoFill;
  const direction = autoFill?.rotation ?? autoFill?.spriteDirection ?? "clockwise";

  for (let index = 0; index < totalFrames; index++) {
    switch (autoFill?.shape) {
      case "linear":
        positions.push(math.interpolateLinear(keyframes, index, totalFrames));
        break;
      case "tangent":
        positions.push(math.interpolateTangent(keyframes, index, totalFrames));
        break;
      case "ellipse":
        positions.push(resolveEllipsePosition(keyframes, index, totalFrames, direction));
        break;
      case "circle":
        positions.push(resolveCirclePosition(keyframes, index, totalFrames, direction));
        break;
      case "square":
        positions.push(resolveSquarePosition(keyframes, index, totalFrames, direction));
        break;
      default:
        positions.push(math.interpolateLinear(keyframes, index, totalFrames));
    }
  }

  return positions;
};

const resolveEllipsePosition = (
  keyframes: NonNullable<CliPoint["keyframes"]>,
  index: number,
  totalFrames: number,
  direction: "clockwise" | "counterclockwise"
) => {
  const model = math.computeEllipseFit(keyframes, totalFrames, direction);
  if (!model) {
    return math.interpolateLinear(keyframes, index, totalFrames);
  }
  const cosRot = Math.cos(model.rotation);
  const sinRot = Math.sin(model.rotation);
  const angle =
    (index / totalFrames) *
      Math.PI *
      2 *
      (direction === "clockwise" ? 1 : -1) +
    model.phase;
  const localX = model.rx * Math.cos(angle);
  const localY = model.ry * Math.sin(angle);
  return {
    x: model.cx + localX * cosRot - localY * sinRot,
    y: model.cy + localX * sinRot + localY * cosRot,
  };
};

const resolveCirclePosition = (
  keyframes: NonNullable<CliPoint["keyframes"]>,
  index: number,
  totalFrames: number,
  direction: "clockwise" | "counterclockwise"
) => {
  const model = math.computeCircleFit(keyframes, totalFrames, direction);
  if (!model) {
    return math.interpolateLinear(keyframes, index, totalFrames);
  }
  const angle =
    (index / totalFrames) *
      Math.PI *
      2 *
      (direction === "clockwise" ? 1 : -1) +
    model.phase;
  return {
    x: model.cx + model.r * Math.cos(angle),
    y: model.cy + model.r * Math.sin(angle),
  };
};

const resolveSquarePosition = (
  keyframes: NonNullable<CliPoint["keyframes"]>,
  index: number,
  totalFrames: number,
  direction: "clockwise" | "counterclockwise"
) => {
  const model = math.computeSquareFit(keyframes, totalFrames, direction);
  if (!model) {
    return math.interpolateLinear(keyframes, index, totalFrames);
  }
  const turn =
    (index / totalFrames) * (direction === "clockwise" ? 1 : -1) + model.phase;
  return math.squarePointAt(model.cx, model.cy, model.size, turn);
};

export function buildGroups(
  groupsConfig: CliPointGroup[] | undefined,
  frames: CliFrame[]
): Array<{ name: string; entries: string[][] }> {
  if (!groupsConfig || groupsConfig.length === 0) {
    return [];
  }
  const nameToId = new Map<string, string>();
  frames[0]?.points.forEach((point) => nameToId.set(point.name, point.id));
  return groupsConfig.map((group) => ({
    name: group.name,
    entries: group.entries.map((entry) =>
      entry
        .map((name) => nameToId.get(name))
        .filter((id): id is string => Boolean(id))
    ),
  }));
}
