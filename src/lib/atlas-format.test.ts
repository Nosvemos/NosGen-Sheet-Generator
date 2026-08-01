import { describe, expect, it } from "vitest";
import {
  normalizeAtlasPayload,
  serializeAtlasPayload,
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
    rotation: "clockwise",
    mode: "ship",
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
  meta: { app: "NosGalaxy", mode: "normal", pivot: "top-left" },
  frames: [
    { name: "a", x: 0, y: 0, w: 16, h: 16 },
    { name: "b", x: 18, y: 0, w: 16, h: 16 },
  ],
};

describe("atlas-format codecs (pretty & raylib)", () => {
  it("normalize is idempotent on verbose payloads", () => {
    expect(normalizeAtlasPayload(normalPayload)).toBe(normalPayload);
    expect(normalizeAtlasPayload(characterPayload)).toBe(characterPayload);
  });

  it("serializes pretty mode and parses back to the same data", () => {
    const pretty = serializeAtlasPayload(characterPayload, "pretty");
    const parsed = normalizeAtlasPayload(JSON.parse(pretty));
    expect((parsed as AtlasPayload).frames).toEqual(characterPayload.frames);
  });

  it("serializes raylib mode with collapsed arrays", () => {
    const raylibData = {
      meta: { app: "NosGalaxy", version: "1.0" },
      rects: [[0, 0], [356, 0]],
    };
    const serialized = serializeAtlasPayload(raylibData, "raylib");
    expect(serialized).toContain('"rects": [[0, 0], [356, 0]]');
  });
});
