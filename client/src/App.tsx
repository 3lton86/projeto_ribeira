import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import RiberaLayout from "./components/RiberaLayout";
import Dashboard from "./pages/Dashboard";
import Actions from "./pages/Actions";
import ActionDetail from "./pages/ActionDetail";
import Login from "./pages/Login";
import Users from "./pages/Users";
import UserGuide from "./pages/UserGuide";
import AuditLog from "./pages/AuditLog";
import { useLocalAuth } from "./contexts/LocalAuthContext";
import { useEffect } from "react";

function ProtectedRouter() {
  const { localUser, loading } = useLocalAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Only redirect after loading is complete and user is definitely not authenticated
    if (!loading && !localUser) {
      navigate("/login");
    }
  }, [loading, localUser, navigate]);

  // Show spinner while loading (including right after login while cookie is being read)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!localUser) return null;

  return (
    <RiberaLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/acoes" component={Actions} />
        <Route path="/acoes/:id" component={ActionDetail} />
        <Route path="/usuarios" component={Users} />
        <Route path="/guia" component={UserGuide} />
        <Route path="/auditoria" component={AuditLog} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </RiberaLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedRouter} />
    </Switch>
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
