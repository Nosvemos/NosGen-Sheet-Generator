import type { TranslationKey } from "@/lib/i18n";
import type { FrameData, PivotMode, SpriteDirection } from "@/lib/editor-types";
import {
  clamp,
  createId,
  createPointColor,
  fromPivotCoords,
} from "@/lib/editor-helpers";

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
  spriteDirection?: SpriteDirection;
  pivotMode?: PivotMode;
} => {
  if (!parsed || typeof parsed !== "object") {
    return { frames: baseFrames };
  }
  const payload = parsed as {
    meta?: {
      pivot?: unknown;
      pivotMode?: unknown;
      spriteDirection?: unknown;
    };
    frames?: unknown;
  };
  const pivotRaw = payload.meta?.pivot ?? payload.meta?.pivotMode;
  const pivotMode =
    pivotRaw === "top-left" ||
    pivotRaw === "bottom-left" ||
    pivotRaw === "center"
      ? pivotRaw
      : undefined;
  const spriteDirection =
    payload.meta?.spriteDirection === "clockwise" ||
    payload.meta?.spriteDirection === "counterclockwise"
      ? payload.meta?.spriteDirection
      : undefined;
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

  const framesPayload = Array.isArray(payload.frames)
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
      if (!match || !Array.isArray(match.points)) {
        return frame;
      }
      const nextPoints = match.points.map(
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
      return { ...frame, points: nextPoints };
    });
    return { frames: nextFrames, spriteDirection, pivotMode };
  }

  const entries = Object.entries(payload).filter(
    ([key, value]) => key !== "meta" && Array.isArray(value)
  );
  if (entries.length === 0) {
    return { frames: baseFrames, spriteDirection, pivotMode };
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
  return { frames: nextFrames, spriteDirection, pivotMode };
};

export const buildGroupsFromJson = (parsed: unknown, baseFrames: FrameData[]) => {
  if (!parsed || typeof parsed !== "object") {
    return [];
  }
  const payload = parsed as { groups?: Record<string, unknown> };
  if (!payload.groups || typeof payload.groups !== "object") {
    return [];
  }
  const nameToId = new Map<string, string>();
  baseFrames[0]?.points.forEach((point) => {
    nameToId.set(point.name, point.id);
  });
  return Object.entries(payload.groups).map(([name, rawEntries]) => {
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
