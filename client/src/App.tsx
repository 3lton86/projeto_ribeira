import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import RiberaLayout from "./components/RiberaLayout";
import Dashboard from "./pages/Dashboard";
import Actions from "./pages/Actions";
import Governance from "./pages/Governance";
import ActionDetail from "./pages/ActionDetail";

function Router() {
  return (
    <RiberaLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/acoes" component={Actions} />
        <Route path="/acoes/:id" component={ActionDetail} />
        <Route path="/governanca" component={Governance} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </RiberaLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
