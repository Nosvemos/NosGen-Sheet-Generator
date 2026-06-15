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
  --format <png|webp>        Output image format (default: png)
  --webp-quality <0-100>     WebP quality (default: 90)
  --smoothing                Enable smoothing (Lanczos3) during scaling
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
  format?: "png" | "webp";
  webpQuality?: number;
  smoothing?: boolean;
  pivot?: "top-left" | "bottom-left" | "center";
  packingMode?: CliPackingMode;
  jsonMode?: CliJsonMode;
  atlas?: string;
  data?: string;
  mode?: "normal" | "character" | "animation";
  help?: boolean;
  [key: string]: unknown;
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

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-i":
      case "--input":
        result.input = args[++i];
        break;
      case "-o":
      case "--output":
        result.output = args[++i];
        break;
      case "-n":
      case "--name":
        result.name = args[++i];
        break;
      case "-c":
      case "--config":
        result.config = args[++i];
        break;
      case "--rows":
        result.rows = parseInt(args[++i], 10);
        break;
      case "--padding":
        result.padding = parseFloat(args[++i]);
        break;
      case "--scale":
        result.scale = parseFloat(args[++i]);
        break;
      case "--format":
        result.format = args[++i] as "png" | "webp";
        break;
      case "--webp-quality":
        result.webpQuality = parseFloat(args[++i]);
        break;
      case "--smoothing":
        result.smoothing = true;
        break;
      case "--pivot":
        result.pivot = args[++i] as "top-left" | "bottom-left" | "center";
        break;
      case "--mode":
        result.packingMode = args[++i] as CliPackingMode;
        break;
      case "--json":
        result.jsonMode = args[++i] as CliJsonMode;
        break;
      case "-a":
      case "--atlas":
        result.atlas = args[++i];
        break;
      case "-d":
      case "--data":
        result.data = args[++i];
        break;
      case "-h":
      case "--help":
        result.help = true;
        break;
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
      smoothing:
        args.smoothing !== undefined
          ? args.smoothing
          : config.export?.smoothing ?? false,
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
