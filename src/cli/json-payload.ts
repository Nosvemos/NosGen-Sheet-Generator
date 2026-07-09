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
  const mode = config.mode ?? "normal";
  const pivot = config.export?.pivot ?? "top-left";
  const exportScale = config.export?.scale ?? 1;
  const placements = resolveFramePlacements(layout, frames);

  const exportedFrames = frames.map((frame, index) => {
    const rect = placements[index];
    const base: Record<string, unknown> = {
      name: frame.name,
      x: Math.round(rect.x * scaleX),
      y: Math.round(rect.y * scaleY),
      w: Math.max(1, Math.round(rect.w * scaleX)),
      h: Math.max(1, Math.round(rect.h * scaleY)),
    };

    if (mode === "character" && frame.points.length > 0) {
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

  const groups =
    mode === "character" && config.pointGroups && config.pointGroups.length > 0
      ? buildGroupsPayload(config, frames)
      : undefined;

  const animation =
    mode === "animation" && config.animation
      ? buildAnimationPayload(config, frames)
      : undefined;

  return {
    meta: {
      app: "NosGen",
      image: `${math.normalizeExportName(config.name || "sprite", "sprite")}_atlas.${config.export?.format ?? "png"}`,
      size: { w: targetWidth, h: targetHeight },
      rows: layout.rows,
      columns: layout.columns,
      padding: Math.round(layout.padding * scaleX),
      scale: exportScale,
      pivot,
      ...(mode === "character"
        ? { spriteDirection: config.spriteDirection ?? "clockwise" }
        : {}),
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
