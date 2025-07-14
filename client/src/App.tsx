import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useBarStore } from "@/store/useBarStore";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Layout components
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RoleIndicator } from "@/components/layout/RoleIndicator";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { SessionModal } from "@/components/modals/SessionModal";

// Pages
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Tables from "@/pages/Tables";
import Credits from "@/pages/Credits";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

import { BarSession } from "@shared/schema";

function AuthenticatedApp() {
  const { user } = useAuth();
  const { setCurrentUser, setActiveSession } = useBarStore();

  // Fetch active session for cashiers
  const { data: activeSession } = useQuery<BarSession>({
    queryKey: ["/api/sessions/active"],
    enabled: user?.role === "cashier",
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user, setCurrentUser]);

  useEffect(() => {
    if (activeSession) {
      setActiveSession(activeSession);
    }
  }, [activeSession, setActiveSession]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <RoleIndicator />
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/orders" component={Orders} />
            <Route path="/tables" component={Tables} />
            <Route path="/credits" component={Credits} />
            <Route path="/payments" component={Dashboard} />
            <Route path="/stats" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <PaymentModal />
      <SessionModal />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/login" component={Login} />
          <Route component={AuthenticatedApp} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
