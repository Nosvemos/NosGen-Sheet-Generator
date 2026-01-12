import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type { FrameData, FramePoint, PivotMode } from "@/lib/editor-types";
import { ChevronDown, ChevronRight } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type PointsCardProps = {
  t: Translate;
  currentPoints: FramePoint[];
  currentFrame?: FrameData;
  pivotMode: PivotMode;
  pivotLabels: Record<PivotMode, string>;
  selectedPointId: string | null;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  isPointsOpen: boolean;
  setIsPointsOpen: Dispatch<SetStateAction<boolean>>;
  toPivotCoords: (
    point: FramePoint,
    frame: FrameData,
    pivotMode: PivotMode
  ) => { x: number; y: number };
};

export function PointsCard({
  t,
  currentPoints,
  currentFrame,
  pivotMode,
  pivotLabels,
  selectedPointId,
  setSelectedPointId,
  isPointsOpen,
  setIsPointsOpen,
  toPivotCoords,
}: PointsCardProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label>{t("label.points")}</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentPoints.length}</Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsPointsOpen((prev) => !prev)}
            aria-label={t("action.togglePoints")}
          >
            {isPointsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {isPointsOpen && (
        <ScrollArea className="h-30 rounded-xl border border-border/50 bg-background/80">
          <div className="space-y-2 p-3">
            {currentPoints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                {t("hint.noPoints")}
              </div>
            ) : (
              currentPoints.map((point) => {
                const pivotCoords =
                  currentFrame && toPivotCoords(point, currentFrame, pivotMode);
                const displayX = pivotCoords ? Math.round(pivotCoords.x) : 0;
                const displayY = pivotCoords ? Math.round(pivotCoords.y) : 0;
                return (
                  <button
                    key={point.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                      point.id === selectedPointId
                        ? "border-accent/40 bg-accent/10"
                        : "border-border/60 bg-muted/30 hover:bg-muted/60"
                    )}
                    onClick={() => setSelectedPointId(point.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: point.color || "#999" }}
                      />
                      <div>
                        <div className="text-sm font-medium">{point.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {pivotLabels[pivotMode]}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {displayX},{displayY}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
