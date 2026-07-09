#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CliConfig, CliJsonMode, CliPackingMode } from "./cli/types.ts";
import { run, generateSampleConfig } from "./cli/engine.ts";

function showHelp(command?: string) {
  const common = `
Common Options:
  -i, --input <dir>          Input directory with PNG frames (required unless --import)
  -o, --output <dir>         Output directory (default: ./output)
  -n, --name <name>          Project/base name (default: sprite)
  --config <path>            JSON config file path
  --rows <number>            Rows for grid packing (default: auto)
  --padding <number>         Padding between frames (default: 2)
  --scale <number>           Export scale multiplier (default: 1)
  --format <png|webp|ktx2>   Output image format (default: png)
  --webp-quality <0-100>     WebP quality (default: 90)
  --ktx2-quality <0-3>       KTX2 UASTC quality level (default: 2)
  --smoothing                Enable smoothing (Lanczos3) during scaling
  --bundle                   Also export <name>_bundle.zip (PNG/WebP/KTX2 + JSON)
  --frames-zip               Also export <name>_frames.zip with source frames as PNG
  --pivot <top-left|bottom-left|center>  Pivot mode (default: top-left)
  --mode <uniform|tight|shelf> Packing mode (default: shelf)
  --json <pretty|minified|compact>  JSON output shape (default: pretty)
  -h, --help                 Show help
`;

  const general = `NosGen Sheet Generator CLI

Subcommands:
  pack [options]              Pack frames into a spritesheet (normal mode)
  character [options]         Pack frames with points and groups
  animation [options]         Pack frames with animation metadata
  import [options]            Import existing atlas (PNG+JSON) and re-export
  init-config [options]       Generate a sample JSON config file

Examples:
  npm run cli -- pack -i ./frames -o ./dist -n hero --mode shelf
  npm run cli -- character -i ./frames -c char.json
  npm run cli -- animation -i ./frames -c anim.json --fps 24
  npm run cli -- import -a atlas.png -d data.json -o ./dist --scale 2
  npm run cli -- init-config --mode character -o ./config.json
${common}`;

  if (!command) {
    console.log(general);
    return;
  }

  switch (command) {
    case "pack":
      console.log(
        `Usage: nosgen-sheet pack [options]\n\nPack PNG frames into a spritesheet (normal mode).\n${common}`
      );
      break;
    case "character":
      console.log(
        `Usage: nosgen-sheet character [options]\n\nPack frames with points and point groups.\nPoint definitions are read from --config.\n${common}`
      );
      break;
    case "animation":
      console.log(
        `Usage: nosgen-sheet animation [options]\n\nPack frames with animation metadata.\nAnimation settings are read from --config.\n${common}`
      );
      break;
    case "import":
      console.log(
        `Usage: nosgen-sheet import [options]\n\nImport an existing atlas and re-export with new settings.\n\nImport Options:
  -a, --atlas <path>         Path to existing atlas PNG
  -d, --data <path>          Path to existing data JSON
${common}`
      );
      break;
    case "init-config":
      console.log(
        `Usage: nosgen-sheet init-config [options]\n\nGenerate a sample config file.\n\nOptions:
  --mode <normal|character|animation>  Config mode (default: normal)
  -o, --output <path>                  Output config path (default: ./nosgen-config.json)`
      );
      break;
    default:
      console.log(general);
  }
}

type ParsedArgs = {
  command?: string;
  input?: string;
  output?: string;
  name?: string;
  config?: string;
  rows?: number;
  padding?: number;
  scale?: number;
  format?: "png" | "webp" | "ktx2";
  webpQuality?: number;
  ktx2Quality?: number;
  smoothing?: boolean;
  bundle?: boolean;
  framesZip?: boolean;
  pivot?: "top-left" | "bottom-left" | "center";
  packingMode?: CliPackingMode;
  jsonMode?: CliJsonMode;
  atlas?: string;
  data?: string;
  mode?: "normal" | "character" | "animation";
  help?: boolean;
  [key: string]: unknown;
};

const FORMATS = ["png", "webp", "ktx2"] as const;
const PIVOTS = ["top-left", "bottom-left", "center"] as const;
const PACKING_MODES = ["uniform", "tight", "shelf"] as const;
const CONFIG_MODES = ["normal", "character", "animation"] as const;
const JSON_MODES = ["pretty", "minified", "compact"] as const;

