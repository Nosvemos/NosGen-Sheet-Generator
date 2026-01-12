import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n";
import type { EditorMode, FrameData } from "@/lib/editor-types";
import { Crosshair, MousePointer2, Plus } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type PointModeCardProps = {
  t: Translate;
  editorMode: EditorMode;
  setEditorMode: Dispatch<SetStateAction<EditorMode>>;
  currentFrame?: FrameData;
  addPointAt: (x: number, y: number) => void;
};

export function PointModeCard({
  t,
  editorMode,
  setEditorMode,
  currentFrame,
  addPointAt,
}: PointModeCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t("label.mode")}
        </Label>
        <Badge variant="outline" className="font-mono text-xs">
          {editorMode === "add" ? t("mode.add") : t("mode.select")}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={editorMode === "select" ? "default" : "secondary"}
          size="sm"
          onClick={() => setEditorMode("select")}
        >
          <MousePointer2 className="mr-2 h-4 w-4" />
          {t("action.select")}
        </Button>
        <Button
          variant={editorMode === "add" ? "default" : "secondary"}
          size="sm"
          onClick={() => setEditorMode("add")}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("action.addPoint")}
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          if (!currentFrame) {
            return;
          }
          addPointAt(currentFrame.width / 2, currentFrame.height / 2);
        }}
        disabled={!currentFrame}
      >
        <Crosshair className="mr-2 h-4 w-4" />
        {t("action.centerPoint")}
      </Button>
    </div>
  );
}
