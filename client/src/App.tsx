import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "@/pages/LoadingScreen";
import PlantLibrary from "@/pages/PlantLibrary";
import CameraScreen from "@/pages/CameraScreen";
import PlantDetails from "@/pages/PlantDetails";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoadingScreen} />
      <Route path="/library" component={PlantLibrary} />
      <Route path="/camera" component={CameraScreen} />
      <Route path="/plant/:id" component={PlantDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="max-w-sm mx-auto bg-forest-green relative min-h-screen min-h-[100dvh] overflow-hidden">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
