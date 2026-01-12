import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorApp } from "@/components/editor/EditorApp";

function App() {
  return (
    <TooltipProvider>
      <EditorApp />
    </TooltipProvider>
  );
}

export default App;
