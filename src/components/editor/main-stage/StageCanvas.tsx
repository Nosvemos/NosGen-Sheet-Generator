import type { PointerEvent, RefObject, WheelEvent } from "react";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type { EditorMode, ViewMode } from "@/lib/editor-types";
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
  framesInputRef: RefObject<HTMLInputElement | null>;
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
  framesInputRef,
}: StageCanvasProps) {
  return (
    <div
      ref={stageRef}
      className="relative mt-4 flex-1 min-h-0 max-h-[58vh] overflow-hidden rounded-2xl border border-border/60 bg-background/70"
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
        onWheel={handleCanvasWheel}
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

      {framesLength > 0 && editorMode === "add" && viewMode === "frame" && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent-foreground">
          {t("status.addMode")}
        </div>
      )}
    </div>
  );
}
