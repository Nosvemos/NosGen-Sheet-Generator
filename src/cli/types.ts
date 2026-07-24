export type CliPackingMode = "uniform" | "tight" | "shelf";
export type CliJsonMode = "pretty" | "minified" | "compact";
export type CliAtlasFormat = "png";

export type CliExportConfig = {
  scale?: number;
  format?: CliAtlasFormat;
  smoothing?: boolean;
  bundle?: boolean;
  framesZip?: boolean;
  pivot?: "top-left" | "bottom-left" | "center";
  rows?: number;
  padding?: number;
  packingMode?: CliPackingMode;
  jsonMode?: CliJsonMode;
};

export type CliKeyframe = {
  frameIndex: number;
  x: number;
  y: number;
};

export type CliAutoFill = {
  shape: "ellipse" | "circle" | "square" | "linear" | "tangent";
  enabled?: boolean;
  spriteDirection?: "clockwise" | "counterclockwise";
};

export type CliPoint = {
  name: string;
  color?: string;
  positions?: Array<{ x: number; y: number } | null>;
  keyframes?: CliKeyframe[];
  autoFill?: CliAutoFill;
};

export type CliPointGroup = {
  name: string;
  entries: string[][];
};

export type CliAnimation = {
  name?: string;
  fps?: number;
  speed?: number;
  loop?: boolean;
  frameSelection?: string[];
};

export type CliImportSource = {
  atlas: string;
  data: string;
};

export type CliConfig = {
  input?: string;
  output?: string;
  name?: string;
  mode?: "normal" | "character" | "animation";
  packing?: {
    mode?: CliPackingMode;
    rows?: number;
    padding?: number;
  };
  export?: CliExportConfig;
  points?: CliPoint[];
  pointGroups?: CliPointGroup[];
  animation?: CliAnimation;
  spriteDirection?: "clockwise" | "counterclockwise";
  import?: CliImportSource;
};
