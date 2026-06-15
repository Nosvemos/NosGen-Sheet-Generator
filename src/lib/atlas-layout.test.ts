import { describe, expect, it } from "vitest";
import {
  computeAtlasLayoutByMode,
  resolveFramePlacements,
} from "./atlas-layout";

const frames = [
  { width: 64, height: 64 },
  { width: 48, height: 80 },
  { width: 96, height: 48 },
  { width: 32, height: 32 },
];

describe("atlas-layout", () => {
  it("tags layouts with their mode", () => {
    expect(
      computeAtlasLayoutByMode(frames, { mode: "uniform", rows: 2, padding: 2 })
        .mode
    ).toBe("uniform");
    expect(
      computeAtlasLayoutByMode(frames, { mode: "tight", rows: 2, padding: 2 })
        .mode
    ).toBe("tight");
    expect(
      computeAtlasLayoutByMode(frames, { mode: "shelf", padding: 2 }).mode
    ).toBe("shelf");
  });

  it("produces one placement per frame within atlas bounds", () => {
    for (const mode of ["uniform", "tight", "shelf"] as const) {
      const layout = computeAtlasLayoutByMode(frames, {
        mode,
        rows: 2,
        padding: 2,
      });
      const placements = resolveFramePlacements(layout, frames);
      expect(placements).toHaveLength(frames.length);
      placements.forEach((rect, index) => {
        expect(rect.w).toBe(frames[index].width);
        expect(rect.h).toBe(frames[index].height);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(layout.width);
        expect(rect.y + rect.h).toBeLessThanOrEqual(layout.height);
      });
    }
  });

  it("centers frames inside uniform cells", () => {
    const layout = computeAtlasLayoutByMode(frames, {
      mode: "uniform",
      rows: 2,
      padding: 0,
    });
    const placements = resolveFramePlacements(layout, frames);
    // Frame 3 (32x32) sits in a 96x80 cell -> centered by (cellW-w)/2.
    const offsetX = Math.floor((layout.cellWidth - frames[3].width) / 2);
    expect(placements[3].x).toBe(layout.positions[3].x + offsetX);
  });

  it("shelf packing is no taller than uniform for varied sizes", () => {
    const shelf = computeAtlasLayoutByMode(frames, { mode: "shelf", padding: 2 });
    const uniform = computeAtlasLayoutByMode(frames, {
      mode: "uniform",
      rows: 2,
      padding: 2,
    });
    expect(shelf.width * shelf.height).toBeLessThanOrEqual(
      uniform.width * uniform.height
    );
  });
});
