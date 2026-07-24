import { describe, expect, it } from "vitest";
import {
  expandCompactPayload,
  isCompactPayload,
  normalizeAtlasPayload,
  serializeAtlasPayload,
  toCompactPayload,
  type AtlasPayload,
} from "./atlas-format";

const characterPayload: AtlasPayload = {
  meta: {
    app: "NosGalaxy",
    image: "hero_atlas.png",
    size: { w: 218, h: 134 },
    padding: 2,
    scale: 1,
    pivot: "center",
    spriteDirection: "clockwise",
    mode: "character",
  },
  groups: { body: [["head", "hand"], ["head", "hand"]] },
  frames: [
    {
      name: "frame_01",
      x: 52,
      y: 10,
      w: 64,
      h: 64,
      points: [
        { name: "head", x: -12, y: -24 },
        { name: "hand", x: -2, y: -2 },
      ],
    },
    {
      name: "frame_02",
      x: 2,
      y: 2,
      w: 48,
      h: 80,
      points: [
        { name: "head", x: -3, y: -31 },
        { name: "hand", x: 8, y: -12 },
      ],
    },
  ],
};

const normalPayload: AtlasPayload = {
  meta: { app: "NosGen", mode: "normal", pivot: "top-left" },
  frames: [
    { name: "a", x: 0, y: 0, w: 16, h: 16 },
    { name: "b", x: 18, y: 0, w: 16, h: 16 },
  ],
};

describe("atlas-format compact codec", () => {
  it("round-trips a character payload (points + groups)", () => {
    const compact = toCompactPayload(characterPayload);
    expect(compact.meta.format).toBe("compact");
    expect(compact.points).toEqual(["head", "hand"]);
    expect(compact.groups).toEqual({ body: [[0, 1], [0, 1]] });

    const expanded = expandCompactPayload(compact);
    expect(expanded.frames).toEqual(characterPayload.frames);
    expect(expanded.groups).toEqual(characterPayload.groups);
  });

  it("round-trips a normal payload without a points table", () => {
    const compact = toCompactPayload(normalPayload);
    expect(compact.points).toBeUndefined();
    expect(compact.frames[0]).toEqual(["a", 0, 0, 16, 16]);
    expect(expandCompactPayload(compact).frames).toEqual(normalPayload.frames);
  });

  it("detects compact payloads structurally and by marker", () => {
    expect(isCompactPayload(toCompactPayload(normalPayload))).toBe(true);
    expect(isCompactPayload(normalPayload)).toBe(false);
  });

  it("normalize is idempotent on verbose payloads", () => {
    expect(normalizeAtlasPayload(normalPayload)).toBe(normalPayload);
    const fromCompact = normalizeAtlasPayload(toCompactPayload(characterPayload));
    expect((fromCompact as AtlasPayload).frames).toEqual(characterPayload.frames);
  });

  it("serializes each mode and parses back to the same data", () => {
    const pretty = serializeAtlasPayload(characterPayload, "pretty");
    const minified = serializeAtlasPayload(characterPayload, "minified");
    const compact = serializeAtlasPayload(characterPayload, "compact");

    expect(pretty.length).toBeGreaterThan(minified.length);
    expect(compact.length).toBeLessThan(minified.length);

    expect(normalizeAtlasPayload(JSON.parse(compact))).toEqual(
      normalizeAtlasPayload(JSON.parse(pretty))
    );
  });
});
