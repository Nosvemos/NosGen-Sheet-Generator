import { useState } from "react";
import type { Dispatch, DragEvent, PointerEvent, RefObject, SetStateAction, WheelEvent } from "react";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type { AtlasLayout, EditorMode, FrameData, ViewMode } from "@/lib/editor-types";
import { StageMinimap } from "@/components/editor/main-stage/StageMinimap";
import { Upload } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type StageCanvasProps = {
  t: Translate;
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  editorMode: EditorMode;
  viewMode: ViewMode;
  framesLength: number;
  handleCanvasPointerDown: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasPointerUp: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasWheel: (event: WheelEvent<HTMLCanvasElement>) => void;
  handleDroppedFiles: (files: File[] | FileList) => Promise<void> | void;
  framesInputRef: RefObject<HTMLInputElement | null>;
  currentFrame?: FrameData;
  frames?: FrameData[];
  atlasLayout?: AtlasLayout;
  frameZoom?: number;
  setFrameZoom?: Dispatch<SetStateAction<number>>;
  panOffset?: { x: number; y: number };
  setPanOffset?: Dispatch<SetStateAction<{ x: number; y: number }>>;
};

export function StageCanvas({
  t,
  stageRef,
  canvasRef,
  editorMode,
  viewMode,
  framesLength,
  handleCanvasPointerDown,
  handleCanvasPointerMove,
  handleCanvasPointerUp,
  handleCanvasWheel,
  handleDroppedFiles,
  framesInputRef,
  currentFrame,
  frames = [],
  atlasLayout = { rows: 1, columns: 1, padding: 0, cellWidth: 0, cellHeight: 0, width: 0, height: 0, positions: [] },
  frameZoom = 1,
  setFrameZoom,
  panOffset = { x: 0, y: 0 },
  setPanOffset,
}: StageCanvasProps) {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const hasFiles = (event: DragEvent<HTMLDivElement>) =>
    Array.from(event.dataTransfer.types).includes("Files");

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative mt-4 flex-1 min-h-0 max-h-[58vh] overflow-hidden rounded-2xl border border-border/60 bg-background/70 transition-colors",
        isDraggingFiles && "border-accent/70 bg-accent/10"
      )}
      onDragEnter={(event) => {
        if (!hasFiles(event)) {
          return;
        }
        event.preventDefault();
        setIsDraggingFiles(true);
      }}
      onDragOver={(event) => {
        if (!hasFiles(event)) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDraggingFiles(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDraggingFiles(false);
        }
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) {
          return;
        }
        event.preventDefault();
        setIsDraggingFiles(false);
        if (event.dataTransfer.files.length > 0) {
          void handleDroppedFiles(event.dataTransfer.files);
        }
      }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "h-full w-full touch-none",
          editorMode === "add" ? "cursor-crosshair" : "cursor-default"
        )}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onWheel={handleCanvasWheel}
        onContextMenu={(event) => event.preventDefault()}
      />

      {framesLength === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <button
            type="button"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/60 transition hover:bg-muted/80"
            onClick={() => framesInputRef.current?.click()}
            aria-label={t("label.pngFrames")}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
          </button>
          <p className="text-sm font-medium">{t("hint.noFramesTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("hint.noFramesBody")}</p>
        </div>
      )}

      {isDraggingFiles && (
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-2xl border border-dashed border-accent/70 bg-background/80 text-sm font-medium text-foreground shadow-soft backdrop-blur">
          {t("hint.dropFiles")}
        </div>
      )}

      {framesLength > 0 && editorMode === "add" && viewMode === "frame" && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent-foreground">
          {t("status.addMode")}
        </div>
      )}

      {framesLength > 0 && setPanOffset && setFrameZoom && (
        <StageMinimap
          currentFrame={currentFrame}
          frames={frames}
          atlasLayout={atlasLayout}
          viewMode={viewMode}
          frameZoom={frameZoom}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          setFrameZoom={setFrameZoom}
        />
      )}
    </div>
  );
}
