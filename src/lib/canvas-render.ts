import type {
  AtlasLayout,
  AutoFillModel,
  FrameData,
  FramePoint,
  PivotMode,
  StageTransform,
  ViewMode,
} from "@/lib/editor-types";
import { drawCheckerboard, toHslColor } from "@/lib/editor-helpers";

type RenderCanvasParams = {
  canvas: HTMLCanvasElement | null;
  stageSize: { width: number; height: number };
  viewMode: ViewMode;
  currentFrame?: FrameData;
  frames: FrameData[];
  atlasLayout: AtlasLayout;
  currentFrameIndex: number;
  showGrid: boolean;
  showPoints: boolean;
  pivotMode: PivotMode;
  groupPreviewIds: string[] | null;
  currentPoints: FramePoint[];
  selectedPointId: string | null;
  selectedPoint: FramePoint | null;
  selectedAutoFillModel: AutoFillModel | null;
  selectedAutoFillPositions: Array<{ x: number; y: number }> | null;
  isCharacterMode: boolean;
  getFrameTransform: (
    viewWidth: number,
    viewHeight: number
  ) => StageTransform | null;
  transformRef: React.RefObject<StageTransform | null>;
};

export const renderCanvas = ({
  canvas,
  stageSize,
  viewMode,
  currentFrame,
  frames,
  atlasLayout,
  currentFrameIndex,
  showGrid,
  showPoints,
  pivotMode,
  groupPreviewIds,
  currentPoints,
  selectedPointId,
  selectedPoint,
  selectedAutoFillModel,
  selectedAutoFillPositions,
  isCharacterMode,
  getFrameTransform,
  transformRef,
}: RenderCanvasParams) => {
  if (!canvas || stageSize.width === 0 || stageSize.height === 0) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const viewWidth = canvas.width / dpr;
  const viewHeight = canvas.height / dpr;
  const styles = window.getComputedStyle(document.documentElement);
  const accentColor = toHslColor(
    styles.getPropertyValue("--accent"),
    "hsl(197 52% 48%)"
  );
  const accentStrong = toHslColor(
    styles.getPropertyValue("--accent"),
    "rgba(44, 155, 167, 0.8)",
    0.85
  );
  const mutedColor = toHslColor(
    styles.getPropertyValue("--muted-foreground"),
    "rgba(28, 32, 40, 0.8)",
    0.8
  );
  const borderColor = toHslColor(
    styles.getPropertyValue("--border"),
    "rgba(20, 20, 20, 0.12)",
    0.4
  );
  const checkerBase = toHslColor(
    styles.getPropertyValue("--background"),
    "rgba(255, 255, 255, 0.6)",
    0.9
  );
  const checkerAlt = toHslColor(
    styles.getPropertyValue("--muted"),
    "rgba(233, 233, 233, 0.7)",
    0.75
  );
  const gridColor = toHslColor(
    styles.getPropertyValue("--border"),
    "rgba(20, 20, 20, 0.08)",
    0.6
  );
  const frameOutline = toHslColor(
    styles.getPropertyValue("--border"),
    "rgba(18, 24, 33, 0.2)",
    0.5
  );
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  drawCheckerboard(ctx, viewWidth, viewHeight, 18, checkerBase, checkerAlt);

  if (viewMode === "frame" && currentFrame) {
    const transform = getFrameTransform(viewWidth, viewHeight);
    if (!transform) {
      return;
    }
    const { scale, offsetX, offsetY } = transform;
    const drawWidth = currentFrame.width * scale;
    const drawHeight = currentFrame.height * scale;

    transformRef.current = transform;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.shadowColor = "rgba(20, 24, 28, 0.2)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(currentFrame.image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    ctx.strokeStyle = frameOutline;
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);

    if (showGrid) {
      const targetScreenStep = 16;
      const gridStep = Math.max(1, Math.round(targetScreenStep / scale));
      if (gridStep > 0) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let x = 0; x <= currentFrame.width; x += gridStep) {
          const px = offsetX + x * scale;
          ctx.beginPath();
          ctx.moveTo(px, offsetY);
          ctx.lineTo(px, offsetY + drawHeight);
          ctx.stroke();
        }
        for (let y = 0; y <= currentFrame.height; y += gridStep) {
          const py = offsetY + y * scale;
          ctx.beginPath();
          ctx.moveTo(offsetX, py);
          ctx.lineTo(offsetX + drawWidth, py);
          ctx.stroke();
        }
      }
    }

    const pivotPoint =
      pivotMode === "center"
        ? { x: currentFrame.width / 2, y: currentFrame.height / 2 }
        : pivotMode === "bottom-left"
          ? { x: 0, y: currentFrame.height }
          : { x: 0, y: 0 };
    const pivotX = offsetX + pivotPoint.x * scale;
    const pivotY = offsetY + pivotPoint.y * scale;
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = accentStrong;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX - 14, pivotY);
    ctx.lineTo(pivotX + 14, pivotY);
    ctx.moveTo(pivotX, pivotY - 14);
    ctx.lineTo(pivotX, pivotY + 14);
    ctx.stroke();
    ctx.restore();

    if (showPoints && selectedPoint && selectedAutoFillPositions) {
      const shouldClose =
        selectedAutoFillModel?.shape === "ellipse" ||
        selectedAutoFillModel?.shape === "circle" ||
        selectedAutoFillModel?.shape === "square" ||
        selectedAutoFillModel?.shape === "tangent";
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = selectedPoint.color || accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      selectedAutoFillPositions.forEach((point, index) => {
        const px = offsetX + point.x * scale;
        const py = offsetY + point.y * scale;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      if (shouldClose && selectedAutoFillPositions.length > 0) {
        const first = selectedAutoFillPositions[0];
        ctx.lineTo(offsetX + first.x * scale, offsetY + first.y * scale);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (showPoints && isCharacterMode) {
      const pointsToRender = groupPreviewIds
        ? currentPoints.filter((point) => groupPreviewIds.includes(point.id))
        : currentPoints;
      pointsToRender.forEach((point) => {
        const px = offsetX + point.x * scale;
        const py = offsetY + point.y * scale;
        const isSelected = point.id === selectedPointId;
        ctx.beginPath();
        ctx.fillStyle = point.color || accentColor;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.arc(px, py, isSelected ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "12px 'Space Grotesk'";
        ctx.fillStyle = mutedColor;
        ctx.fillText(point.name, px + 10, py - 10);
      });
    }
  } else if (viewMode === "atlas" && frames.length > 0) {
    transformRef.current = null;
    const margin = 24;
    const scale = Math.min(
      (viewWidth - margin * 2) / atlasLayout.width,
      (viewHeight - margin * 2) / atlasLayout.height
    );
    const drawWidth = atlasLayout.width * scale;
    const drawHeight = atlasLayout.height * scale;
    const offsetX = (viewWidth - drawWidth) / 2;
    const offsetY = (viewHeight - drawHeight) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    atlasLayout.positions.forEach((cell, index) => {
      const frame = frames[index];
      if (!frame) {
        return;
      }
      const offsetCellX = Math.floor((atlasLayout.cellWidth - frame.width) / 2);
      const offsetCellY = Math.floor((atlasLayout.cellHeight - frame.height) / 2);
      ctx.drawImage(
        frame.image,
        cell.x + offsetCellX,
        cell.y + offsetCellY,
        frame.width,
        frame.height
      );
    });

    ctx.restore();

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 / scale;
    atlasLayout.positions.forEach((cell, index) => {
      ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
      if (index === currentFrameIndex) {
        ctx.save();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
        ctx.restore();
      }
    });
    ctx.restore();
  } else {
    transformRef.current = null;
  }
};
