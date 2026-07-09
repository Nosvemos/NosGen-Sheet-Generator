import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  serializeAtlasPayload,
  type AtlasPayload,
} from "../lib/atlas-format.ts";
import type { CliAnimation, CliConfig, CliPointGroup } from "./types.ts";
import type { CliFrame } from "./frame-types.ts";
import { loadFramesFromDirectory, importAtlas } from "./import-atlas.ts";
import { buildJsonPayload } from "./json-payload.ts";
import { buildLayout } from "./layout.ts";
import { processPoints } from "./points.ts";
import { renderAtlas } from "./render-atlas.ts";
import * as math from "./math.ts";

export { matchWildcard } from "./glob.ts";
export { buildLayout } from "./layout.ts";
export { processPoints } from "./points.ts";
export { validateAtlasEntry } from "./import-atlas.ts";

export async function run(config: CliConfig) {
  const loaded = await loadInputFrames(config);
  const { frames } = loaded;

  applyImportedDefaults(config, loaded);
  applyModeSpecificData(config, frames, loaded);

  const layout = buildLayout(frames, config.packing ?? {});
  console.log(
    `Layout: ${layout.width}x${layout.height} (mode: ${config.packing?.mode ?? "shelf"})`
  );

  const exportConfig = config.export ?? {};
  const { atlas, targetWidth, targetHeight, scaleX, scaleY } =
    await renderAtlas(frames, layout, exportConfig);

  const payload = buildJsonPayload(
    frames,
    layout,
    config,
    targetWidth,
    targetHeight,
    scaleX,
    scaleY
  );

  const outputDir = resolve(config.output || "./output");
  await mkdir(outputDir, { recursive: true });
  const baseName = math.normalizeExportName(config.name || "sprite", "sprite");

  const imagePath = join(
    outputDir,
    `${baseName}_atlas.${exportConfig.format ?? "png"}`
  );
  if (Buffer.isBuffer(atlas)) {
    await writeFile(imagePath, atlas);
  } else {
    await atlas.toFile(imagePath);
  }
  console.log(`Atlas saved: ${imagePath}`);

  const jsonPath = join(outputDir, `${baseName}_data.json`);
  const jsonMode = exportConfig.jsonMode ?? "pretty";
  await writeFile(
    jsonPath,
    serializeAtlasPayload(payload as unknown as AtlasPayload, jsonMode),
    "utf-8"
  );
  console.log(`Data saved: ${jsonPath} (${jsonMode})`);
}

const loadInputFrames = async (
  config: CliConfig
): Promise<{
  frames: CliFrame[];
  importedGroups?: CliPointGroup[];
  importedAnimation?: CliAnimation;
  importedMode?: "normal" | "character" | "animation";
}> => {
  if (config.import) {
    const imported = await importAtlas(config.import.atlas, config.import.data);
    if (imported.frames.length === 0) {
      throw new Error("Imported atlas contains no valid frames.");
    }
    console.log(`Imported ${imported.frames.length} frame(s) from existing atlas.`);
    return {
      frames: imported.frames,
      importedGroups: imported.groups,
      importedAnimation: imported.animation,
      importedMode: imported.mode,
    };
  }

  if (!config.input) {
    throw new Error("--input is required when not using --import.");
  }
  const frames = await loadFramesFromDirectory(config.input);
  if (frames.length === 0) {
    throw new Error("No PNG frames found in input directory.");
  }
  console.log(`Found ${frames.length} frame(s).`);
  return { frames };
};

const applyImportedDefaults = (
  config: CliConfig,
  loaded: {
    importedAnimation?: CliAnimation;
    importedMode?: "normal" | "character" | "animation";
  }
) => {
  if (loaded.importedMode && !config.mode) {
    config.mode = loaded.importedMode;
  }

  if (
    loaded.importedAnimation &&
    (!config.animation || Object.keys(config.animation).length === 0)
  ) {
    config.animation = loaded.importedAnimation;
  }
};

const applyModeSpecificData = (
  config: CliConfig,
  frames: CliFrame[],
  loaded: { importedGroups?: CliPointGroup[] }
) => {
  if (config.mode !== "character") {
    return;
  }

  processPoints(frames, config.points);
  if (
    loaded.importedGroups &&
    (!config.pointGroups || config.pointGroups.length === 0)
  ) {
    config.pointGroups = loaded.importedGroups;
  }
};

export function generateSampleConfig(
  mode: "normal" | "character" | "animation"
): CliConfig {
  const base: CliConfig = {
    input: "./frames",
    output: "./output",
    name: "sprite",
    mode,
    packing: {
      mode: "shelf",
      padding: 2,
    },
    export: {
      scale: 1,
      format: "png",
      webpQuality: 90,
      ktx2Quality: 2,
      smoothing: true,
      pivot: "top-left",
    },
  };

  if (mode === "character") {
    base.points = [
      {
        name: "head",
        color: "hsl(0 70% 55%)",
        keyframes: [
          { frameIndex: 0, x: 32, y: 10 },
          { frameIndex: 3, x: 34, y: 12 },
        ],
        autoFill: {
          shape: "linear",
          enabled: true,
        },
      },
      {
        name: "hand_right",
        keyframes: [
          { frameIndex: 0, x: 50, y: 40 },
          { frameIndex: 2, x: 55, y: 35 },
          { frameIndex: 4, x: 50, y: 40 },
        ],
        autoFill: {
          shape: "ellipse",
          enabled: true,
          spriteDirection: "clockwise",
        },
      },
    ];
    base.pointGroups = [
      {
        name: "body_parts",
        entries: [
          ["head", "hand_right"],
          ["head", "hand_right"],
        ],
      },
    ];
    base.spriteDirection = "clockwise";
  }

  if (mode === "animation") {
    base.animation = {
      name: "idle",
      fps: 12,
      speed: 1,
      loop: true,
      frameSelection: ["frame_*"],
    };
  }

  return base;
}
