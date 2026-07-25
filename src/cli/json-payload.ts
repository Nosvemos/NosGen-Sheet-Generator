import { resolveFramePlacements } from "../lib/atlas-layout.ts";
import type { AtlasLayout } from "../lib/editor-types.ts";
import type { CliConfig } from "./types.ts";
import type { CliFrame } from "./frame-types.ts";
import { matchWildcard } from "./glob.ts";
import { buildGroups } from "./points.ts";
import * as math from "./math.ts";

export function buildJsonPayload(
  frames: CliFrame[],
  layout: AtlasLayout,
  config: CliConfig,
  targetWidth: number,
  targetHeight: number,
  scaleX: number,
  scaleY: number
) {
  const mode = (config.mode === "ship" || (config.mode as string) === "character") ? "ship" : (config.mode ?? "normal");
  const pivot = config.export?.pivot ?? "top-left";
  const exportScale = config.export?.scale ?? 1;
  const jsonMode = config.export?.jsonMode ?? "pretty";
  const rotation = config.rotation ?? config.spriteDirection ?? "clockwise";
  const placements = resolveFramePlacements(layout, frames);

  const groups =
    mode === "ship" && config.pointGroups && config.pointGroups.length > 0
      ? buildGroupsPayload(config, frames)
      : undefined;

  const animation =
    mode === "animation" && config.animation
      ? buildAnimationPayload(config, frames)
      : undefined;

  if (jsonMode === "raylib") {
    const isUniformSize =
      frames.length > 0 &&
      frames.every(
        (f) => f.width === frames[0].width && f.height === frames[0].height
      );

    const raylibFramesList: Array<number[]> = [];
    const raylibFrameNames: string[] = [];
    const raylibPointsMap: Record<string, Array<[number, number]>> = {};

    frames.forEach((frame, index) => {
      const rect = placements[index];
      const w = Math.max(1, Math.round(rect.w * scaleX));
      const h = Math.max(1, Math.round(rect.h * scaleY));

      raylibFrameNames.push(frame.name);
      if (isUniformSize) {
        raylibFramesList.push([
          Math.round(rect.x * scaleX),
          Math.round(rect.y * scaleY),
        ]);
      } else {
        raylibFramesList.push([
          Math.round(rect.x * scaleX),
          Math.round(rect.y * scaleY),
          w,
          h,
        ]);
      }

      if (mode === "ship" && frame.points.length > 0) {
        frame.points.forEach((point) => {
          const p = math.toPivotCoords(point, frame, pivot);
          if (!raylibPointsMap[point.name]) {
            raylibPointsMap[point.name] = [];
          }
          raylibPointsMap[point.name][index] = [
            Math.round(p.x * scaleX),
            Math.round(p.y * scaleY),
          ];
        });
      }
    });

    const frameNameToIndex = new Map<string, number>();
    frames.forEach((frame, index) => frameNameToIndex.set(frame.name, index));

    const selectedFrames = config.animation?.frameSelection
      ? frames.filter((frame) =>
          config.animation!.frameSelection!.some((pattern) =>
            matchWildcard(pattern, frame.name)
          )
        )
      : frames;

    const animationsMap =
      mode === "animation" && config.animation
        ? {
            [config.animation.name || "default"]: {
              fps: config.animation.fps ?? 12,
              speed: config.animation.speed ?? 1,
              loop: config.animation.loop ?? true,
              frames: selectedFrames.map(
                (frame) => frameNameToIndex.get(frame.name) ?? 0
              ),
            },
          }
        : undefined;

    const hasPoints = Object.keys(raylibPointsMap).length > 0;

    return {
      meta: {
        app: "NosGalaxy",
        version: "1.0",
        image: `${math.normalizeExportName(config.name || "sprite", "sprite")}_atlas.${config.export?.format ?? "png"}`,
        ...(isUniformSize && frames[0]
          ? {
              frameSize: [
                Math.round(frames[0].width * scaleX),
                Math.round(frames[0].height * scaleY),
              ],
            }
          : {}),
        padding: Math.round(layout.padding * scaleX),
        scale: exportScale,
        pivot,
        ...(mode === "ship" ? { rotation } : {}),
        mode,
      },
      ...(mode !== "ship" ? { frames: raylibFrameNames } : {}),
      rects: raylibFramesList,
      ...(animationsMap ? { animations: animationsMap } : {}),
      ...(mode === "ship" && hasPoints ? { points: raylibPointsMap } : {}),
      ...(groups ? { point_groups: groups } : {}),
    };
  }

  const exportedFrames = frames.map((frame, index) => {
    const rect = placements[index];
    const base: Record<string, unknown> = {
      name: frame.name,
      x: Math.round(rect.x * scaleX),
      y: Math.round(rect.y * scaleY),
      w: Math.max(1, Math.round(rect.w * scaleX)),
      h: Math.max(1, Math.round(rect.h * scaleY)),
    };

    if (mode === "ship" && frame.points.length > 0) {
      base.points = frame.points.map((point) => {
        const pivotPoint = math.toPivotCoords(point, frame, pivot);
        return {
          name: point.name,
          x: Math.round(pivotPoint.x * scaleX),
          y: Math.round(pivotPoint.y * scaleY),
        };
      });
    }

    return base;
  });

  return {
    meta: {
      app: "NosGalaxy",
      image: `${math.normalizeExportName(config.name || "sprite", "sprite")}_atlas.${config.export?.format ?? "png"}`,
      size: { w: targetWidth, h: targetHeight },
      padding: Math.round(layout.padding * scaleX),
      scale: exportScale,
      pivot,
      ...(mode === "ship" ? { rotation } : {}),
      mode,
    },
    ...(groups ? { groups } : {}),
    ...(animation ? { animation } : {}),
    frames: exportedFrames,
  };
}

const buildGroupsPayload = (config: CliConfig, frames: CliFrame[]) => {
  const builtGroups = buildGroups(config.pointGroups, frames);
  const idToName = new Map<string, string>();
  frames[0]?.points.forEach((point) => idToName.set(point.id, point.name));

  return builtGroups.reduce<Record<string, string[][]>>((acc, group) => {
    const safeName = group.name || `group-${group.name.slice(0, 6)}`;
    acc[safeName] = group.entries.map((entry) =>
      entry.map((id) => idToName.get(id) ?? id)
    );
    return acc;
  }, {});
};

const buildAnimationPayload = (config: CliConfig, frames: CliFrame[]) => {
  const selectedFrames = config.animation?.frameSelection
    ? frames.filter((frame) =>
        config.animation!.frameSelection!.some((pattern) =>
          matchWildcard(pattern, frame.name)
        )
      )
    : frames;

  return {
    name: config.animation?.name || "animation",
    fps: config.animation?.fps ?? 12,
    speed: config.animation?.speed ?? 1,
    loop: config.animation?.loop ?? true,
    frames: selectedFrames.map((frame) => frame.name),
  };
};
