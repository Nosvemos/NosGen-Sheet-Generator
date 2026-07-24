#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mergeArgsIntoConfig, parseArgs } from "./cli/args.ts";
import type { CliConfig } from "./cli/types.ts";
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
  --bundle-formats <list>    Bundle image formats, comma-separated (default: png,webp,ktx2)
  --frames-zip               Also export <name>_frames.zip with source frames as PNG
  --pivot <top-left|bottom-left|center>  Pivot mode (default: top-left)
  --mode <uniform|tight|shelf> Packing mode (default: shelf)
  --json <pretty|minified|compact>  JSON output shape (default: pretty)
  -h, --help                 Show help
`;

  const general = `NosGalaxy Sprite Generator CLI

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

async function loadConfig(path: string): Promise<Partial<CliConfig>> {
  const content = await readFile(resolve(path), "utf-8");
  return JSON.parse(content) as Partial<CliConfig>;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

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
