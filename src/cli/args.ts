import type {
  CliAtlasFormat,
  CliConfig,
  CliJsonMode,
  CliPackingMode,
} from "./types.ts";
import type { PivotMode } from "../lib/editor-types.ts";

export type ParsedArgs = {
  command?: "pack" | "ship" | "character" | "animation" | "import" | "init-config";
  input?: string;
  output?: string;
  name?: string;
  config?: string;
  rows?: number;
  padding?: number;
  scale?: number;
  format?: CliAtlasFormat;
  smoothing?: boolean;
  bundle?: boolean;
  framesZip?: boolean;
  pivot?: PivotMode;
  packingMode?: CliPackingMode;
  jsonMode?: CliJsonMode;
  spriteDirection?: "clockwise" | "counterclockwise";
  rotation?: "clockwise" | "counterclockwise";
  atlas?: string;
  data?: string;
  mode?: "normal" | "ship" | "character" | "animation";
  help?: boolean;
};

const FORMATS = ["png"] as const;
const PIVOTS = ["top-left", "bottom-left", "center"] as const;
const PACKING_MODES = ["uniform", "tight", "shelf", "maxrects"] as const;
const CONFIG_MODES = ["normal", "ship", "character", "animation"] as const;
const JSON_MODES = ["pretty", "raylib"] as const;

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

const parsePositiveNumber = (value: string, flag: string): number => {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive number.`);
  }
  return parsed;
};

const parseNonNegativeNumber = (value: string, flag: string): number => {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`${flag} must be 0 or a positive number.`);
  }
  return parsed;
};

export function parseArgs(rawArgs: string[]): ParsedArgs {
  const result: ParsedArgs = {};
  const args = [...rawArgs];

  const commands = ["pack", "ship", "character", "animation", "import", "init-config"];
  if (args.length > 0 && !args[0].startsWith("-")) {
    const cmd = args.shift()!;
    if (commands.includes(cmd)) {
      result.command = cmd as ParsedArgs["command"];
    } else {
      throw new Error(
        `Unknown command '${cmd}'. Available commands: ${commands.join(", ")}.`
      );
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      result.help = true;
      continue;
    }

    if (arg === "-i" || arg === "--input") {
      result.input = args[++i];
    } else if (arg === "-o" || arg === "--output") {
      result.output = args[++i];
    } else if (arg === "-n" || arg === "--name") {
      result.name = args[++i];
    } else if (arg === "-c" || arg === "--config") {
      result.config = args[++i];
    } else if (arg === "--rows") {
      result.rows = Math.max(
        1,
        Math.round(parsePositiveNumber(args[++i], "--rows"))
      );
    } else if (arg === "--padding") {
      result.padding = parseNonNegativeNumber(args[++i], "--padding");
    } else if (arg === "--scale") {
      result.scale = parsePositiveNumber(args[++i], "--scale");
    } else if (arg === "--format") {
      result.format = parseChoice(args[++i], "--format", FORMATS);
    } else if (arg === "--smoothing") {
      result.smoothing = true;
    } else if (arg === "--bundle") {
      result.bundle = true;
    } else if (arg === "--frames-zip") {
      result.framesZip = true;
    } else if (arg === "--pivot") {
      result.pivot = parseChoice(args[++i], "--pivot", PIVOTS);
    } else if (arg === "--mode") {
      if (result.command === "init-config") {
        result.mode = parseChoice(args[++i], "--mode", CONFIG_MODES) as "normal" | "ship" | "character" | "animation";
      } else {
        result.packingMode = parseChoice(args[++i], "--mode", PACKING_MODES);
      }
    } else if (arg === "--json") {
      result.jsonMode = parseChoice(args[++i], "--json", JSON_MODES);
    } else if (arg === "--rotation") {
      result.rotation = parseChoice(args[++i], "--rotation", [
        "clockwise",
        "counterclockwise",
      ] as const);
    } else if (arg === "--sprite-direction") {
      result.spriteDirection = parseChoice(args[++i], "--sprite-direction", [
        "clockwise",
        "counterclockwise",
      ] as const);
    } else if (arg === "-a" || arg === "--atlas") {
      result.atlas = args[++i];
    } else if (arg === "-d" || arg === "--data") {
      result.data = args[++i];
    } else {
      throw new Error(`Unknown option '${arg}'. Use --help for usage.`);
    }
  }

  return result;
}

export function mergeArgsIntoConfig(
  args: ParsedArgs,
  config: Partial<CliConfig>
): CliConfig {
  const mode =
    args.command === "ship" || args.command === "character"
      ? "ship"
      : args.command === "animation"
        ? "animation"
        : args.command === "import"
          ? undefined
          : (config.mode === "character" ? "ship" : config.mode || "normal");

  return {
    input: args.input || config.input,
    output: args.output || config.output,
    name: args.name || config.name,
    mode,
    packing: {
      mode: args.packingMode || config.packing?.mode || "shelf",
      rows: args.rows !== undefined ? args.rows : config.packing?.rows,
      padding:
        args.padding !== undefined
          ? args.padding
          : config.packing?.padding ?? 2,
    },
    export: {
      scale: args.scale !== undefined ? args.scale : config.export?.scale ?? 1,
      format: args.format || config.export?.format || "png",
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
    },
    rotation: args.rotation || args.spriteDirection || config.rotation || config.spriteDirection || "clockwise",
    spriteDirection: args.rotation || args.spriteDirection || config.rotation || config.spriteDirection || "clockwise",
    pointGroups: config.pointGroups,
    animation: config.animation,
  };
}
