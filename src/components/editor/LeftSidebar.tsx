import type { Dispatch, SetStateAction } from "react";
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
import { AnimationBuilderCard } from "@/components/editor/left-sidebar/AnimationBuilderCard";
import { GroupEditorCard } from "@/components/editor/left-sidebar/GroupEditorCard";
import { LeftSidebarHeader } from "@/components/editor/left-sidebar/LeftSidebarHeader";
import { PointGroupsCard } from "@/components/editor/left-sidebar/PointGroupsCard";
import { PointModeCard } from "@/components/editor/left-sidebar/PointModeCard";
import { PointsCard } from "@/components/editor/left-sidebar/PointsCard";
import { ProjectSettingsCard } from "@/components/editor/left-sidebar/ProjectSettingsCard";
import { SettingsModal } from "@/components/editor/left-sidebar/SettingsModal";
import { SelectedPointCard } from "@/components/editor/left-sidebar/SelectedPointCard";
import type { HotkeyMap } from "@/lib/hotkeys";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export type LeftSidebarProps = {
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
  setAnimationFrameSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
  historyLimit: number;
  setHistoryLimit: Dispatch<SetStateAction<number>>;
  hotkeys: HotkeyMap;
  setHotkeys: Dispatch<SetStateAction<HotkeyMap>>;
  onResetHotkeys: () => void;
  historyEntries: string[];
  undoCount: number;
  redoCount: number;
  onClearHistory: () => void;
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
  updateAllFramesPoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  selectedPivotX: number;
  selectedPivotY: number;
  updateCurrentFramePoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  fromPivotCoords: (
    point: { x: number; y: number },
    frame: FrameData,
    pivotMode: PivotMode
  ) => { x: number; y: number };
  clamp: (value: number, min: number, max: number) => number;
  toNumber: (value: string, fallback: number) => number;
  isKeyframesOpen: boolean;
  setIsKeyframesOpen: Dispatch<SetStateAction<boolean>>;
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
  setGroupEntrySelection: Dispatch<SetStateAction<Record<string, string>>>;
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
  isSettingsOpen,
  setIsSettingsOpen,
  historyLimit,
  setHistoryLimit,
  hotkeys,
  setHotkeys,
  onResetHotkeys,
  historyEntries,
  undoCount,
  redoCount,
  onClearHistory,
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
    <>
      <aside className="h-full min-h-0 space-y-4 overflow-y-auto rounded-none border-0 bg-card/80 p-4 shadow-none backdrop-blur">
        <LeftSidebarHeader
          t={t}
          framesLength={frames.length}
          currentFrameIndex={currentFrameIndex}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <ProjectSettingsCard
          t={t}
          isProjectSettingsOpen={isProjectSettingsOpen}
          setIsProjectSettingsOpen={setIsProjectSettingsOpen}
          appMode={appMode}
          setAppMode={setAppMode}
          projectName={projectName}
          setProjectName={setProjectName}
          pivotMode={pivotMode}
          setPivotMode={setPivotMode}
          pivotLabels={pivotLabels}
          pivotOptions={pivotOptions}
        />

        {appMode === "animation" && (
          <AnimationBuilderCard
            t={t}
            frames={frames}
            animationName={animationName}
            setAnimationName={setAnimationName}
            animationFrameSelection={animationFrameSelection}
            setAnimationFrameSelection={setAnimationFrameSelection}
          />
        )}

        {isCharacterMode && (
          <PointModeCard
            t={t}
            editorMode={editorMode}
            setEditorMode={setEditorMode}
            currentFrame={currentFrame}
            addPointAt={addPointAt}
          />
        )}

        {isCharacterMode && (
          <PointsCard
            t={t}
            currentPoints={currentPoints}
            currentFrame={currentFrame}
            pivotMode={pivotMode}
            pivotLabels={pivotLabels}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            isPointsOpen={isPointsOpen}
            setIsPointsOpen={setIsPointsOpen}
            toPivotCoords={toPivotCoords}
          />
        )}

        {isCharacterMode && selectedPoint && (
          <SelectedPointCard
            t={t}
            selectedPoint={selectedPoint}
            updateAllFramesPoints={updateAllFramesPoints}
            setSelectedPointId={setSelectedPointId}
            selectedPivotX={selectedPivotX}
            selectedPivotY={selectedPivotY}
            currentFrame={currentFrame}
            updateCurrentFramePoints={updateCurrentFramePoints}
            fromPivotCoords={fromPivotCoords}
            clamp={clamp}
            toNumber={toNumber}
            pivotMode={pivotMode}
            isKeyframesOpen={isKeyframesOpen}
            setIsKeyframesOpen={setIsKeyframesOpen}
            keyframeCount={keyframeCount}
            setFrames={setFrames}
            selectedPointKeyframes={selectedPointKeyframes}
            autoFillShape={autoFillShape}
            setAutoFillShape={setAutoFillShape}
            handleAutoFill={handleAutoFill}
            canAutoFill={canAutoFill}
          />
        )}

        {isCharacterMode && (
          <PointGroupsCard
            t={t}
            pointGroups={pointGroups}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            isPointGroupsOpen={isPointGroupsOpen}
            setIsPointGroupsOpen={setIsPointGroupsOpen}
            setPointGroups={setPointGroups}
            createId={createId}
          />
        )}

        {isCharacterMode && selectedGroup && (
          <GroupEditorCard
            t={t}
            selectedGroup={selectedGroup}
            setPointGroups={setPointGroups}
            setSelectedGroupId={setSelectedGroupId}
            availablePoints={availablePoints}
            groupEntrySelection={groupEntrySelection}
            setGroupEntrySelection={setGroupEntrySelection}
            isGroupPreviewActive={isGroupPreviewActive}
            setIsGroupPreviewActive={setIsGroupPreviewActive}
            isGroupPreviewPlaying={isGroupPreviewPlaying}
            setIsGroupPreviewPlaying={setIsGroupPreviewPlaying}
            groupPreviewIndex={groupPreviewIndex}
            setGroupPreviewIndex={setGroupPreviewIndex}
            canPreviewGroup={canPreviewGroup}
          />
        )}
      </aside>
      <SettingsModal
        t={t}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        historyLimit={historyLimit}
        setHistoryLimit={setHistoryLimit}
        hotkeys={hotkeys}
        setHotkeys={setHotkeys}
        onResetHotkeys={onResetHotkeys}
        historyEntries={historyEntries}
        undoCount={undoCount}
        redoCount={redoCount}
        onClearHistory={onClearHistory}
        toNumber={toNumber}
      />
    </>
  );
}
