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
      "--format must be one of: png, webp, ktx2."
    );
    expect(() => parseArgs(["pack", "--json", "xml"])).toThrow(
      "--json must be one of: pretty, minified, compact."
    );
  });

  it("parses bundle formats and enables bundle export", () => {
    const args = parseArgs([
      "pack",
      "--bundle-formats",
      "png,webp,png",
    ]);
    const config = mergeArgsIntoConfig(args, {});

    expect(config.export?.bundle).toBe(true);
    expect(config.export?.bundleFormats).toEqual(["png", "webp"]);
  });

  it("lets cli bundle formats override config bundle formats", () => {
    const args = parseArgs(["pack", "--bundle-formats", "ktx2"]);
    const config = mergeArgsIntoConfig(args, {
      export: { bundleFormats: ["png", "webp"] },
    });

    expect(config.export?.bundleFormats).toEqual(["ktx2"]);
  });
});
