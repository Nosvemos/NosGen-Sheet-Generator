import { createContext } from "react";
import type { LeftSidebarProps } from "@/components/editor/LeftSidebar";
import type { MainStageProps } from "@/components/editor/MainStage";
import type { RightSidebarProps } from "@/components/editor/RightSidebar";

export type EditorContextValue = {
  leftSidebar: LeftSidebarProps;
  mainStage: MainStageProps;
  rightSidebar: RightSidebarProps;
};

export const EditorContext = createContext<EditorContextValue | null>(null);
