import {
  computeAtlasLayoutByMode,
  type SizedItem,
} from "../lib/atlas-layout.ts";
import type { CliConfig } from "./types.ts";

export function buildLayout(
  frames: SizedItem[],
  packingConfig: NonNullable<CliConfig["packing"]>
) {
  const padding = packingConfig.padding ?? 2;
  const mode = packingConfig.mode ?? "shelf";
  const rows =
    packingConfig.rows ??
    (mode === "uniform" ? 4 : Math.max(1, Math.ceil(Math.sqrt(frames.length))));
  return computeAtlasLayoutByMode(frames, { mode, rows, padding });
}
