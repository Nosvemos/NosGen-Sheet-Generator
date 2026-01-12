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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AppMode,
  AutoFillShape,
  EditorMode,
  FrameData,
  FramePoint,
  KeyframePoint,
  PivotMode,
  PointGroup,
} from "@/lib/editor-types";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Crosshair,
  MousePointer2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type LeftSidebarProps = {
  t: Translate;
  frames: FrameData[];
  currentFrameIndex: number;
  isProjectSettingsOpen: boolean;
  setIsProjectSettingsOpen: Dispatch<SetStateAction<boolean>>;
  appMode: AppMode;
  setAppMode: Dispatch<SetStateAction<AppMode>>;
  projectName: string;
  setProjectName: Dispatch<SetStateAction<string>>;
  pivotMode: PivotMode;
  setPivotMode: Dispatch<SetStateAction<PivotMode>>;
  pivotLabels: Record<PivotMode, string>;
  pivotOptions: PivotMode[];
  animationName: string;
  setAnimationName: Dispatch<SetStateAction<string>>;
  animationFrameSelection: Record<string, boolean>;
  setAnimationFrameSelection: Dispatch<
    SetStateAction<Record<string, boolean>>
  >;
  editorMode: EditorMode;
  setEditorMode: Dispatch<SetStateAction<EditorMode>>;
  currentFrame?: FrameData;
  addPointAt: (x: number, y: number) => void;
  currentPoints: FramePoint[];
  selectedPointId: string | null;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  isPointsOpen: boolean;
  setIsPointsOpen: Dispatch<SetStateAction<boolean>>;
  toPivotCoords: (
    point: FramePoint,
    frame: FrameData,
    pivotMode: PivotMode
  ) => { x: number; y: number };
  selectedPoint: FramePoint | null;
  updateAllFramesPoints: (
    updater: (points: FramePoint[]) => FramePoint[]
  ) => void;
  selectedPivotX: number;
  selectedPivotY: number;
  updateCurrentFramePoints: (
    updater: (points: FramePoint[]) => FramePoint[]
  ) => void;
  fromPivotCoords: (
    point: { x: number; y: number },
    frame: FrameData,
    pivotMode: PivotMode
  ) => { x: number; y: number };
  clamp: (value: number, min: number, max: number) => number;
  toNumber: (value: string, fallback: number) => number;
  isKeyframesOpen: boolean;
  setIsKeyframesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  keyframeCount: number;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  selectedPointKeyframes: KeyframePoint[];
  autoFillShape: AutoFillShape;
  setAutoFillShape: Dispatch<SetStateAction<AutoFillShape>>;
  handleAutoFill: () => void;
  canAutoFill: boolean;
  availablePoints: Array<{ id: string; name: string; color: string }>;
  pointGroups: PointGroup[];
  setPointGroups: Dispatch<SetStateAction<PointGroup[]>>;
  selectedGroupId: string | null;
  setSelectedGroupId: Dispatch<SetStateAction<string | null>>;
  newGroupName: string;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  isPointGroupsOpen: boolean;
  setIsPointGroupsOpen: Dispatch<SetStateAction<boolean>>;
  selectedGroup: PointGroup | null;
  groupEntrySelection: Record<string, string>;
  setGroupEntrySelection: Dispatch<
    SetStateAction<Record<string, string>>
  >;
  isGroupPreviewActive: boolean;
  setIsGroupPreviewActive: Dispatch<SetStateAction<boolean>>;
  isGroupPreviewPlaying: boolean;
  setIsGroupPreviewPlaying: Dispatch<SetStateAction<boolean>>;
  groupPreviewIndex: number;
  setGroupPreviewIndex: Dispatch<SetStateAction<number>>;
  canPreviewGroup: boolean;
  createId: () => string;
};

