import { useBarStore } from "@/store/useBarStore";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Receipt, FileText, Table } from "lucide-react";
import { PT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

export function StatsCards() {
  const { sessionStats } = useBarStore();

  const stats = [
    {
      title: PT.dashboard.todaySales,
      value: formatCurrency(sessionStats?.totalSales || "0"),
      change: "+15.2% vs ontem",
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500 bg-opacity-20",
    },
    {
      title: PT.dashboard.totalTransactions,
      value: sessionStats?.transactionCount || 0,
      change: "3 pendentes",
      icon: Receipt,
      color: "text-blue-400",
      bgColor: "bg-blue-500 bg-opacity-20",
    },
    {
      title: PT.dashboard.activeCredits,
      value: formatCurrency(sessionStats?.activeCredits || "0"),
      change: "2 clientes",
      icon: FileText,
      color: "text-orange-400",
      bgColor: "bg-orange-500 bg-opacity-20",
    },
    {
      title: PT.dashboard.occupiedTables,
      value: `${sessionStats?.occupiedTables || 0}/${sessionStats?.totalTables || 0}`,
      change: `${Math.round(((sessionStats?.occupiedTables || 0) / (sessionStats?.totalTables || 1)) * 100)}% ocupação`,
      icon: Table,
      color: "text-purple-400",
      bgColor: "bg-purple-500 bg-opacity-20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
