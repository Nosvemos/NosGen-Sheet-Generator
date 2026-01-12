import { EditorProvider } from "@/context/editor-context";
import { LeftSidebarContainer } from "@/components/editor/LeftSidebarContainer";
import { MainStageContainer } from "@/components/editor/MainStageContainer";
import { RightSidebarContainer } from "@/components/editor/RightSidebarContainer";
import { useEditorPanels } from "@/hooks/use-editor-panels";

export function EditorApp() {
  const panels = useEditorPanels();

  return (
    <EditorProvider value={panels}>
      <div className="h-screen w-full divide-y divide-border/60 overflow-hidden p-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0 lg:gap-0">
        <LeftSidebarContainer />
        <MainStageContainer />
        <RightSidebarContainer />
      </div>
    </EditorProvider>
  );
}
