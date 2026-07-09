import sharp from "sharp";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join, basename, extname } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import {
  computeAtlasLayoutByMode,
  resolveFramePlacements,
  type SizedItem,
} from "../lib/atlas-layout.ts";
import {
  normalizeAtlasPayload,
  serializeAtlasPayload,
  type AtlasPayload,
} from "../lib/atlas-format.ts";
import type {
  CliConfig,
  CliPoint,
  CliPointGroup,
  CliAnimation,
  CliExportConfig,
} from "./types.ts";
import type { AtlasLayout } from "../lib/editor-types.ts";
import * as math from "./math.ts";

type FramePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isKeyframe?: boolean;
};

type Frame = SizedItem & {
  name: string;
  path: string;
  points: FramePoint[];
};

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const escapeRegexLiteral = (value: string) =>
  value.replace(/[\\^$+.[\]{}()|/]/g, "\\$&");

export function matchWildcard(pattern: string, str: string): boolean {
  const regex = new RegExp(
    "^" +
      escapeRegexLiteral(pattern)
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".") +
      "$"
  );
  return regex.test(str);
}

export const validateAtlasEntry = (
  entry: { x: number; y: number; w: number; h: number; name?: string },
  atlas: { width: number; height: number }
) => {
  const values = [entry.x, entry.y, entry.w, entry.h];
  if (!values.every(Number.isFinite)) {
    return false;
  }
  if (entry.w <= 0 || entry.h <= 0 || entry.x < 0 || entry.y < 0) {
    return false;
  }
  return entry.x + entry.w <= atlas.width && entry.y + entry.h <= atlas.height;
};

async function loadFramesFromDirectory(dir: string): Promise<Frame[]> {
  const inputDir = resolve(dir);
  const files = (await readdir(inputDir)).filter((f) =>
    f.toLowerCase().endsWith(".png")
  );
  files.sort(naturalSort);

  const frames: Frame[] = [];
  for (const file of files) {
    const filePath = join(inputDir, file);
    const meta = await sharp(filePath).metadata();
    frames.push({
      name: basename(file, extname(file)),
      width: meta.width || 0,
      height: meta.height || 0,
      path: filePath,
      points: [],
    });
  }
  return frames;
}

