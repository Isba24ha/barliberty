import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBarStore } from "@/store/useBarStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { OrdersPanel } from "@/components/dashboard/OrdersPanel";
import { TablesOverview } from "@/components/dashboard/TablesOverview";
import { CreditClientsTable } from "@/components/dashboard/CreditClientsTable";
import { SessionControls } from "@/components/dashboard/SessionControls";
import { StockPanel } from "@/components/dashboard/StockPanel";
import { RefreshCw } from "lucide-react";
import { SessionStats } from "@shared/schema";
import { PT } from "@/lib/i18n";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeSession, setSessionStats } = useBarStore();

  const { data: sessionStats, refetch } = useQuery<SessionStats>({
    queryKey: ["/api/sessions", activeSession?.id, "stats"],
    enabled: !!activeSession,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (sessionStats) {
      setSessionStats(sessionStats);
    }
  }, [sessionStats, setSessionStats]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {PT.dashboard.title} - {user?.role === "cashier" ? PT.roles.cashier : user?.role === "server" ? PT.roles.server : PT.roles.manager}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Última atualização: {new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <Button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Session Controls */}
      <SessionControls />

      {/* Stats Cards */}
      <StatsCards />

      {/* Three Column Layout for Cashiers */}
      {user?.role === "cashier" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Panel */}
          <OrdersPanel />

          {/* Tables Overview */}
          <TablesOverview />

          {/* Stock Panel for Cashiers */}
          <StockPanel />
        </div>
      ) : (
        /* Two Column Layout for Servers */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Panel */}
          <OrdersPanel />

          {/* Tables Overview */}
          <TablesOverview />
        </div>
      )}

      {/* Credits Section */}
      <div className="mt-6">
        <CreditClientsTable />
      </div>
    </div>
  );
}
