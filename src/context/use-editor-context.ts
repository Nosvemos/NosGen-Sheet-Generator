import { useContext } from "react";
import { EditorContext } from "@/context/editor-context-store";

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within EditorProvider");
  }
  return context;
};
