import { useBarStore } from "@/store/useBarStore";
import { Card, CardContent } from "@/components/ui/card";
import { Euro, Receipt, FileText, Table } from "lucide-react";

export function StatsCards() {
  const { sessionStats } = useBarStore();

  const stats = [
    {
      title: "Ventes Session",
      value: `€${sessionStats?.totalSales || "0.00"}`,
      change: "+15.2% vs hier",
      icon: Euro,
      color: "text-green-400",
      bgColor: "bg-green-500 bg-opacity-20",
    },
    {
      title: "Transactions",
      value: sessionStats?.transactionCount || 0,
      change: "3 en attente",
      icon: Receipt,
      color: "text-blue-400",
      bgColor: "bg-blue-500 bg-opacity-20",
    },
    {
      title: "Crédits Actifs",
      value: `€${sessionStats?.activeCredits || "0.00"}`,
      change: "2 clients",
      icon: FileText,
      color: "text-orange-400",
      bgColor: "bg-orange-500 bg-opacity-20",
    },
    {
      title: "Tables Occupées",
      value: `${sessionStats?.occupiedTables || 0}/${sessionStats?.totalTables || 0}`,
      change: `${Math.round(((sessionStats?.occupiedTables || 0) / (sessionStats?.totalTables || 1)) * 100)}% occupation`,
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
