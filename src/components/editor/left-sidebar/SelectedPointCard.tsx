import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AutoFillShape,
  FrameData,
  FramePoint,
  KeyframePoint,
  PivotMode,
} from "@/lib/editor-types";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type SelectedPointCardProps = {
  t: Translate;
  selectedPoint: FramePoint;
  updateAllFramesPoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  selectedPivotX: number;
  selectedPivotY: number;
  currentFrame?: FrameData;
  updateCurrentFramePoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  fromPivotCoords: (
    point: { x: number; y: number },
    frame: FrameData,
    pivotMode: PivotMode
  ) => { x: number; y: number };
  clamp: (value: number, min: number, max: number) => number;
  toNumber: (value: string, fallback: number) => number;
  pivotMode: PivotMode;
  isKeyframesOpen: boolean;
  setIsKeyframesOpen: Dispatch<SetStateAction<boolean>>;
  keyframeCount: number;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  selectedPointKeyframes: KeyframePoint[];
  autoFillShape: AutoFillShape;
  setAutoFillShape: Dispatch<SetStateAction<AutoFillShape>>;
  handleAutoFill: () => void;
  canAutoFill: boolean;
};

export function SelectedPointCard({
  t,
  selectedPoint,
  updateAllFramesPoints,
  setSelectedPointId,
  selectedPivotX,
  selectedPivotY,
  currentFrame,
  updateCurrentFramePoints,
  fromPivotCoords,
  clamp,
  toNumber,
  pivotMode,
  isKeyframesOpen,
  setIsKeyframesOpen,
  keyframeCount,
  setFrames,
  selectedPointKeyframes,
  autoFillShape,
  setAutoFillShape,
  handleAutoFill,
  canAutoFill,
}: SelectedPointCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label>{t("label.selectedPoint")}</Label>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            updateAllFramesPoints((points) =>
              points.filter((point) => point.id !== selectedPoint.id)
            );
            setSelectedPointId(null);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="point-name">{t("label.name")}</Label>
        <Input
          id="point-name"
          value={selectedPoint.name}
          onChange={(event) => {
            const name = event.target.value;
            updateAllFramesPoints((points) =>
              points.map((point) =>
                point.id === selectedPoint.id ? { ...point, name } : point
              )
            );
          }}
          placeholder={t("placeholder.pointName")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="point-x">{t("label.x")}</Label>
          <Input
            id="point-x"
            type="number"
            value={String(selectedPivotX)}
            onChange={(event) => {
              if (!currentFrame) {
                return;
              }
              const nextX = toNumber(event.target.value, selectedPivotX);
              const nextPivot = { x: nextX, y: selectedPivotY };
              const nextFramePoint = fromPivotCoords(
                nextPivot,
                currentFrame,
                pivotMode
              );
              updateCurrentFramePoints((points) =>
                points.map((point) =>
                  point.id === selectedPoint.id
                    ? {
                        ...point,
                        x: clamp(
                          Math.round(nextFramePoint.x),
                          0,
                          currentFrame.width
                        ),
                        y: clamp(
                          Math.round(nextFramePoint.y),
                          0,
                          currentFrame.height
                        ),
                        isKeyframe: true,
                      }
                    : point
                )
              );
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="point-y">{t("label.y")}</Label>
          <Input
            id="point-y"
            type="number"
            value={String(selectedPivotY)}
            onChange={(event) => {
              if (!currentFrame) {
                return;
              }
              const nextY = toNumber(event.target.value, selectedPivotY);
              const nextPivot = { x: selectedPivotX, y: nextY };
              const nextFramePoint = fromPivotCoords(
                nextPivot,
                currentFrame,
                pivotMode
              );
              updateCurrentFramePoints((points) =>
                points.map((point) =>
                  point.id === selectedPoint.id
                    ? {
                        ...point,
                        x: clamp(
                          Math.round(nextFramePoint.x),
                          0,
                          currentFrame.width
                        ),
                        y: clamp(
                          Math.round(nextFramePoint.y),
                          0,
                          currentFrame.height
                        ),
                        isKeyframe: true,
                      }
                    : point
                )
              );
            }}
          />
        </div>
      </div>
      <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsKeyframesOpen((prev) => !prev)}
              aria-label={t("action.toggleKeyframes")}
            >
              {isKeyframesOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <span>{t("label.keyframes")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {keyframeCount}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setFrames((prev) =>
                  prev.map((frame) => ({
                    ...frame,
                    points: frame.points.map((point) =>
                      point.id === selectedPoint.id
                        ? { ...point, isKeyframe: false }
                        : point
                    ),
                  }))
                );
              }}
              disabled={keyframeCount === 0}
              aria-label={t("action.clearKeyframes")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isKeyframesOpen && (
          <div className="space-y-2">
            <ScrollArea className="h-24 rounded-lg border border-border/60 bg-background/60 p-2">
              <div className="space-y-1">
                {selectedPointKeyframes.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">
                    {t("hint.noKeyframes")}
                  </div>
                ) : (
                  selectedPointKeyframes.map((keyframe) => (
                    <div
                      key={`${selectedPoint.id}-${keyframe.frameIndex}`}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-muted/40 px-2 py-1 text-[11px]"
                    >
                      <span>
                        {t("label.frame")} {keyframe.frameIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setFrames((prev) =>
                            prev.map((frame, index) =>
                              index === keyframe.frameIndex
                                ? {
                                    ...frame,
                                    points: frame.points.map((point) =>
                                      point.id === selectedPoint.id
                                        ? { ...point, isKeyframe: false }
                                        : point
                                    ),
                                  }
                                : frame
                            )
                          );
                        }}
                        aria-label={t("action.removeKeyframe")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("label.autoFillShape")}
              </Label>
              <Select
                value={autoFillShape}
                onValueChange={(value) => setAutoFillShape(value as AutoFillShape)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t("label.autoFillShape")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ellipse">{t("shape.ellipse")}</SelectItem>
                  <SelectItem value="circle">{t("shape.circle")}</SelectItem>
                  <SelectItem value="square">{t("shape.square")}</SelectItem>
                  <SelectItem value="tangent">{t("shape.tangent")}</SelectItem>
                  <SelectItem value="linear">{t("shape.linear")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {t("hint.autoFillSettings")}
              </p>
            </div>
          </div>
        )}
        <Button size="sm" className="w-full" onClick={handleAutoFill} disabled={!canAutoFill}>
          {t("action.autoFill")}
        </Button>
        <p className="text-[11px] text-muted-foreground">{t("hint.autoFill")}</p>
      </div>
    </div>
  );
}
