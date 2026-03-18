import { RightSidebar } from "@/components/editor/RightSidebar";
import { useEditorContext } from "@/context/use-editor-context";

export function RightSidebarContainer() {
  const { rightSidebar } = useEditorContext();
  return <RightSidebar {...rightSidebar} />;
}
