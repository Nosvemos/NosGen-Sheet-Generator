import type {
  CliAtlasFormat,
  CliConfig,
  CliJsonMode,
  CliPackingMode,
} from "./types.ts";

export type ParsedArgs = {
  command?: string;
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
  pivot?: "top-left" | "bottom-left" | "center";
  packingMode?: CliPackingMode;
  jsonMode?: CliJsonMode;
  atlas?: string;
  data?: string;
  mode?: "normal" | "character" | "animation";
  help?: boolean;
};

const FORMATS = ["png"] as const;
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

export function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
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

export function mergeArgsIntoConfig(
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
      rows: args.rows !== undefined ? args.rows : config.packing?.rows,
      padding:
        args.padding !== undefined
          ? args.padding
          : config.packing?.padding ?? 2,
    },
    export: {
      scale: args.scale !== undefined ? args.scale : config.export?.scale ?? 1,
      format: "png",
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
      rows: args.rows !== undefined ? args.rows : config.export?.rows,
      padding:
        args.padding !== undefined
          ? args.padding
          : config.export?.padding ?? 2,
      packingMode: args.packingMode || config.export?.packingMode,
    },
    points: config.points,
    pointGroups: config.pointGroups,
    animation: config.animation,
    spriteDirection: config.spriteDirection,
    import:
      config.import ||
      (args.atlas && args.data ? { atlas: args.atlas, data: args.data } : undefined),
  };
}
