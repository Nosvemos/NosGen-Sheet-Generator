import { describe, expect, it } from "vitest";
import { buildAtlasJsonPayload } from "./editor-export-builders";
import type { FrameData } from "./editor-types";

const mockFrames: FrameData[] = [
  {
    id: "f1",
    name: "ship_idle_01",
    width: 64,
    height: 64,
    image: {} as HTMLImageElement,
    points: [{ id: "p1", name: "cockpit", x: 32, y: 20, color: "#60a5fa" }],
  },
  {
    id: "f2",
    name: "ship_idle_02",
    width: 64,
    height: 64,
    image: {} as HTMLImageElement,
    points: [{ id: "p1", name: "cockpit", x: 32, y: 22, color: "#60a5fa" }],
  },
];

describe("buildAtlasJsonPayload Raylib export", () => {
  it("builds Raylib format payload when exportJsonMode is raylib", () => {
    const result = buildAtlasJsonPayload({
      frames: mockFrames,
      rows: 1,
      padding: 2,
      packingMode: "shelf",
      exportScale: 1,
      pivotMode: "center",
      rotation: "clockwise",
      appMode: "ship",
      pointGroups: [{ id: "g1", name: "weapons", entries: [["p1"]] }],
      animationName: "idle",
      fps: 12,
      speed: 1,
      loop: true,
      exportSize: 1,
      exportFormat: "png",
      exportJsonMode: "raylib",
      minScale: 0.1,
      maxScale: 4,
      selectedAnimationFrames: mockFrames,
      exportAtlasName: "player_ship",
    });

    expect(result).toBeDefined();
    const payload = result as {
      meta: { app: string; mode: string };
      frames?: unknown;
      rects: unknown;
      points: Record<string, unknown>;
      point_groups: Record<string, unknown>;
    };
    expect(payload.meta.app).toBe("NosGalaxy");
    expect(payload.meta.mode).toBe("ship");
    expect(payload.frames).toBeUndefined();
    expect(payload.rects).toEqual([[2, 2], [2, 68]]);
    expect(payload.points.cockpit).toBeDefined();
    expect(payload.point_groups.weapons).toBeDefined();
  });
});
