import type { AtlasLayout, AtlasPackingMode } from "@/lib/editor-types";

export interface SizedItem {
  width: number;
  height: number;
}

export type FramePlacement = { x: number; y: number; w: number; h: number };

export type ShelfAtlasLayout = AtlasLayout & {
  mode: "shelf";
};

export const computeAtlasLayout = (
  frames: SizedItem[],
  rows: number,
  padding: number,
  mode: "uniform" | "tight" = "uniform"
): AtlasLayout => {
  if (mode === "tight") {
    return computeTightAtlasLayout(frames, rows, padding);
  }
  const safePadding = Math.max(0, Math.round(padding));
  const safeRows = Math.max(1, Math.round(rows) || 1);
  const cellWidth = Math.max(1, ...frames.map((frame) => frame.width));
  const cellHeight = Math.max(1, ...frames.map((frame) => frame.height));
  const columns = Math.max(1, Math.ceil(frames.length / safeRows));
  const width = columns * cellWidth + safePadding * (columns + 1);
  const height = safeRows * cellHeight + safePadding * (safeRows + 1);
  const positions = frames.map((_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      x: safePadding + column * (cellWidth + safePadding),
      y: safePadding + row * (cellHeight + safePadding),
      w: cellWidth,
      h: cellHeight,
    };
  });

  return {
    rows: safeRows,
    columns,
    padding: safePadding,
    cellWidth,
    cellHeight,
    width,
    height,
    positions,
    mode: "uniform",
  };
};

export const computeTightAtlasLayout = <T extends SizedItem>(
  frames: T[],
  rows: number,
  padding: number
): AtlasLayout => {
  const safePadding = Math.max(0, Math.round(padding));
  const safeRows = Math.max(1, Math.round(rows) || 1);
  const columns = Math.max(1, Math.ceil(frames.length / safeRows));

  const colWidths: number[] = new Array(columns).fill(0);
  const rowHeights: number[] = new Array(safeRows).fill(0);

  frames.forEach((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    colWidths[col] = Math.max(colWidths[col], frame.width);
    rowHeights[row] = Math.max(rowHeights[row], frame.height);
  });

  const colX: number[] = new Array(columns).fill(0);
  const rowY: number[] = new Array(safeRows).fill(0);
  for (let c = 1; c < columns; c++) {
    colX[c] = colX[c - 1] + colWidths[c - 1] + safePadding;
  }
  for (let r = 1; r < safeRows; r++) {
    rowY[r] = rowY[r - 1] + rowHeights[r - 1] + safePadding;
  }

  const width = colX[columns - 1] + colWidths[columns - 1] + safePadding;
  const height = rowY[safeRows - 1] + rowHeights[safeRows - 1] + safePadding;

  const positions = frames.map((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const offsetX = Math.floor((colWidths[col] - frame.width) / 2);
    const offsetY = Math.floor((rowHeights[row] - frame.height) / 2);
    return {
      x: colX[col] + offsetX,
      y: rowY[row] + offsetY,
      w: colWidths[col],
      h: rowHeights[row],
    };
  });

  return {
    rows: safeRows,
    columns,
    padding: safePadding,
    cellWidth: Math.max(1, ...colWidths),
    cellHeight: Math.max(1, ...rowHeights),
    width,
    height,
    positions,
    mode: "tight",
  };
};

export const computeShelfAtlasLayout = <T extends SizedItem>(
  frames: T[],
  padding: number,
  maxWidth?: number
): ShelfAtlasLayout => {
  const safePadding = Math.max(0, Math.round(padding));
  const sorted = [...frames]
    .map((frame, index) => ({ frame, index }))
    .sort((a, b) => b.frame.height - a.frame.height);

  const limit =
    maxWidth && maxWidth > 0
      ? maxWidth
      : Math.ceil(
          Math.sqrt(
            sorted.reduce(
              (sum, { frame }) =>
                sum + (frame.width + safePadding) * (frame.height + safePadding),
              0
            )
          )
        ) * 2;

  const shelves: {
    y: number;
    height: number;
    currentX: number;
    items: { index: number; x: number }[];
  }[] = [];

  for (const { frame, index } of sorted) {
    let placed = false;
    for (const shelf of shelves) {
      if (
        shelf.currentX + frame.width + safePadding <= limit + safePadding &&
        frame.height <= shelf.height
      ) {
        shelf.items.push({ index, x: shelf.currentX });
        shelf.currentX += frame.width + safePadding;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const y =
        shelves.length === 0
          ? safePadding
          : shelves[shelves.length - 1].y +
            shelves[shelves.length - 1].height +
            safePadding;
      shelves.push({
        y,
        height: frame.height,
        currentX: safePadding + frame.width + safePadding,
        items: [{ index, x: safePadding }],
      });
    }
  }

  const positions = new Array<{ x: number; y: number; w: number; h: number }>(
    frames.length
  );
  let totalWidth = 0;
  let totalHeight = 0;

  for (const shelf of shelves) {
    const shelfWidth =
      shelf.items.reduce(
        (max, item) => Math.max(max, item.x + frames[item.index].width),
        0
      ) + safePadding;
    totalWidth = Math.max(totalWidth, shelfWidth);
    totalHeight = Math.max(totalHeight, shelf.y + shelf.height + safePadding);
    for (const item of shelf.items) {
      const frame = frames[item.index];
      positions[item.index] = {
        x: item.x,
        y: shelf.y + Math.floor((shelf.height - frame.height) / 2),
        w: frame.width,
        h: frame.height,
      };
    }
  }

  return {
    rows: shelves.length,
    columns: -1,
    padding: safePadding,
    cellWidth: Math.max(1, ...frames.map((f) => f.width)),
    cellHeight: Math.max(1, ...frames.map((f) => f.height)),
    width: totalWidth,
    height: totalHeight,
    positions,
    mode: "shelf",
  };
};

// Single entry point: pick a packing algorithm by mode. Shared by the web
// export pipeline and the CLI so both produce identical layouts.
export const computeAtlasLayoutByMode = <T extends SizedItem>(
  frames: T[],
  options: { mode?: AtlasPackingMode; rows?: number; padding?: number }
): AtlasLayout => {
  const padding = options.padding ?? 0;
  const mode = options.mode ?? "uniform";
  if (mode === "shelf") {
    return computeShelfAtlasLayout(frames, padding);
  }
  const rows =
    options.rows ?? Math.max(1, Math.ceil(Math.sqrt(frames.length)));
  if (mode === "tight") {
    return computeTightAtlasLayout(frames, rows, padding);
  }
  return computeAtlasLayout(frames, rows, padding, "uniform");
};

// Convert a layout's cells into final frame draw rects. Uniform layouts use
// max-size cells and need the frame centered inside; tight/shelf already store
// frame-final positions. This keeps drawing logic identical across all modes
// (the historical bug was that the web export only handled uniform centering).
export const resolveFramePlacements = (
  layout: AtlasLayout,
  frames: SizedItem[]
): FramePlacement[] =>
  layout.positions.map((cell, index) => {
    const frame = frames[index] ?? { width: cell.w, height: cell.h };
    if (layout.mode === "tight" || layout.mode === "shelf") {
      return { x: cell.x, y: cell.y, w: frame.width, h: frame.height };
    }
    return {
      x: cell.x + Math.floor((layout.cellWidth - frame.width) / 2),
      y: cell.y + Math.floor((layout.cellHeight - frame.height) / 2),
      w: frame.width,
      h: frame.height,
    };
  });
