import { describe, expect, it } from "vitest";
import { resolveFramePlacements } from "../lib/atlas-layout";
import {
  buildLayout,
  matchWildcard,
  processPoints,
  validateAtlasEntry,
} from "./engine";

describe("cli engine helpers", () => {
  it("uses shared centered placements for uniform layouts", () => {
    const frames = [
      { width: 64, height: 64 },
      { width: 32, height: 32 },
    ];
    const layout = buildLayout(frames, {
      mode: "uniform",
      rows: 1,
      padding: 0,
    });
    const placements = resolveFramePlacements(layout, frames);

    expect(placements[1]).toEqual({
      x: 80,
      y: 16,
      w: 32,
      h: 32,
    });
  });

  it("escapes regex metacharacters in animation wildcards", () => {
    expect(matchWildcard("walk.01", "walk.01")).toBe(true);
    expect(matchWildcard("walk.01", "walkX01")).toBe(false);
    expect(matchWildcard("idle[1]", "idle[1]")).toBe(true);
    expect(matchWildcard("idle[1]", "idle1")).toBe(false);
    expect(matchWildcard("walk_0?", "walk_01")).toBe(true);
  });

  it("validates imported atlas frame bounds", () => {
    const atlas = { width: 64, height: 64 };

    expect(validateAtlasEntry({ x: 0, y: 0, w: 64, h: 64 }, atlas)).toBe(true);
    expect(validateAtlasEntry({ x: -1, y: 0, w: 64, h: 64 }, atlas)).toBe(false);
    expect(validateAtlasEntry({ x: 32, y: 32, w: 64, h: 64 }, atlas)).toBe(false);
    expect(validateAtlasEntry({ x: Number.NaN, y: 0, w: 1, h: 1 }, atlas)).toBe(false);
  });

  it("honors disabled auto-fill in point config", () => {
    const frames = [
      { name: "a", path: "a.png", width: 10, height: 10, points: [] },
      { name: "b", path: "b.png", width: 10, height: 10, points: [] },
      { name: "c", path: "c.png", width: 10, height: 10, points: [] },
    ];

    processPoints(frames, [
      {
        name: "hand",
        keyframes: [
          { frameIndex: 0, x: 0, y: 0 },
          { frameIndex: 2, x: 10, y: 10 },
        ],
        autoFill: { shape: "linear", enabled: false },
      },
    ]);

    expect(frames[1].points[0]).toMatchObject({
      name: "hand",
      x: 0,
      y: 0,
      isKeyframe: false,
    });
  });
});
