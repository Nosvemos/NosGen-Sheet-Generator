import { MainStage } from "@/components/editor/MainStage";
import { useEditorContext } from "@/context/use-editor-context";

export function MainStageContainer() {
  const { mainStage } = useEditorContext();
  return <MainStage {...mainStage} />;
}
