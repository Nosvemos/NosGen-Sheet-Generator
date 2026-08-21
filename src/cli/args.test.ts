import { describe, expect, it } from "vitest";
import { mergeArgsIntoConfig, parseArgs } from "./args";

describe("cli args", () => {
  it("parses init-config mode separately from packing mode", () => {
    const args = parseArgs(["init-config", "--mode", "character"]);

    expect(args.mode).toBe("character");
    expect(args.packingMode).toBeUndefined();
  });

  it("parses pack mode as packing mode", () => {
    const args = parseArgs(["pack", "--mode", "tight"]);

    expect(args.packingMode).toBe("tight");
    expect(args.mode).toBeUndefined();
  });

  it("rejects invalid enum values", () => {
    expect(() => parseArgs(["pack", "--format", "jpg"])).toThrow(
      "--format must be one of: png."
    );
    expect(() => parseArgs(["pack", "--json", "xml"])).toThrow(
      "--json must be one of: pretty, raylib."
    );
  });

  it("parses bundle option", () => {
    const args = parseArgs(["pack", "--bundle"]);
    const config = mergeArgsIntoConfig(args, {});

    expect(config.export?.bundle).toBe(true);
    expect(config.export?.format).toBe("png");
  });

  it("parses import atlas and data args into config", () => {
    const args = parseArgs(["import", "-a", "atlas.png", "-d", "data.json"]);
    const config = mergeArgsIntoConfig(args, {});

    expect(config.import).toEqual({
      atlas: "atlas.png",
      data: "data.json",
    });
  });
});
