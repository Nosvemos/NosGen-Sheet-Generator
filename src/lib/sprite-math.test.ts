import { describe, expect, it } from "vitest";
import {
  clamp,
  deterministicColor,
  fromPivotCoords,
  interpolateLinear,
  normalizeExportName,
  toPivotCoords,
} from "./sprite-math";

describe("sprite-math", () => {
  it("clamps to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("normalizes export names", () => {
    expect(normalizeExportName("  My Hero! ", "sprite")).toBe("My_Hero");
    expect(normalizeExportName("   ", "sprite")).toBe("sprite");
  });

  it("deterministic color is stable per name", () => {
    expect(deterministicColor("head")).toBe(deterministicColor("head"));
    expect(deterministicColor("head")).not.toBe(deterministicColor("hand"));
  });

  it("pivot conversion round-trips for every mode", () => {
    const frame = { width: 64, height: 48 };
    const point = { x: 20, y: 12 };
    for (const mode of ["top-left", "bottom-left", "center"] as const) {
      const pivot = toPivotCoords(point, frame, mode);
      const back = fromPivotCoords(pivot, frame, mode);
      expect(back.x).toBeCloseTo(point.x);
      expect(back.y).toBeCloseTo(point.y);
    }
  });

  it("interpolates linearly between keyframes", () => {
    const keyframes = [
      { frameIndex: 0, x: 0, y: 0 },
      { frameIndex: 2, x: 10, y: 20 },
    ];
    const mid = interpolateLinear(keyframes, 1, 4);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeCloseTo(10);
  });

  it("handles unsorted keyframes in interpolateTangent", () => {
    const keyframes = [
      { frameIndex: 2, x: 10, y: 20 },
      { frameIndex: 0, x: 0, y: 0 },
    ];
    const mid = interpolateLinear(keyframes, 1, 4);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeCloseTo(10);
  });
});