async function importAtlas(
  atlasPath: string,
  dataPath: string
): Promise<{
  frames: Frame[];
  groups?: CliPointGroup[];
  animation?: CliAnimation;
  mode?: "normal" | "character" | "animation";
}> {
  const [pngBuffer, jsonRaw] = await Promise.all([
    readFile(resolve(atlasPath)),
    readFile(resolve(dataPath), "utf-8"),
  ]);
  const atlasMetadata = await sharp(pngBuffer).metadata();
  const atlasSize = {
    width: atlasMetadata.width ?? 0,
    height: atlasMetadata.height ?? 0,
  };
  // Accept both verbose and compact JSON: expand to the verbose schema first.
  const parsedRaw = JSON.parse(jsonRaw);
  const parsed = normalizeAtlasPayload(parsedRaw) as typeof parsedRaw;

  const meta = parsed.meta || {};
  const pivotRaw: string = meta.pivot || "top-left";
  const pivotMode =
    pivotRaw === "top-left" || pivotRaw === "bottom-left" || pivotRaw === "center"
      ? pivotRaw
      : "top-left";

  const framesData = Array.isArray(parsed.frames) ? parsed.frames : [];
  const tempDir = await mkdtemp(join(tmpdir(), "nosgen-import-"));

  const frames: Frame[] = [];
  const globalNameToId = new Map<string, string>();
  const globalNameToColor = new Map<string, string>();

  for (let i = 0; i < framesData.length; i++) {
    const entry = framesData[i];
    const w = Number(entry.w ?? entry.width ?? 0);
    const h = Number(entry.h ?? entry.height ?? 0);
    const x = Number(entry.x ?? 0);
    const y = Number(entry.y ?? 0);
    const atlasEntry = {
      name: entry.name || `frame-${i + 1}`,
      x,
      y,
      w,
      h,
    };
    if (!validateAtlasEntry(atlasEntry, atlasSize)) {
      throw new Error(
        `Invalid atlas frame bounds for ${atlasEntry.name}: ${x},${y},${w},${h}`
      );
    }

    const extracted = await sharp(pngBuffer)
      .extract({ left: x, top: y, width: w, height: h })
      .png()
      .toBuffer();

    const tempPath = join(tempDir, `frame_${i}.png`);
    await writeFile(tempPath, extracted);

    const points: FramePoint[] = [];
    if (Array.isArray(entry.points)) {
      for (const pt of entry.points) {
        const name =
          typeof pt.name === "string" && pt.name.length > 0
            ? pt.name
            : `point-${points.length + 1}`;
        const id = globalNameToId.get(name) ?? math.createId();
        globalNameToId.set(name, id);
        const color = globalNameToColor.get(name) ?? math.deterministicColor(name);
        globalNameToColor.set(name, color);
        const pivotPoint = {
          x: Number(pt.x ?? 0),
          y: Number(pt.y ?? 0),
        };
        const framePoint = math.fromPivotCoords(
          pivotPoint,
          { width: w, height: h },
          pivotMode as "top-left" | "bottom-left" | "center"
        );
        points.push({
          id,
          name,
          x: math.clamp(Math.round(framePoint.x), 0, w),
          y: math.clamp(Math.round(framePoint.y), 0, h),
          color,
          isKeyframe: true,
        });
      }
    }

    frames.push({
      name: atlasEntry.name,
      width: w,
      height: h,
      path: tempPath,
      points,
    });
  }

  let groups: CliPointGroup[] | undefined;
  if (parsed.groups && typeof parsed.groups === "object") {
    groups = Object.entries(parsed.groups).map(([name, rawEntries]) => {
      const entries = Array.isArray(rawEntries) ? (rawEntries as unknown[][]) : [];
      return {
        name,
        entries: entries.map((entry) =>
          (Array.isArray(entry) ? entry : [])
            .filter((n): n is string => typeof n === "string")
        ),
      };
    });
  }

  let animation: CliAnimation | undefined;
  if (parsed.animation && typeof parsed.animation === "object") {
    const a = parsed.animation;
    animation = {
      name: typeof a.name === "string" ? a.name : undefined,
      fps: Number.isFinite(Number(a.fps)) ? Number(a.fps) : undefined,
      speed: Number.isFinite(Number(a.speed)) ? Number(a.speed) : undefined,
      loop: typeof a.loop === "boolean" ? a.loop : undefined,
      frameSelection: Array.isArray(a.frames)
        ? a.frames.filter((n: unknown): n is string => typeof n === "string")
        : undefined,
    };
  }

  const originalMode =
    meta.mode === "character" || meta.mode === "animation" || meta.mode === "normal"
      ? meta.mode
      : undefined;

  return { frames, groups, animation, mode: originalMode };
}

export function processPoints(frames: Frame[], pointsConfig?: CliPoint[]) {
  if (!pointsConfig || pointsConfig.length === 0) return;
  const totalFrames = frames.length;
  const nameToId = new Map<string, string>();
  const nameToColor = new Map<string, string>();

  for (const pt of pointsConfig) {
    const id = nameToId.get(pt.name) ?? math.createId();
    nameToId.set(pt.name, id);
    const color = pt.color ?? math.deterministicColor(pt.name);
    nameToColor.set(pt.name, color);

    let positions: Array<{ x: number; y: number }>;

    if (pt.positions && pt.positions.length > 0) {
      positions = pt.positions.map((p) =>
        p ? { x: p.x, y: p.y } : { x: 0, y: 0 }
      );
      if (positions.length < totalFrames) {
        while (positions.length < totalFrames) {
          positions.push({ x: 0, y: 0 });
        }
      }
    } else if (
      pt.keyframes &&
      pt.keyframes.length > 0 &&
      pt.autoFill &&
      pt.autoFill.enabled !== false
    ) {
      positions = [];
      const keyframes = pt.keyframes;
      const direction = pt.autoFill.spriteDirection ?? "clockwise";

      for (let i = 0; i < totalFrames; i++) {
        switch (pt.autoFill.shape) {
          case "linear":
            positions.push(math.interpolateLinear(keyframes, i, totalFrames));
            break;
          case "tangent":
            positions.push(math.interpolateTangent(keyframes, i, totalFrames));
            break;
          case "ellipse": {
            const model = math.computeEllipseFit(keyframes, totalFrames, direction);
            if (model) {
              const cosRot = Math.cos(model.rotation);
              const sinRot = Math.sin(model.rotation);
              const angle =
                (i / totalFrames) *
                  Math.PI *
                  2 *
                  (direction === "clockwise" ? 1 : -1) +
                model.phase;
              const localX = model.rx * Math.cos(angle);
              const localY = model.ry * Math.sin(angle);
              positions.push({
                x: model.cx + localX * cosRot - localY * sinRot,
                y: model.cy + localX * sinRot + localY * cosRot,
              });
            } else {
              positions.push(math.interpolateLinear(keyframes, i, totalFrames));
            }
            break;
          }
          case "circle": {
            const model = math.computeCircleFit(keyframes, totalFrames, direction);
            if (model) {
              const angle =
                (i / totalFrames) *
                  Math.PI *
                  2 *
                  (direction === "clockwise" ? 1 : -1) +
                model.phase;
              positions.push({
                x: model.cx + model.r * Math.cos(angle),
                y: model.cy + model.r * Math.sin(angle),
              });
            } else {
              positions.push(math.interpolateLinear(keyframes, i, totalFrames));
            }
            break;
          }
          case "square": {
            const model = math.computeSquareFit(keyframes, totalFrames, direction);
            if (model) {
              const turn =
                (i / totalFrames) *
                  (direction === "clockwise" ? 1 : -1) +
                model.phase;
              positions.push(
                math.squarePointAt(model.cx, model.cy, model.size, turn)
              );
            } else {
              positions.push(math.interpolateLinear(keyframes, i, totalFrames));
            }
            break;
          }
          default:
            positions.push(math.interpolateLinear(keyframes, i, totalFrames));
        }
      }
    } else {
      positions = Array.from({ length: totalFrames }, () => ({ x: 0, y: 0 }));
    }

    for (let i = 0; i < totalFrames; i++) {
      const frame = frames[i];
      const pos = positions[i];
      const isKeyframe = pt.keyframes?.some((k) => k.frameIndex === i) ?? false;
      frame.points.push({
        id,
        name: pt.name,
        x: math.clamp(Math.round(pos.x), 0, frame.width),
        y: math.clamp(Math.round(pos.y), 0, frame.height),
        color,
        isKeyframe,
      });
    }
  }
}