export function LeftSidebar({
  t,
  frames,
  currentFrameIndex,
  isProjectSettingsOpen,
  setIsProjectSettingsOpen,
  appMode,
  setAppMode,
  projectName,
  setProjectName,
  pivotMode,
  setPivotMode,
  pivotLabels,
  pivotOptions,
  animationName,
  setAnimationName,
  animationFrameSelection,
  setAnimationFrameSelection,
  editorMode,
  setEditorMode,
  currentFrame,
  addPointAt,
  currentPoints,
  selectedPointId,
  setSelectedPointId,
  isPointsOpen,
  setIsPointsOpen,
  toPivotCoords,
  selectedPoint,
  updateAllFramesPoints,
  selectedPivotX,
  selectedPivotY,
  updateCurrentFramePoints,
  fromPivotCoords,
  clamp,
  toNumber,
  isKeyframesOpen,
  setIsKeyframesOpen,
  keyframeCount,
  setFrames,
  selectedPointKeyframes,
  autoFillShape,
  setAutoFillShape,
  handleAutoFill,
  canAutoFill,
  availablePoints,
  pointGroups,
  setPointGroups,
  selectedGroupId,
  setSelectedGroupId,
  newGroupName,
  setNewGroupName,
  isPointGroupsOpen,
  setIsPointGroupsOpen,
  selectedGroup,
  groupEntrySelection,
  setGroupEntrySelection,
  isGroupPreviewActive,
  setIsGroupPreviewActive,
  isGroupPreviewPlaying,
  setIsGroupPreviewPlaying,
  groupPreviewIndex,
  setGroupPreviewIndex,
  canPreviewGroup,
  createId,
}: LeftSidebarProps) {
  const isCharacterMode = appMode === "character";

  return (
    <aside className="h-full min-h-0 space-y-4 overflow-y-auto rounded-none border-0 bg-card/80 p-4 shadow-none backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("label.tools")}
          </p>
          <h2 className="text-lg font-semibold">{t("panel.tools")}</h2>
        </div>
        <Badge variant="secondary">
          {frames.length ? `${currentFrameIndex + 1}/${frames.length}` : "0"}
        </Badge>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
        <div className="flex items-center justify-between">
          <Label>{t("label.projectSettings")}</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsProjectSettingsOpen((prev) => !prev)}
            aria-label={t("action.toggleProjectSettings")}
          >
            {isProjectSettingsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isProjectSettingsOpen && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("label.appMode")}
              </Label>
              <Select
                value={appMode}
                onValueChange={(value) => setAppMode(value as AppMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("label.appMode")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">{t("mode.character")}</SelectItem>
                  <SelectItem value="animation">{t("mode.animation")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("hint.appMode")}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="project-name">{t("label.projectName")}</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={t("placeholder.projectName")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("label.pivotSpace")}
              </Label>
              <Select
                value={pivotMode}
                onValueChange={(value) => setPivotMode(value as PivotMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholder.pivotMode")} />
                </SelectTrigger>
                <SelectContent>
                  {pivotOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {pivotLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("hint.pivotExport")}
              </p>
            </div>
          </>
        )}
      </div>

      {appMode === "animation" && (
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
                <div className="text-xs text-muted-foreground">
                  {t("hint.noFrames")}
                </div>
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
          <p className="text-xs text-muted-foreground">
            {t("hint.animationExport")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("hint.animationFpsFromPlayback")}
          </p>
        </div>
      )}

      {isCharacterMode && (
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
      )}

      {isCharacterMode && (
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
      )}

      {isCharacterMode && selectedPoint && (
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
                    if (!selectedPoint) {
                      return;
                    }
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
                          key={`${selectedPoint?.id}-${keyframe.frameIndex}`}
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
                              if (!selectedPoint) {
                                return;
                              }
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
                    onValueChange={(value) =>
                      setAutoFillShape(value as AutoFillShape)
                    }
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
            <Button
              size="sm"
              className="w-full"
              onClick={handleAutoFill}
              disabled={!canAutoFill}
            >
              {t("action.autoFill")}
            </Button>
            <p className="text-[11px] text-muted-foreground">{t("hint.autoFill")}</p>
          </div>
        </div>
      )}

      {isCharacterMode && (
        <div className="space-y-2 rounded-2xl border border-border/50 bg-background/70 p-3">
          <div className="flex items-center justify-between">
            <Label>{t("label.pointGroups")}</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pointGroups.length}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsPointGroupsOpen((prev) => !prev)}
                aria-label={t("action.togglePointGroups")}
              >
                {isPointGroupsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {isPointGroupsOpen && (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder={t("placeholder.groupName")}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    const trimmed = newGroupName.trim();
                    const name =
                      trimmed || t("group.defaultName", { index: pointGroups.length + 1 });
                    const id = createId();
                    setPointGroups((prev) => [
                      ...prev,
                      { id, name, entries: [[]] },
                    ]);
                    setSelectedGroupId(id);
                    setNewGroupName("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-28 rounded-xl border border-border/50 bg-background/80">
                <div className="space-y-2 p-3">
                  {pointGroups.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                      {t("hint.noGroups")}
                    </div>
                  ) : (
                    pointGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                          group.id === selectedGroupId
                            ? "border-accent/40 bg-accent/10"
                            : "border-border/60 bg-muted/30 hover:bg-muted/60"
                        )}
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <div>
                          <div className="text-sm font-medium">{group.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {t("label.groupEntries", {
                              count: group.entries.length,
                            })}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      )}

      {isCharacterMode && selectedGroup && (
        <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
          <div className="flex items-center justify-between">
            <Label>{t("label.groupEditor")}</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setPointGroups((prev) =>
                  prev.filter((group) => group.id !== selectedGroup.id)
                );
                setSelectedGroupId(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label htmlFor="group-name">{t("label.groupName")}</Label>
            <Input
              id="group-name"
              value={selectedGroup.name}
              onChange={(event) => {
                const name = event.target.value;
                setPointGroups((prev) =>
                  prev.map((group) =>
                    group.id === selectedGroup.id ? { ...group, name } : group
                  )
                );
              }}
              placeholder={t("placeholder.groupName")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t("label.groupIndices")}</Label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setPointGroups((prev) =>
                  prev.map((group) =>
                    group.id === selectedGroup.id
                      ? { ...group, entries: [...group.entries, []] }
                      : group
                  )
                );
              }}
            >
              {t("action.addIndex")}
            </Button>
          </div>
          <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("label.groupPlayback")}</span>
              <span className="font-mono">
                {selectedGroup.entries.length > 0
                  ? `${groupPreviewIndex + 1}/${selectedGroup.entries.length}`
                  : "0/0"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Switch
                id="group-preview"
                checked={isGroupPreviewActive}
                onCheckedChange={(checked) => {
                  setIsGroupPreviewActive(checked);
                  if (!checked) {
                    setIsGroupPreviewPlaying(false);
                  }
                }}
              />
              <Label htmlFor="group-preview">{t("label.previewOnCanvas")}</Label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canPreviewGroup}
                onClick={() => {
                  if (!canPreviewGroup) {
                    return;
                  }
                  setIsGroupPreviewActive(true);
                  setIsGroupPreviewPlaying((prev) => !prev);
                }}
              >
                {isGroupPreviewPlaying ? t("action.stopGroup") : t("action.playGroup")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canPreviewGroup}
                onClick={() => {
                  if (!canPreviewGroup) {
                    return;
                  }
                  setIsGroupPreviewActive(true);
                  setGroupPreviewIndex((prev) =>
                    prev === 0 ? selectedGroup.entries.length - 1 : prev - 1
                  );
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canPreviewGroup}
                onClick={() => {
                  if (!canPreviewGroup) {
                    return;
                  }
                  setIsGroupPreviewActive(true);
                  setGroupPreviewIndex((prev) =>
                    (prev + 1) % selectedGroup.entries.length
                  );
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <Slider
              min={0}
              max={Math.max(0, selectedGroup.entries.length - 1)}
              step={1}
              value={[groupPreviewIndex]}
              onValueChange={(value) => {
                const next = value[0] ?? 0;
                setGroupPreviewIndex(next);
                setIsGroupPreviewActive(true);
              }}
              disabled={!canPreviewGroup}
            />
          </div>
          <ScrollArea className="h-40 rounded-xl border border-border/50 bg-background/60 p-2">
            <div className="space-y-3">
              {selectedGroup.entries.map((entry, entryIndex) => (
                <div
                  key={`${selectedGroup.id}-${entryIndex}`}
                  className="rounded-xl border border-border/60 bg-muted/40 p-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("label.index")} {entryIndex}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setPointGroups((prev) =>
                          prev.map((group) =>
                            group.id === selectedGroup.id
                              ? {
                                  ...group,
                                  entries: group.entries.filter(
                                    (_, idx) => idx !== entryIndex
                                  ),
                                }
                              : group
                          )
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {availablePoints.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {t("hint.noGroupPoints")}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select
                          value={
                            groupEntrySelection[
                              `${selectedGroup.id}-${entryIndex}`
                            ] ?? ""
                          }
                          onValueChange={(value) => {
                            const key = `${selectedGroup.id}-${entryIndex}`;
                            setGroupEntrySelection((prev) => ({
                              ...prev,
                              [key]: value,
                            }));
                          }}
                        >
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue placeholder={t("placeholder.addPoint")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePoints
                              .filter((point) => !entry.includes(point.id))
                              .map((point) => (
                                <SelectItem key={point.id} value={point.id}>
                                  {point.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            !(
                              groupEntrySelection[
                                `${selectedGroup.id}-${entryIndex}`
                              ] ?? ""
                            )
                          }
                          onClick={() => {
                            const key = `${selectedGroup.id}-${entryIndex}`;
                            const selectedId = groupEntrySelection[key];
                            if (!selectedId) {
                              return;
                            }
                            setPointGroups((prev) =>
                              prev.map((group) => {
                                if (group.id !== selectedGroup.id) {
                                  return group;
                                }
                                const nextEntries = group.entries.map(
                                  (entryPoints, idx) =>
                                    idx === entryIndex
                                      ? entryPoints.includes(selectedId)
                                        ? entryPoints
                                        : [...entryPoints, selectedId]
                                      : entryPoints
                                );
                                return { ...group, entries: nextEntries };
                              })
                            );
                            setGroupEntrySelection((prev) => ({
                              ...prev,
                              [key]: "",
                            }));
                          }}
                        >
                          {t("action.addPointToIndex")}
                        </Button>
                      </div>
                    )}
                    {entry.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {t("hint.noPointsInIndex")}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {entry.map((pointId) => {
                          const point = availablePoints.find(
                            (item) => item.id === pointId
                          );
                          return (
                            <div
                              key={pointId}
                              className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-2 py-1 text-[11px]"
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: point?.color || "#999",
                                }}
                              />
                              <span>{point?.name ?? pointId}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => {
                                  setPointGroups((prev) =>
                                    prev.map((group) => {
                                      if (group.id !== selectedGroup.id) {
                                        return group;
                                      }
                                      const nextEntries = group.entries.map(
                                        (entryPoints, idx) =>
                                          idx === entryIndex
                                            ? entryPoints.filter(
                                                (id) => id !== pointId
                                              )
                                            : entryPoints
                                      );
                                      return { ...group, entries: nextEntries };
                                    })
                                  );
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </aside>
  );
}
