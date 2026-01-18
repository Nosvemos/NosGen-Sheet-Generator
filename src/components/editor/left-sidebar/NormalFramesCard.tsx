import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranslationKey } from "@/lib/i18n";
import type { FrameData } from "@/lib/editor-types";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type NormalFramesCardProps = {
  t: Translate;
  frames: FrameData[];
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
};

export function NormalFramesCard({
  t,
  frames,
  setFrames,
}: NormalFramesCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <Label>{t("label.normalFrames")}</Label>
      <ScrollArea className="h-48 rounded-xl border border-border/50 bg-background/80">
        <div className="space-y-2 p-3">
          {frames.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t("hint.noFrames")}</div>
          ) : (
            frames.map((frame, index) => (
              <div
                key={frame.id}
                className="space-y-1 rounded-xl border border-border/60 bg-muted/40 px-3 py-2"
              >
                <div className="text-[11px] text-muted-foreground">
                  {t("label.frame")} {index + 1}
                </div>
                <Input
                  value={frame.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setFrames((prev) =>
                      prev.map((item) =>
                        item.id === frame.id ? { ...item, name } : item
                      )
                    );
                  }}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">{t("hint.normalFrames")}</p>
    </div>
  );
}
