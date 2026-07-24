import type { AtlasLayout, AtlasPackingMode } from "@/lib/editor-types";

export interface SizedItem {
  width: number;
  height: number;
}

export type FramePlacement = { x: number; y: number; w: number; h: number };

export type ShelfAtlasLayout = AtlasLayout & {
  mode: "shelf";
};

export type MaxRectsAtlasLayout = AtlasLayout & {
  mode: "maxrects";
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

type InternalShelf = {
  y: number;
  height: number;
  currentX: number;
  items: { index: number; x: number }[];
};

const packShelvesForWidth = <T extends SizedItem>(
  sorted: { frame: T; index: number }[],
  safePadding: number,
  limitWidth: number
) => {
  const shelves: InternalShelf[] = [];

  for (const { frame, index } of sorted) {
    let placed = false;
    for (const shelf of shelves) {
      if (
        shelf.currentX + frame.width + safePadding <= limitWidth + safePadding &&
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

  let totalWidth = 0;
  for (const shelf of shelves) {
    let shelfMaxX = safePadding;
    for (const item of shelf.items) {
      const itemFrame = sorted.find((s) => s.index === item.index)!.frame;
      shelfMaxX = Math.max(shelfMaxX, item.x + itemFrame.width);
    }
    totalWidth = Math.max(totalWidth, shelfMaxX + safePadding);
  }
  const lastShelf = shelves[shelves.length - 1];
  const totalHeight = lastShelf ? lastShelf.y + lastShelf.height + safePadding : 0;
  const area = totalWidth * totalHeight;
  const aspectDiff = Math.abs(totalWidth - totalHeight);
  const score = area + aspectDiff * 0.1;

  return { shelves, totalWidth, totalHeight, area, score };
};

export const computeShelfAtlasLayout = <T extends SizedItem>(
  frames: T[],
  padding: number,
  maxWidth?: number
): ShelfAtlasLayout => {
  const safePadding = Math.max(0, Math.round(padding));
  if (frames.length === 0) {
    return {
      rows: 0,
      columns: -1,
      padding: safePadding,
      cellWidth: 1,
      cellHeight: 1,
      width: 0,
      height: 0,
      positions: [],
      mode: "shelf",
    };
  }

  const sorted = [...frames]
    .map((frame, index) => ({ frame, index }))
    .sort((a, b) => b.frame.height - a.frame.height || b.frame.width - a.frame.width);

  let bestResult: ReturnType<typeof packShelvesForWidth<T>>;

  if (maxWidth && maxWidth > 0) {
    bestResult = packShelvesForWidth(sorted, safePadding, maxWidth);
  } else {
    const totalArea = sorted.reduce(
      (sum, { frame }) =>
        sum + (frame.width + safePadding) * (frame.height + safePadding),
      0
    );
    const maxItemWidth = Math.max(...sorted.map(({ frame }) => frame.width));
    const idealSide = Math.ceil(Math.sqrt(totalArea));

    const minLimit = Math.max(idealSide, maxItemWidth + safePadding);
    const maxLimit = Math.max(Math.ceil(idealSide * 1.8), maxItemWidth + safePadding);

    const candidates = new Set<number>();
    candidates.add(minLimit);
    candidates.add(maxLimit);

    const step = Math.max(8, Math.floor((maxLimit - minLimit) / 24));
    for (let w = minLimit; w <= maxLimit; w += step) {
      candidates.add(w);
    }

    let accum = safePadding;
    for (const { frame } of sorted) {
      accum += frame.width + safePadding;
      if (accum >= minLimit && accum <= maxLimit) {
        candidates.add(accum);
      }
    }

    let bestScore = Infinity;
    bestResult = packShelvesForWidth(sorted, safePadding, minLimit);

    for (const candidateWidth of candidates) {
      const result = packShelvesForWidth(sorted, safePadding, candidateWidth);
      if (result.score < bestScore) {
        bestScore = result.score;
        bestResult = result;
      }
    }
  }

  const { shelves, totalWidth, totalHeight } = bestResult;

  const positions = new Array<{ x: number; y: number; w: number; h: number }>(
    frames.length
  );

  for (const shelf of shelves) {
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

type Rect = { x: number; y: number; w: number; h: number };

class MaxRectsBinPacker {
  binWidth: number;
  binHeight: number;
  usedRectangles: Rect[] = [];
  freeRectangles: Rect[] = [];

  constructor(width: number, height: number) {
    this.binWidth = width;
    this.binHeight = height;
    this.freeRectangles = [{ x: 0, y: 0, w: width, h: height }];
  }

  insert(width: number, height: number): Rect | null {
    let bestNode: Rect | null = null;
    let bestShortSideFit = Infinity;
    let bestAreaFit = Infinity;

    for (const freeRect of this.freeRectangles) {
      if (freeRect.w >= width && freeRect.h >= height) {
        const leftoverX = Math.abs(freeRect.w - width);
        const leftoverY = Math.abs(freeRect.h - height);
        const shortSideFit = Math.min(leftoverX, leftoverY);
        const areaFit = freeRect.w * freeRect.h - width * height;

        if (
          shortSideFit < bestShortSideFit ||
          (shortSideFit === bestShortSideFit && areaFit < bestAreaFit)
        ) {
          bestNode = { x: freeRect.x, y: freeRect.y, w: width, h: height };
          bestShortSideFit = shortSideFit;
          bestAreaFit = areaFit;
        }
      }
    }

    if (!bestNode) {
      return null;
    }

    this.placeRect(bestNode);
    return bestNode;
  }

  private placeRect(node: Rect) {
    let numRectanglesToProcess = this.freeRectangles.length;
    for (let i = 0; i < numRectanglesToProcess; ++i) {
      if (this.splitFreeNode(this.freeRectangles[i], node)) {
        this.freeRectangles.splice(i, 1);
        --i;
        --numRectanglesToProcess;
      }
    }
    this.pruneFreeList();
    this.usedRectangles.push(node);
  }

  private splitFreeNode(freeNode: Rect, usedNode: Rect): boolean {
    if (
      usedNode.x >= freeNode.x + freeNode.w ||
      usedNode.x + usedNode.w <= freeNode.x ||
      usedNode.y >= freeNode.y + freeNode.h ||
      usedNode.y + usedNode.h <= freeNode.y
    ) {
      return false;
    }

    if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.h) {
      const newNode = { ...freeNode, h: usedNode.y - freeNode.y };
      this.freeRectangles.push(newNode);
    }

    if (usedNode.y + usedNode.h < freeNode.y + freeNode.h) {
      const newNode = {
        x: freeNode.x,
        y: usedNode.y + usedNode.h,
        w: freeNode.w,
        h: freeNode.y + freeNode.h - (usedNode.y + usedNode.h),
      };
      this.freeRectangles.push(newNode);
    }

    if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.w) {
      const newNode = { ...freeNode, w: usedNode.x - freeNode.x };
      this.freeRectangles.push(newNode);
    }

    if (usedNode.x + usedNode.w < freeNode.x + freeNode.w) {
      const newNode = {
        x: usedNode.x + usedNode.w,
        y: freeNode.y,
        w: freeNode.x + freeNode.w - (usedNode.x + usedNode.w),
        h: freeNode.h,
      };
      this.freeRectangles.push(newNode);
    }

    return true;
  }

  private pruneFreeList() {
    for (let i = 0; i < this.freeRectangles.length; ++i) {
      for (let j = i + 1; j < this.freeRectangles.length; ++j) {
        if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
          this.freeRectangles.splice(i, 1);
          --i;
          break;
        }
        if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
          this.freeRectangles.splice(j, 1);
          --j;
        }
      }
    }
  }

  private isContainedIn(a: Rect, b: Rect): boolean {
    return (
      a.x >= b.x &&
      a.y >= b.y &&
      a.x + a.w <= b.x + b.w &&
      a.y + a.h <= b.y + b.h
    );
  }
}

export const computeMaxRectsAtlasLayout = <T extends SizedItem>(
  frames: T[],
  padding: number
): MaxRectsAtlasLayout => {
  const safePadding = Math.max(0, Math.round(padding));
  if (frames.length === 0) {
    return {
      rows: 0,
      columns: -1,
      padding: safePadding,
      cellWidth: 1,
      cellHeight: 1,
      width: 0,
      height: 0,
      positions: [],
      mode: "maxrects",
    };
  }

  const sorted = [...frames]
    .map((frame, index) => ({ frame, index }))
    .sort(
      (a, b) =>
        b.frame.width * b.frame.height - a.frame.width * a.frame.height ||
        b.frame.height - a.frame.height
    );

  const totalArea = sorted.reduce(
    (sum, { frame }) =>
      sum + (frame.width + safePadding) * (frame.height + safePadding),
    0
  );
  const maxItemWidth = Math.max(...sorted.map(({ frame }) => frame.width));
  const idealSide = Math.ceil(Math.sqrt(totalArea));

  const minBinW = Math.max(idealSide, maxItemWidth + safePadding * 2);
  const maxBinW = Math.max(Math.ceil(idealSide * 1.8), maxItemWidth + safePadding * 2);

  const candidateWidths: number[] = [];
  const step = Math.max(16, Math.floor((maxBinW - minBinW) / 20));
  for (let w = minBinW; w <= maxBinW; w += step) {
    candidateWidths.push(w);
  }

  let bestPositions: Rect[] = [];
  let bestWidth = Infinity;
  let bestHeight = Infinity;
  let bestScore = Infinity;

  for (const binW of candidateWidths) {
    const packer = new MaxRectsBinPacker(binW, 16384);
    const candidatePositions: Rect[] = new Array(frames.length);
    let success = true;

    for (const { frame, index } of sorted) {
      const wWithPad = frame.width + safePadding;
      const hWithPad = frame.height + safePadding;
      const node = packer.insert(wWithPad, hWithPad);
      if (!node) {
        success = false;
        break;
      }
      candidatePositions[index] = {
        x: node.x + safePadding,
        y: node.y + safePadding,
        w: frame.width,
        h: frame.height,
      };
    }

    if (!success) continue;

    let maxX = 0;
    let maxY = 0;
    for (const pos of candidatePositions) {
      if (pos) {
        maxX = Math.max(maxX, pos.x + pos.w + safePadding);
        maxY = Math.max(maxY, pos.y + pos.h + safePadding);
      }
    }

    const boundArea = maxX * maxY;
    const aspectDiff = Math.abs(maxX - maxY);
    const score = boundArea + aspectDiff * 0.1;

    if (score < bestScore) {
      bestScore = score;
      bestWidth = maxX;
      bestHeight = maxY;
      bestPositions = candidatePositions;
    }
  }

  // Fallback if no candidate bin fit: use shelf
  if (bestPositions.length === 0) {
    const shelf = computeShelfAtlasLayout(frames, safePadding);
    return {
      ...shelf,
      mode: "maxrects",
    };
  }

  return {
    rows: -1,
    columns: -1,
    padding: safePadding,
    cellWidth: Math.max(1, ...frames.map((f) => f.width)),
    cellHeight: Math.max(1, ...frames.map((f) => f.height)),
    width: bestWidth,
    height: bestHeight,
    positions: bestPositions,
    mode: "maxrects",
  };
};

export const computeAtlasLayoutByMode = <T extends SizedItem>(
  frames: T[],
  options: { mode?: AtlasPackingMode; rows?: number; padding?: number }
): AtlasLayout => {
  const padding = options.padding ?? 0;
  const mode = options.mode ?? "uniform";
  if (mode === "maxrects") {
    return computeMaxRectsAtlasLayout(frames, padding);
  }
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

export const resolveFramePlacements = (
  layout: AtlasLayout,
  frames: SizedItem[]
): FramePlacement[] =>
  layout.positions.map((cell, index) => {
    const frame = frames[index] ?? { width: cell.w, height: cell.h };
    if (layout.mode === "tight" || layout.mode === "shelf" || layout.mode === "maxrects") {
      return { x: cell.x, y: cell.y, w: frame.width, h: frame.height };
    }
    return {
      x: cell.x + Math.floor((layout.cellWidth - frame.width) / 2),
      y: cell.y + Math.floor((layout.cellHeight - frame.height) / 2),
      w: frame.width,
      h: frame.height,
    };
  });
