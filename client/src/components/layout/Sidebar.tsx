import { useBarStore } from "@/store/useBarStore";
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
} from "lucide-react";
import { PT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

export function Sidebar() {
  const [location] = useLocation();
  const { currentUser, activeSession, sessionStats, setShowSessionModal } = useBarStore();

  const navigationItems = [
    { href: "/", icon: BarChart3, label: PT.nav.dashboard },
    { href: "/orders", icon: ShoppingCart, label: PT.nav.orders, badge: 3 },
    { href: "/tables", icon: Table, label: PT.nav.tables },
    { href: "/payments", icon: CreditCard, label: "Pagamentos" },
    { href: "/credits", icon: FileText, label: PT.nav.credits, badge: 2 },
    { href: "/stats", icon: TrendingUp, label: "Estatísticas" },
  ];

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 pt-6">
      <nav className="space-y-2 px-4">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "text-white bg-blue-600"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </a>
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
    </aside>
  );
}
