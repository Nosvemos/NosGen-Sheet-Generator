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
    "app.title": "SheetGenerator",
    "app.subtitle": "Build sprite sheets, place points, and export fast.",
    "panel.tools": "Point Studio",
    "panel.pipeline": "Atlas Pipeline",
    "panel.scene": "Scene",
    "panel.importExport": "Import / Export",
    "label.tools": "Tools",
    "label.mode": "Mode",
    "label.pivotSpace": "Pivot Space",
    "label.points": "Points",
    "label.selectedPoint": "Selected Point",
    "label.name": "Name",
    "label.x": "X",
    "label.y": "Y",
    "label.grid": "Grid",
    "label.pointsToggle": "Points",
    "label.keyframes": "Keyframes",
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
    "label.pngFrames": "PNG Frames",
    "label.importJson": "Import Points JSON",
    "point.defaultName": (params) => `point-${params.index ?? ""}`,
    "action.select": "Select",
    "action.addPoint": "Add Point",
    "action.centerPoint": "Center Point",
    "action.clearFrames": "Clear Frames",
    "action.exportPng": "Export Atlas PNG",
    "action.exportJson": "Export Points JSON",
    "action.autoFill": "Auto Fill",
    "action.first": "First frame",
    "action.previous": "Previous",
    "action.next": "Next",
    "action.last": "Last frame",
    "mode.select": "Select",
    "mode.add": "Add",
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
    "placeholder.pivotMode": "Pivot mode",
    "placeholder.pointName": "point-name",
    "hint.pivotExport": "Exports use this origin.",
    "hint.noPoints": "Click on the frame to add points.",
    "hint.noFramesTitle": "Import PNG frames",
    "hint.noFramesBody": "Use the right panel to pick multiple PNGs.",
    "hint.fileOrder": "Order follows file selection.",
    "hint.jsonMatch": "Points are updated when frame names match.",
    "hint.autoFill": "Uses keyframes to estimate missing positions.",
    "hint.autoFillSettings": "Shape and sprite direction apply to auto fill.",
    "hint.spriteSettings": "Sprite direction affects auto fill and export.",
    "shape.ellipse": "Ellipse",
    "shape.circle": "Circle",
    "shape.square": "Square",
    "shape.tangent": "Tangent",
    "shape.linear": "Linear",
    "direction.clockwise": "Clockwise",
    "direction.counterclockwise": "Counterclockwise",
    "tab.frame": "Frame",
    "tab.atlas": "Atlas",
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
