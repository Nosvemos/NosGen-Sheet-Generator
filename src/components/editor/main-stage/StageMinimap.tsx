import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction, PointerEvent } from "react";
import type { AtlasLayout, FrameData, ViewMode } from "@/lib/editor-types";
import { Button } from "@/components/ui/button";
import { Focus, Maximize2, Map } from "lucide-react";

type StageMinimapProps = {
  currentFrame: FrameData | undefined;
  frames: FrameData[];
  atlasLayout: AtlasLayout;
  viewMode: ViewMode;
  frameZoom: number;
  panOffset: { x: number; y: number };
  setPanOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setFrameZoom: Dispatch<SetStateAction<number>>;
};

export function StageMinimap({
  currentFrame,
  atlasLayout,
  viewMode,
  frameZoom,
  panOffset,
  setPanOffset,
  setFrameZoom,
}: StageMinimapProps) {
  const [isOpen, setIsOpen] = useState(true);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);

  const width = viewMode === "frame" ? currentFrame?.width ?? 100 : atlasLayout.width || 100;
  const height = viewMode === "frame" ? currentFrame?.height ?? 100 : atlasLayout.height || 100;

  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !width || !height) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min((canvas.width - 8) / width, (canvas.height - 8) / height);
    const drawW = width * scale;
    const drawH = height * scale;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;

    // Draw background outline
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(offsetX, offsetY, drawW, drawH);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.strokeRect(offsetX, offsetY, drawW, drawH);

    // Render mini image if available
    if (viewMode === "frame" && currentFrame?.image) {
      ctx.drawImage(currentFrame.image, offsetX, offsetY, drawW, drawH);
    }

    // Calculate viewport indicator box
    const viewportScale = scale / Math.max(0.2, frameZoom);
    const boxW = Math.min(drawW, Math.max(16, (canvas.width * 0.75) * viewportScale));
    const boxH = Math.min(drawH, Math.max(16, (canvas.height * 0.75) * viewportScale));

    const boxX = Math.max(offsetX, Math.min(offsetX + drawW - boxW, offsetX + drawW / 2 - (panOffset.x * scale) - boxW / 2));
    const boxY = Math.max(offsetY, Math.min(offsetY + drawH - boxH, offsetY + drawH / 2 - (panOffset.y * scale) - boxH / 2));

    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
  }, [currentFrame, atlasLayout, viewMode, frameZoom, panOffset, width, height]);

  const handleMinimapPan = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !width || !height) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setPanOffset({
      x: (clickX - canvas.width / 2) * -1.2,
      y: (clickY - canvas.height / 2) * -1.2,
    });
  };

  const handleResetView = () => {
    setFrameZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-1.5 select-none">
      {isOpen ? (
        <div className="relative flex flex-col rounded-2xl border border-border/70 bg-card/90 p-2 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-1 pb-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Map className="h-3 w-3" /> Minimap
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
                onClick={handleResetView}
                title="Reset View (Center / 100%)"
              >
                <Focus className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                title="Minimize Minimap"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <canvas
            ref={minimapCanvasRef}
            width={120}
            height={80}
            className="cursor-crosshair rounded-lg border border-border/50 bg-black/40"
            onPointerDown={(e) => {
              isDraggingRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              handleMinimapPan(e);
            }}
            onPointerMove={(e) => {
              if (isDraggingRef.current) {
                handleMinimapPan(e);
              }
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
            }}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-border/70 bg-card/90 px-3 text-xs shadow-md backdrop-blur"
          onClick={() => setIsOpen(true)}
        >
          <Map className="h-3.5 w-3.5" />
          Minimap
        </Button>
      )}
    </div>
  );
}
