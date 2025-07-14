import { useBarStore } from "@/store/useBarStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  ShoppingCart,
  Table,
  CreditCard,
  FileText,
  TrendingUp,
  StopCircle,
  Package,
  PieChart,
  Users,
  LogOut,
} from "lucide-react";
import { PT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { currentUser, activeSession, sessionStats, setShowSessionModal } = useBarStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setLocation("/login");
      toast({
        title: "Logout",
        description: "Logout realizado com sucesso",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Different navigation items based on user role
  const getNavigationItems = () => {
    if (user?.role === "manager") {
      return [
        { href: "/", icon: PieChart, label: "Tableau de Bord" },
        { href: "/inventory", icon: Package, label: "Gestion Stock" },
        { href: "/credits", icon: CreditCard, label: "Crédits" },
        { href: "/sales-history", icon: FileText, label: "Historique Ventes" },
        { href: "/stats", icon: TrendingUp, label: "Statistiques" },
      ];
    } else {
      return [
        { href: "/", icon: BarChart3, label: PT.nav.dashboard },
        { href: "/orders", icon: ShoppingCart, label: PT.nav.orders, badge: 3 },
        { href: "/tables", icon: Table, label: PT.nav.tables },
        { href: "/sales-history", icon: FileText, label: "Histórico de Vendas" },
        { href: "/credits", icon: FileText, label: PT.nav.credits, badge: 2 },
        { href: "/stats", icon: TrendingUp, label: "Estatísticas" },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 pt-6 relative">
      <nav className="space-y-2 px-4">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive(item.href)
                  ? "text-white bg-blue-600"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
          </Link>
        ))}
      </nav>

      {/* Session Controls */}
      {activeSession && currentUser?.role === "cashier" && (
        <div className="px-4 mt-8">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-sm mb-3 text-white">Sessão Atual</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Início:</span>
                <span className="text-white">
                  {new Date(activeSession.startTime).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Vendas:</span>
                <span className="text-green-400">{formatCurrency(sessionStats?.totalSales || "0")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Transações:</span>
                <span className="text-white">{sessionStats?.transactionCount || 0}</span>
              </div>
            </div>
            <Button
              onClick={() => setShowSessionModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white mt-3"
              size="sm"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Fechar Sessão
            </Button>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
