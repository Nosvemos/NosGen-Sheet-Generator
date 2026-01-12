import { RightSidebar } from "@/components/editor/RightSidebar";
import { useEditorContext } from "@/context/editor-context";

export function RightSidebarContainer() {
  const { rightSidebar } = useEditorContext();
  return <RightSidebar {...rightSidebar} />;
}
