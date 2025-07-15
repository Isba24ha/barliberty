import { Switch, Route, useLocation } from "wouter";
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
import { OpenSessionModal } from "@/components/modals/OpenSessionModal";

// Pages
import Dashboard from "@/pages/Dashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import Orders from "@/pages/Orders";
import Tables from "@/pages/Tables";
import Credits from "@/pages/Credits";
import SalesHistory from "@/pages/SalesHistory";
import Inventory from "@/pages/Inventory";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

import { BarSession, User } from "@shared/schema";

function AuthenticatedRoutes({ user }: { user: User }) {
  const [location] = useLocation();
  
  // Clean the location string to remove any quotes or escaping
  const cleanLocation = location.replace(/['"]/g, '');
  
  console.log("AuthenticatedRoutes - Current location:", cleanLocation, "User:", user.id, "Role:", user.role);
  
  switch (cleanLocation) {
    case "/":
      console.log("Rendering dashboard for user:", user.id, "role:", user.role);
      return user.role === "manager" ? <ManagerDashboard /> : <Dashboard />;
    case "/orders":
      return <Orders />;
    case "/tables":
      return <Tables />;
    case "/credits":
      return <Credits />;
    case "/sales-history":
      return <SalesHistory />;
    case "/inventory":
      return <Inventory />;
    case "/payments":
      return <Dashboard />;
    case "/stats":
      return <Dashboard />;
    default:
      console.log("Unknown route:", cleanLocation, "- showing NotFound");
      return <NotFound />;
  }
}

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

  console.log("AuthenticatedApp rendered for user:", user?.id, "role:", user?.role);

  // Don't render until user is loaded
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <div className="text-white">Carregando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <RoleIndicator />
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <AuthenticatedRoutes user={user} />
        </main>
      </div>
      <PaymentModal />
      <SessionModal />
      <OpenSessionModal />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log("Router render:", { isAuthenticated, isLoading, userRole: user?.role });

  if (isLoading) {
    console.log("Showing loading screen");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    );
  }

  // For unauthenticated users, always show login page
  if (!isAuthenticated) {
    console.log("Showing login page - user not authenticated");
    return <Login />;
  }

  // For authenticated users, show the main app
  console.log("Showing authenticated app for user:", user?.username);
  return <AuthenticatedApp />;
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