function buildGroups(
  groupsConfig: CliPointGroup[],
  frames: Frame[]
): Array<{ name: string; entries: string[][] }> {
  if (!groupsConfig || groupsConfig.length === 0) return [];
  const nameToId = new Map<string, string>();
  frames[0]?.points.forEach((p) => nameToId.set(p.name, p.id));
  return groupsConfig.map((group) => ({
    name: group.name,
    entries: group.entries.map((entry) =>
      entry
        .map((name) => nameToId.get(name))
        .filter((id): id is string => !!id)
    ),
  }));
}

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

async function renderAtlas(
  frames: Frame[],
  layout: AtlasLayout,
  exportConfig: CliExportConfig
) {
  const scale = exportConfig.scale ?? 1;
  const smoothing = exportConfig.smoothing ?? false;
  const targetWidth = Math.max(1, Math.round(layout.width * scale));
  const targetHeight = Math.max(1, Math.round(layout.height * scale));
  const scaleX = targetWidth / layout.width;
  const scaleY = targetHeight / layout.height;

  const base = sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const placements = resolveFramePlacements(layout, frames);
  const overlays = await Promise.all(
    frames.map(async (frame, index) => {
      const rect = placements[index];
      const left = Math.round(rect.x * scaleX);
      const top = Math.round(rect.y * scaleY);
      const w = Math.max(1, Math.round(rect.w * scaleX));
      const h = Math.max(1, Math.round(rect.h * scaleY));

      const resized = sharp(frame.path).resize(w, h, {
        kernel: smoothing ? sharp.kernel.lanczos3 : sharp.kernel.nearest,
        fit: "fill",
      });
      const buffer = await resized.ensureAlpha().raw().toBuffer();
      return {
        input: buffer,
        raw: { width: w, height: h, channels: 4 as const },
        left,
        top,
      };
    })
  );

  const composited = base.composite(overlays);

  const format = exportConfig.format ?? "png";
  if (format === "ktx2") {
    const { encodeToKTX2 } = await import("ktx2-encoder");
    const raw = await composited.raw().toBuffer();
    const encoded = await encodeToKTX2(new Uint8Array([0]), {
      isKTX2File: true,
      isUASTC: true,
      needSupercompression: true,
      enableRDO: true,
      uastcLDRQualityLevel: Math.round(
        math.clamp(exportConfig.ktx2Quality ?? 2, 0, 3)
      ),
      isPerceptual: true,
      isSetKTX2SRGBTransferFunc: true,
      imageDecoder: async () => ({
        width: targetWidth,
        height: targetHeight,
        data: new Uint8Array(raw),
      }),
    });
    return {
      atlas: Buffer.from(encoded),
      targetWidth,
      targetHeight,
      scaleX,
      scaleY,
    };
  }
  let atlas = composited;
  if (format === "webp") {
    atlas = atlas.webp({
      quality: math.clamp(
        Math.round(exportConfig.webpQuality ?? 90),
        1,
        100
      ),
      effort: 6,
    });
  } else {
    atlas = atlas.png({ compressionLevel: 9, effort: 10 });
  }

  return { atlas, targetWidth, targetHeight, scaleX, scaleY };
}

