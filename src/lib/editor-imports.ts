import type { TranslationKey } from "@/lib/i18n";
import type { FrameData, PivotMode, SpriteDirection } from "@/lib/editor-types";
import {
  clamp,
  createId,
  createPointColor,
  fromPivotCoords,
} from "@/lib/editor-helpers";
import { normalizeAtlasPayload } from "@/lib/atlas-format";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export const importPointsJsonToFrames = (
  parsed: unknown,
  baseFrames: FrameData[],
  t: Translate
): {
  frames: FrameData[];
  rotation?: SpriteDirection;
  spriteDirection?: SpriteDirection;
  pivotMode?: PivotMode;
  exportSize?: number;
} => {
  parsed = normalizeAtlasPayload(parsed);
  if (!parsed || typeof parsed !== "object") {
    return { frames: baseFrames };
  }
  const payload = parsed as {
    meta?: Record<string, unknown>;
    scale?: number;
    frames?: unknown;
    points?: unknown;
  };
  const pivotRaw = payload.meta?.pivot ?? payload.meta?.pivotMode;
  const pivotMode =
    pivotRaw === "top-left" ||
    pivotRaw === "bottom-left" ||
    pivotRaw === "center"
      ? pivotRaw
      : undefined;
  const rotation =
    payload.meta?.rotation === "clockwise" ||
    payload.meta?.rotation === "counterclockwise"
      ? payload.meta?.rotation
      : payload.meta?.spriteDirection === "clockwise" ||
        payload.meta?.spriteDirection === "counterclockwise"
        ? payload.meta?.spriteDirection
        : undefined;
  const spriteDirection = rotation;
  const exportSizeRaw = Number(
    payload.meta?.scale ?? payload.meta?.exportSize ?? payload.scale
  );
  const exportSize = Number.isFinite(exportSizeRaw) ? exportSizeRaw : undefined;
  const nameToId = new Map<string, string>();
  const nameToColor = new Map<string, string>();
  const buildPoint = (
    name: string,
    point: { x?: number; y?: number },
    frame: FrameData
  ) => {
    const id = nameToId.get(name) ?? createId();
    nameToId.set(name, id);
    const color = nameToColor.get(name) ?? createPointColor();
    nameToColor.set(name, color);
    const pivotPoint = {
      x: Number(point.x ?? 0),
      y: Number(point.y ?? 0),
    };
    const framePoint = fromPivotCoords(
      pivotPoint,
      frame,
      pivotMode ?? "top-left"
    );
    return {
      id,
      name,
      color,
      x: clamp(Math.round(framePoint.x), 0, frame.width),
      y: clamp(Math.round(framePoint.y), 0, frame.height),
      isKeyframe: true,
    };
  };

  // 1. Standard Schema where payload.frames is an array of objects with points property
  const framesPayload = Array.isArray(payload.frames) && typeof payload.frames[0] === "object"
    ? (payload.frames as Array<{
        name?: string;
        filename?: string;
        id?: string;
        points?: unknown;
      }>)
    : null;

  if (framesPayload) {
    const nextFrames = baseFrames.map((frame) => {
      const match = framesPayload.find(
        (entry: { name?: string; filename?: string; id?: string }) =>
          entry?.name === frame.name ||
          entry?.filename === frame.name ||
          entry?.id === frame.id
      );
      if (!match) {
        return frame;
      }
      let nextPoints: ReturnType<typeof buildPoint>[] = [];
      if (Array.isArray(match.points)) {
        nextPoints = match.points.map(
          (
            point: { name?: string; x?: number; y?: number },
            index: number
          ) => {
            const name =
              typeof point.name === "string" && point.name.length > 0
                ? point.name
                : t("point.defaultName", { index: index + 1 });
            return buildPoint(name, point, frame);
          }
        );
      } else if (match.points && typeof match.points === "object") {
        nextPoints = Object.entries(
          match.points as Record<string, unknown>
        ).flatMap(([rawName, rawPoints], index) => {
          const pointList = Array.isArray(rawPoints) ? rawPoints : [];
          const firstValid = pointList.find(
            (entry) =>
              entry &&
              typeof entry === "object" &&
              Number.isFinite(Number((entry as { x?: number }).x)) &&
              Number.isFinite(Number((entry as { y?: number }).y))
          ) as { x?: number; y?: number } | undefined;
          if (!firstValid) {
            return [];
          }
          const name =
            typeof rawName === "string" && rawName.length > 0
              ? rawName
              : t("point.defaultName", { index: index + 1 });
          return [buildPoint(name, firstValid, frame)];
        });
      } else {
        return frame;
      }
      return { ...frame, points: nextPoints };
    });
    return { frames: nextFrames, rotation, spriteDirection, pivotMode, exportSize };
  }

  // 2. Raylib Schema or Root Object Map where payload.points is an object: { [pointName]: [[x, y], ...] }
  const pointsObj =
    payload.points && typeof payload.points === "object" && !Array.isArray(payload.points)
      ? (payload.points as Record<string, unknown>)
      : null;

  const entries = pointsObj
    ? Object.entries(pointsObj).filter(([, val]) => Array.isArray(val))
    : Object.entries(payload).filter(
        ([key, value]) => key !== "meta" && Array.isArray(value)
      );

  if (entries.length === 0) {
    return { frames: baseFrames, rotation, spriteDirection, pivotMode, exportSize };
  }

  const nextFrames = baseFrames.map((frame, frameIndex) => {
    const nextPoints = entries.map(([rawName, rawPoints], index) => {
      const name =
        typeof rawName === "string" && rawName.length > 0
          ? rawName
          : t("point.defaultName", { index: index + 1 });
      const id = nameToId.get(name) ?? createId();
      nameToId.set(name, id);
      const color = nameToColor.get(name) ?? createPointColor();
      nameToColor.set(name, color);
      const pointList = Array.isArray(rawPoints) ? rawPoints : [];
      const entry = pointList[frameIndex];
      let x = 0;
      let y = 0;
      let isKeyframe = false;
      if (Array.isArray(entry) && entry.length >= 2) {
        const rawX = Number(entry[0]);
        const rawY = Number(entry[1]);
        if (Number.isFinite(rawX) && Number.isFinite(rawY)) {
          const framePoint = fromPivotCoords(
            { x: rawX, y: rawY },
            frame,
            pivotMode ?? "top-left"
          );
          x = clamp(Math.round(framePoint.x), 0, frame.width);
          y = clamp(Math.round(framePoint.y), 0, frame.height);
          isKeyframe = true;
        }
      }
      return {
        id,
        name,
        color,
        x,
        y,
        isKeyframe,
      };
    });
    return { ...frame, points: nextPoints };
  });
  return { frames: nextFrames, rotation, spriteDirection, pivotMode, exportSize };
};

export const buildGroupsFromJson = (parsed: unknown, baseFrames: FrameData[]) => {
  parsed = normalizeAtlasPayload(parsed);
  if (!parsed || typeof parsed !== "object") {
    return [];
  }
  const payload = parsed as {
    groups?: Record<string, unknown>;
    point_groups?: Record<string, unknown>;
  };
  const rawGroups = payload.point_groups ?? payload.groups;
  if (!rawGroups || typeof rawGroups !== "object") {
    return [];
  }
  const nameToId = new Map<string, string>();
  baseFrames[0]?.points.forEach((point) => {
    nameToId.set(point.name, point.id);
  });
  return Object.entries(rawGroups).map(([name, rawEntries]) => {
    const entries = Array.isArray(rawEntries) ? rawEntries : [];
    const mappedEntries = entries.map((entry) => {
      if (!Array.isArray(entry)) {
        return [];
      }
      return entry
        .map((pointName) =>
          typeof pointName === "string" ? nameToId.get(pointName) : undefined
        )
        .filter(Boolean) as string[];
    });
    return {
      id: createId(),
      name,
      entries: mappedEntries,
    };
  });
};