const parseChoice = <T extends string>(
  value: string,
  flag: string,
  choices: readonly T[]
): T => {
  if ((choices as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`${flag} must be one of: ${choices.join(", ")}.`);
};

const parseFiniteNumber = (value: string, flag: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${flag} must be a valid number.`);
  }
  return parsed;
};

const parseInteger = (value: string, flag: string) => {
  const parsed = parseFiniteNumber(value, flag);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${flag} must be an integer.`);
  }
  return parsed;
};

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {};

  if (args.length === 0) {
    result.help = true;
    return result;
  }

  const commands = ["pack", "character", "animation", "import", "init-config"];
  if (commands.includes(args[0])) {
    result.command = args[0];
    args.shift();
  }

  const readValue = (index: number, flag: string) => {
    const value = args[index + 1];
    if (!value || value.startsWith("-")) {
      throw new Error(`${flag} requires a value.`);
    }
    return value;
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-i":
      case "--input":
        result.input = readValue(i, arg);
        i += 1;
        break;
      case "-o":
      case "--output":
        result.output = readValue(i, arg);
        i += 1;
        break;
      case "-n":
      case "--name":
        result.name = readValue(i, arg);
        i += 1;
        break;
      case "-c":
      case "--config":
        result.config = readValue(i, arg);
        i += 1;
        break;
      case "--rows":
        result.rows = parseInteger(readValue(i, arg), arg);
        i += 1;
        break;
      case "--padding":
        result.padding = parseFiniteNumber(readValue(i, arg), arg);
        i += 1;
        break;
      case "--scale":
        result.scale = parseFiniteNumber(readValue(i, arg), arg);
        i += 1;
        break;
      case "--format":
        result.format = parseChoice(readValue(i, arg), arg, FORMATS);
        i += 1;
        break;
      case "--webp-quality":
        result.webpQuality = parseFiniteNumber(readValue(i, arg), arg);
        i += 1;
        break;
      case "--ktx2-quality":
        result.ktx2Quality = parseFiniteNumber(readValue(i, arg), arg);
        i += 1;
        break;
      case "--smoothing":
        result.smoothing = true;
        break;
      case "--bundle":
        result.bundle = true;
        break;
      case "--frames-zip":
        result.framesZip = true;
        break;
      case "--pivot":
        result.pivot = parseChoice(readValue(i, arg), arg, PIVOTS);
        i += 1;
        break;
      case "--mode": {
        const value = readValue(i, arg);
        if (result.command === "init-config") {
          result.mode = parseChoice(value, arg, CONFIG_MODES);
        } else {
          result.packingMode = parseChoice(value, arg, PACKING_MODES);
        }
        i += 1;
        break;
      }
      case "--json":
        result.jsonMode = parseChoice(readValue(i, arg), arg, JSON_MODES);
        i += 1;
        break;
      case "-a":
      case "--atlas":
        result.atlas = readValue(i, arg);
        i += 1;
        break;
      case "-d":
      case "--data":
        result.data = readValue(i, arg);
        i += 1;
        break;
      case "-h":
      case "--help":
        result.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  return result;
}

async function loadConfig(path: string): Promise<Partial<CliConfig>> {
  const content = await readFile(resolve(path), "utf-8");
  return JSON.parse(content) as Partial<CliConfig>;
}

function mergeArgsIntoConfig(
  args: ParsedArgs,
  config: Partial<CliConfig>
): CliConfig {
  const mode =
    args.command === "character"
      ? "character"
      : args.command === "animation"
        ? "animation"
        : args.command === "import"
          ? undefined
          : config.mode || "normal";

  return {
    input: args.input || config.input,
    output: args.output || config.output,
    name: args.name || config.name,
    mode,
    packing: {
      mode: args.packingMode || config.packing?.mode || "shelf",
      rows:
        args.rows !== undefined ? args.rows : config.packing?.rows,
      padding:
        args.padding !== undefined
          ? args.padding
          : config.packing?.padding ?? 2,
    },
    export: {
      scale:
        args.scale !== undefined ? args.scale : config.export?.scale ?? 1,
      format: args.format || config.export?.format || "png",
      webpQuality:
        args.webpQuality !== undefined
          ? args.webpQuality
          : config.export?.webpQuality ?? 90,
      ktx2Quality:
        args.ktx2Quality !== undefined
          ? args.ktx2Quality
          : config.export?.ktx2Quality ?? 2,
      smoothing:
        args.smoothing !== undefined
          ? args.smoothing
          : config.export?.smoothing ?? false,
      bundle:
        args.bundle !== undefined ? args.bundle : config.export?.bundle ?? false,
      framesZip:
        args.framesZip !== undefined
          ? args.framesZip
          : config.export?.framesZip ?? false,
      pivot: args.pivot || config.export?.pivot || "top-left",
      jsonMode: args.jsonMode || config.export?.jsonMode || "pretty",
      rows:
        args.rows !== undefined ? args.rows : config.export?.rows,
      padding:
        args.padding !== undefined
          ? args.padding
          : config.export?.padding ?? 2,
      packingMode:
        args.packingMode || config.export?.packingMode,
    },
    points: config.points,
    pointGroups: config.pointGroups,
    animation: config.animation,
    spriteDirection: config.spriteDirection,
    import: config.import ||
      (args.atlas && args.data
        ? { atlas: args.atlas, data: args.data }
        : undefined),
  };
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp(args.command);
    process.exit(0);
  }

  if (!args.command) {
    showHelp();
    process.exit(1);
  }

  if (args.command === "init-config") {
    const mode = (args.mode as "normal" | "character" | "animation") || "normal";
    const sample = generateSampleConfig(mode);
    const outputPath = resolve(args.output || "./nosgen-config.json");
    await writeFile(outputPath, JSON.stringify(sample, null, 2), "utf-8");
    console.log(`Sample config written to: ${outputPath}`);
    process.exit(0);
  }

  let config: Partial<CliConfig> = {};
  if (args.config) {
    config = await loadConfig(args.config);
  }

  const merged = mergeArgsIntoConfig(args, config);

  // Validate
  if (args.command === "import") {
    if (!merged.import) {
      console.error("Import requires --atlas and --data.");
      showHelp("import");
      process.exit(1);
    }
  } else if (!merged.input) {
    console.error("--input is required.");
    showHelp(args.command);
    process.exit(1);
  }

  await run(merged);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
