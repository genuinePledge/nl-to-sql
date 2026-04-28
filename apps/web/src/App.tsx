import { Thread } from "./components/assistant-ui/thread";
import { TooltipProvider } from "./components/ui/tooltip";
import { RuntimeProvider } from "./providers/RuntimeProvider";

function App() {
  return (
    <RuntimeProvider>
      <TooltipProvider>
        <div className="h-full">
          <Thread />
        </div>
      </TooltipProvider>
    </RuntimeProvider>
  );
}

export default App;
