import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import type { TranslationKey } from "@/lib/i18n";
import type { FrameData } from "@/lib/editor-types";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type AnimationBuilderCardProps = {
  t: Translate;
  frames: FrameData[];
  animationName: string;
  setAnimationName: Dispatch<SetStateAction<string>>;
  animationFrameSelection: Record<string, boolean>;
  setAnimationFrameSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
};

export function AnimationBuilderCard({
  t,
  frames,
  animationName,
  setAnimationName,
  animationFrameSelection,
  setAnimationFrameSelection,
}: AnimationBuilderCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <Label>{t("label.animationBuilder")}</Label>
      <div className="space-y-1">
        <Label htmlFor="animation-name">{t("label.animationName")}</Label>
        <Input
          id="animation-name"
          value={animationName}
          onChange={(event) => setAnimationName(event.target.value)}
          placeholder={t("placeholder.animationName")}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>{t("label.animationFrames")}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setAnimationFrameSelection((prev) => {
                const next = { ...prev };
                frames.forEach((frame) => {
                  next[frame.id] = true;
                });
                return next;
              })
            }
          >
            {t("action.selectAll")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setAnimationFrameSelection((prev) => {
                const next = { ...prev };
                frames.forEach((frame) => {
                  next[frame.id] = false;
                });
                return next;
              })
            }
          >
            {t("action.clearAll")}
          </Button>
        </div>
      </div>
      <ScrollArea className="h-40 rounded-xl border border-border/50 bg-background/80">
        <div className="space-y-2 p-3">
          {frames.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t("hint.noFrames")}</div>
          ) : (
            frames.map((frame, index) => (
              <div
                key={frame.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{frame.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("label.frame")} {index + 1}
                  </div>
                </div>
                <Switch
                  checked={Boolean(animationFrameSelection[frame.id])}
                  onCheckedChange={(checked) =>
                    setAnimationFrameSelection((prev) => ({
                      ...prev,
                      [frame.id]: checked,
                    }))
                  }
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">{t("hint.animationExport")}</p>
      <p className="text-xs text-muted-foreground">
        {t("hint.animationFpsFromPlayback")}
      </p>
    </div>
  );
}