function buildJsonPayload(
  frames: Frame[],
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
    const left = Math.round(rect.x * scaleX);
    const top = Math.round(rect.y * scaleY);
    const w = Math.max(1, Math.round(rect.w * scaleX));
    const h = Math.max(1, Math.round(rect.h * scaleY));

    const base: Record<string, unknown> = {
      name: frame.name,
      x: left,
      y: top,
      w,
      h,
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

  let groups: Record<string, string[][]> | undefined;
  if (mode === "character" && config.pointGroups && config.pointGroups.length > 0) {
    const builtGroups = buildGroups(config.pointGroups, frames);
    const idToName = new Map<string, string>();
    frames[0]?.points.forEach((p) => idToName.set(p.id, p.name));
    groups = builtGroups.reduce<Record<string, string[][]>>((acc, group) => {
      const safeName = group.name || `group-${group.name.slice(0, 6)}`;
      acc[safeName] = group.entries.map((entry) =>
        entry.map((id) => idToName.get(id) ?? id)
      );
      return acc;
    }, {});
  }

  let animation: Record<string, unknown> | undefined;
  if (mode === "animation" && config.animation) {
    const selectedFrames = config.animation.frameSelection
      ? frames.filter((f) =>
          config.animation!.frameSelection!.some((pat) =>
            matchWildcard(pat, f.name)
          )
        )
      : frames;
    animation = {
      name: config.animation.name || "animation",
      fps: config.animation.fps ?? 12,
      speed: config.animation.speed ?? 1,
      loop: config.animation.loop ?? true,
      frames: selectedFrames.map((f) => f.name),
    };
  }

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

export async function run(config: CliConfig) {
  // 1. Load frames
  let frames: Frame[];
  let importedGroups: CliPointGroup[] | undefined;
  let importedAnimation: CliAnimation | undefined;
  let importedMode: "normal" | "character" | "animation" | undefined;

  if (config.import) {
    const imported = await importAtlas(config.import.atlas, config.import.data);
    frames = imported.frames;
    importedGroups = imported.groups;
    importedAnimation = imported.animation;
    importedMode = imported.mode;
    if (frames.length === 0) {
      throw new Error("Imported atlas contains no valid frames.");
    }
    console.log(`Imported ${frames.length} frame(s) from existing atlas.`);
  } else {
    if (!config.input) {
      throw new Error("--input is required when not using --import.");
    }
    frames = await loadFramesFromDirectory(config.input);
    if (frames.length === 0) {
      throw new Error("No PNG frames found in input directory.");
    }
    console.log(`Found ${frames.length} frame(s).`);
  }

  // Use imported mode if config didn't explicitly set one
  if (importedMode && !config.mode) {
    config.mode = importedMode;
  }

  // 2. Process points for character mode
  if (config.mode === "character") {
    processPoints(frames, config.points);
    // Merge imported groups if no new groups specified
    if (importedGroups && (!config.pointGroups || config.pointGroups.length === 0)) {
      config.pointGroups = importedGroups;
    }
  }

  // Merge imported animation if no new animation specified
  if (importedAnimation && (!config.animation || Object.keys(config.animation).length === 0)) {
    config.animation = importedAnimation;
  }

  // 3. Compute layout
  const layout = buildLayout(frames, config.packing ?? {});
  console.log(
    `Layout: ${layout.width}x${layout.height} (mode: ${config.packing?.mode ?? "shelf"})`
  );

  // 4. Render atlas
  const exportConfig = config.export ?? {};
  const { atlas, targetWidth, targetHeight, scaleX, scaleY } = await renderAtlas(
    frames,
    layout,
    exportConfig
  );

  // 5. Build JSON
  const payload = buildJsonPayload(
    frames,
    layout,
    config,
    targetWidth,
    targetHeight,
    scaleX,
    scaleY
  );

  // 6. Write files
  const outputDir = resolve(config.output || "./output");
  await mkdir(outputDir, { recursive: true });
  const baseName = math.normalizeExportName(config.name || "sprite", "sprite");
  const imageFilename = `${baseName}_atlas.${exportConfig.format ?? "png"}`;
  const imagePath = join(outputDir, imageFilename);
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

export function generateSampleConfig(mode: "normal" | "character" | "animation"): CliConfig {
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
