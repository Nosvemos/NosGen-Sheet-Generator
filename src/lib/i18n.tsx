import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en";

type TranslationValue =
  | string
  | ((params: Record<string, string | number>) => string);

const translations = {
  en: {
    "app.kicker": "Sprite Atlas Studio",
    "app.title": "NosGen v0.1.1",
    "app.subtitle": "Build sprite sheets, place points, and export fast.",
    "panel.tools": "Point Studio",
    "panel.pipeline": "Atlas Pipeline",
    "panel.scene": "Scene",
    "panel.importExport": "Import / Export",
    "label.tools": "Tools",
    "label.appMode": "App Mode",
    "label.projectSettings": "Project Settings",
    "label.settings": "Settings",
    "label.projectName": "Project Name",
    "label.mode": "Mode",
    "label.pivotSpace": "Pivot Space",
    "label.points": "Points",
    "label.selectedPoint": "Selected Point",
    "label.animationBuilder": "Animation Builder",
    "label.animationName": "Animation Name",
    "label.animationFps": "Animation FPS",
    "label.animationFrames": "Animation Frames",
    "label.name": "Name",
    "label.x": "X",
    "label.y": "Y",
    "label.grid": "Grid",
    "label.pointsToggle": "Points",
    "label.keyframes": "Keyframes",
    "label.historyLimit": "History Limit",
    "label.hotkeys": "Hotkeys",
    "label.historySnapshots": "History Snapshots",
    "label.generalSettings": "General Settings",
    "label.spriteSettings": "Sprite Settings",
    "label.autoFillShape": "Auto Fill Shape",
    "label.autoFillDirection": "Auto Fill Direction",
    "label.spriteDirection": "Sprite Direction",
    "label.reverse": "Reverse",
    "label.loop": "Loop",
    "label.fps": "FPS",
    "label.speed": "Speed",
    "label.rows": "Rows",
    "label.padding": "Padding",
    "label.atlasSettings": "Atlas Settings",
    "label.export": "Export",
    "label.theme": "Theme",
    "label.frames": "Frames",
    "label.normalFrames": "Frame Names",
    "label.pngFrames": "PNG Frames",
    "label.importJson": "Import Points JSON",
    "label.atlasImport": "Atlas Import",
    "label.newAtlas": "New Atlas",
    "label.pointsJson": "Points JSON",
    "label.editCurrent": "Edit Current",
    "label.atlasPng": "Sprite Sheet PNG",
    "label.atlasJson": "Atlas JSON",
    "label.frame": "Frame",
    "label.exportQuality": "Export Quality",
    "label.exportScale": "Export Scale",
    "label.exportMetaSize": "Metadata Size",
    "label.smoothing": "Smoothing",
    "label.pointGroups": "Point Groups",
    "label.groupEditor": "Group Editor",
    "label.groupName": "Group Name",
    "label.groupIndices": "Group Indices",
    "label.groupEntries": (params) => `Entries ${params.count ?? ""}`,
    "label.index": "Index",
    "label.groupPlayback": "Group Playback",
    "label.previewOnCanvas": "Preview on canvas",
    "point.defaultName": (params) => `point-${params.index ?? ""}`,
    "group.defaultName": (params) => `group-${params.index ?? ""}`,
    "placeholder.groupName": "group-name",
    "placeholder.projectName": "project-name",
    "placeholder.animationName": "animation-name",
    "placeholder.addPoint": "Add point",
    "placeholder.hotkey": "Press keys",
    "action.select": "Select",
    "action.addPoint": "Add Point",
    "action.centerPoint": "Center Point",
    "action.selectAll": "Select all",
    "action.clearAll": "Clear",
    "action.clearFrames": "Clear Frames",
    "action.exportPng": "Export Atlas PNG",
    "action.exportJson": "Export Points JSON",
    "action.exportFramesZip": "Export Frames ZIP",
    "action.autoFill": "Auto Fill",
    "action.toggleKeyframes": "Toggle keyframes panel",
    "action.clearKeyframes": "Clear keyframes",
    "action.removeKeyframe": "Remove keyframe",
    "action.addKeyframe": "Add keyframe on this frame",
    "action.removeKeyframeHere": "Remove keyframe on this frame",
    "action.moveFrameLeft": "Move frame left",
    "action.moveFrameRight": "Move frame right",
    "action.deleteFrame": "Delete current frame",
    "action.togglePoints": "Toggle points list",
    "action.togglePointGroups": "Toggle point groups",
    "action.toggleProjectSettings": "Toggle project settings",
    "action.toggleSettings": "Toggle settings",
    "action.addIndex": "Add index",
    "action.addPointToIndex": "Add",
    "action.playGroup": "Play group",
    "action.stopGroup": "Stop group",
    "action.toggleSpriteSettings": "Toggle sprite settings",
    "action.toggleAtlasSettings": "Toggle atlas settings",
    "action.toggleExportQuality": "Toggle export quality",
    "action.first": "First frame",
    "action.previous": "Previous",
    "action.next": "Next",
    "action.last": "Last frame",
    "action.undo": "Undo",
    "action.redo": "Redo",
    "action.resetHotkeys": "Reset hotkeys",
    "action.clearHotkey": "Clear hotkey",
    "action.close": "Close",
    "action.clearHistory": "Clear history",
    "mode.select": "Select",
    "mode.add": "Add",
    "mode.character": "Character",
    "mode.animation": "Animation",
    "mode.normal": "Normal",
    "action.play": "Play",
    "action.pause": "Pause",
    "action.delete": "Delete",
    "status.noFrame": "No frame",
    "status.rows": (params) => `Rows ${params.rows ?? ""}`,
    "status.columns": (params) => `Cols ${params.columns ?? ""}`,
    "status.atlasSize": (params) =>
      `Atlas ${params.w ?? ""}x${params.h ?? ""}`,
    "status.frameSize": (params) => `${params.w ?? ""}x${params.h ?? ""}`,
    "status.cellSize": (params) =>
      `Cell ${params.w ?? ""}x${params.h ?? ""}`,
    "status.frameCounter": (params) =>
      `Frame ${params.current ?? ""} / ${params.total ?? ""}`,
    "status.addMode": "Add mode active",
    "status.sizeMismatch": "Size mismatch",
    "status.historyCounts": (params) =>
      `Undo ${params.undo ?? 0} / Redo ${params.redo ?? 0}`,
    "placeholder.pivotMode": "Pivot mode",
    "placeholder.pointName": "point-name",
    "hint.pivotExport": "Exports use this origin.",
    "hint.noPoints": "Click on the frame to add points.",
    "hint.noFramesTitle": "Import PNG frames",
    "hint.noFramesBody": "Use the right panel to pick multiple PNGs.",
    "hint.noFrames": "Import frames to build an animation.",
    "hint.normalFrames": "Rename frames for UI panels or custom exports.",
    "hint.fileOrder": "Order follows file selection.",
    "hint.jsonMatch": "Points are updated when frame names match.",
    "hint.pointsOptional": "Optional: import points for the new atlas.",
    "hint.editCurrent": "Auto-imports when both files are selected.",
    "hint.importing": "Importing atlas...",
    "hint.autoFill": "Uses keyframes to estimate missing positions.",
    "hint.autoFillSettings": "Shape and sprite direction apply to auto fill.",
    "hint.spriteSettings": "Sprite direction affects auto fill and export.",
    "hint.appMode": "Switch between character points, animation export, or normal.",
    "hint.animationExport": "Export uses the selected frames and FPS.",
    "hint.animationFpsFromPlayback": "Animation FPS uses the playback controls below.",
    "hint.noKeyframes": "No keyframes yet.",
    "hint.exportQuality": "Scale increases resolution; smoothing softens pixels.",
    "hint.exportMetaSize": "Exports a numeric size value in metadata.",
    "hint.historyLimit": "Limits how many undo steps are stored.",
    "hint.historySnapshots": "Latest changes (newest first).",
    "hint.noHistory": "No history yet.",
    "hint.hotkeysCapture": "Click a field and press a key combo.",
    "hint.hotkeysDefaults": (params) =>
      `Defaults: Undo ${params.undo ?? ""}, Redo ${params.redo ?? ""}.`,
    "hint.noGroups": "Create a group to organize points.",
    "hint.noGroupPoints": "Load points to assign them to this index.",
    "hint.noPointsInIndex": "No points added to this index.",
    "warn.missingFramesTitle": "Missing frames",
    "warn.missingFramesBody": "No frames are loaded. Import PNG frames first.",
    "warn.sizeMismatchTitle": "Frame size mismatch",
    "warn.sizeMismatchBody": "Frames have different dimensions.",
    "warn.unassignedPointsTitle": "Unassigned points",
    "warn.unassignedPointsBody": (params) =>
      `${params.count ?? 0} points have no keyframes.`,
    "shape.ellipse": "Ellipse",
    "shape.circle": "Circle",
    "shape.square": "Square",
    "shape.tangent": "Tangent",
    "shape.linear": "Linear",
    "direction.clockwise": "Clockwise",
    "direction.counterclockwise": "Counterclockwise",
    "tab.frame": "Frame",
    "tab.atlas": "Atlas",
    "hotkey.undo": "Undo",
    "hotkey.redo": "Redo",
    "hotkey.playPause": "Play / Pause",
    "hotkey.prevFrame": "Previous frame",
    "hotkey.nextFrame": "Next frame",
    "hotkey.firstFrame": "First frame",
    "hotkey.lastFrame": "Last frame",
    "hotkey.toggleGrid": "Toggle grid",
    "hotkey.togglePoints": "Toggle points",
    "hotkey.selectMode": "Select tool",
    "hotkey.addMode": "Add tool",
    "hotkey.addPoint": "Add point at center",
    "hotkey.deletePoint": "Delete selected point",
    "hotkey.selectPrevPoint": "Select previous point",
    "hotkey.selectNextPoint": "Select next point",
    "pivot.topLeft": "Top-left",
    "pivot.bottomLeft": "Bottom-left",
    "pivot.center": "Center",
    "view.mode": (params) => String(params.mode ?? ""),
    "theme.light": "Light",
    "theme.dark": "Dark",
  },
} as const satisfies Record<Locale, Record<string, TranslationValue>>;

type TranslationKey = keyof typeof translations.en;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const translate = (
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
) => {
  const entry = translations[locale][key];
  if (typeof entry === "function") {
    return entry(params ?? {});
  }
  if (!params) {
    return entry;
  }
  return entry.replace(/\{(\w+)\}/g, (_, token) =>
    String(params[token] ?? `{${token}}`)
  );
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useMemo(
    () => (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export type { TranslationKey };
