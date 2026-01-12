import { createContext, useContext } from "react";
import type { LeftSidebarProps } from "@/components/editor/LeftSidebar";
import type { MainStageProps } from "@/components/editor/MainStage";
import type { RightSidebarProps } from "@/components/editor/RightSidebar";

type EditorContextValue = {
  leftSidebar: LeftSidebarProps;
  mainStage: MainStageProps;
  rightSidebar: RightSidebarProps;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = EditorContext.Provider;

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within EditorProvider");
  }
  return context;
};
