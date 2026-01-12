import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n";
import { Trash2 } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type NewAtlasCardProps = {
  t: Translate;
  framesLength: number;
  framesInputRef: RefObject<HTMLInputElement | null>;
  newPointsInputRef: RefObject<HTMLInputElement | null>;
  handleNewAtlasCreate: () => Promise<void> | void;
  handleNewPointsImport: (file: File) => Promise<void> | void;
  onClearFrames: () => void;
};

export function NewAtlasCard({
  t,
  framesLength,
  framesInputRef,
  newPointsInputRef,
  handleNewAtlasCreate,
  handleNewPointsImport,
  onClearFrames,
}: NewAtlasCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <Label>{t("label.newAtlas")}</Label>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {t("label.pngFrames")}
        </Label>
        <Input
          ref={framesInputRef}
          type="file"
          accept="image/png"
          multiple
          onChange={(event) => {
            if (event.target.files?.length) {
              void handleNewAtlasCreate();
            }
          }}
        />
        <div className="text-xs text-muted-foreground">{t("hint.fileOrder")}</div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {t("label.pointsJson")}
        </Label>
        <Input
          ref={newPointsInputRef}
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleNewPointsImport(file);
            }
          }}
        />
        <div className="text-xs text-muted-foreground">
          {t("hint.pointsOptional")}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onClearFrames}
        disabled={framesLength === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("action.clearFrames")}
      </Button>
    </div>
  );
}
