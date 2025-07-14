import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  Calendar,
  FileText,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Eye,
  Clock
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { PT } from "@/lib/i18n";

interface ManagerStats {
  dailySales: {
    morning: string;
    evening: string;
    total: string;
  };
  weeklySales: string;
  monthlySales: string;
  activeCredits: string;
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  lowStockProducts: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: string;
  }>;
  sessionHistory: Array<{
    id: number;
    date: string;
    shift: string;
    user: string;
    sales: string;
    transactions: number;
  }>;
}

export default function ManagerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: managerStats, isLoading, refetch } = useQuery<ManagerStats>({
    queryKey: ["/api/manager/stats", selectedPeriod, selectedDate],
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/manager/users"],
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleExportSales = () => {
    // Implementation for exporting sales data
    console.log("Export sales data");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de Bord Gérant</h1>
          <p className="text-gray-400 mt-1">Vue d'ensemble des opérations et statistiques</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="daily">Journalier</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportSales} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Sales Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ventes Matin</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(managerStats?.dailySales.morning || "0")}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ventes Soir</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(managerStats?.dailySales.evening || "0")}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Journalier</p>
                <p className="text-2xl font-bold text-orange-400">
                  {formatCurrency(managerStats?.dailySales.total || "0")}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Crédits Actifs</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(managerStats?.activeCredits || "0")}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="inventory">Stock</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Produits les plus vendus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {managerStats?.topProducts?.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                        <span className="text-white">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{product.sales} vendus</p>
                        <p className="text-sm font-medium text-green-400">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session History */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Historique des sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {managerStats?.sessionHistory?.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{session.user}</p>
                        <p className="text-sm text-gray-400">{session.date} - {session.shift}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-400">{formatCurrency(session.sales)}</p>
                        <p className="text-sm text-gray-400">{session.transactions} transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                Analyse des ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">Ventes Hebdomadaires</h4>
                  <p className="text-2xl font-bold text-white">{formatCurrency(managerStats?.weeklySales || "0")}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">Ventes Mensuelles</h4>
                  <p className="text-2xl font-bold text-white">{formatCurrency(managerStats?.monthlySales || "0")}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">Moyenne Journalière</h4>
                  <p className="text-2xl font-bold text-white">{formatCurrency(managerStats?.dailySales.total || "0")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gestion des utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{user.firstName?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={user.role === "manager" ? "bg-orange-600" : user.role === "cashier" ? "bg-blue-600" : "bg-green-600"}>
                        {user.role}
                      </Badge>
                      <Button size="sm" variant="outline" className="border-gray-600">
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab - Placeholder */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Gestion du stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-center py-8">
                Fonctionnalité de gestion de stock en cours de développement
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Rapports et exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  Export Journalier
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  Export Hebdomadaire
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700 h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  Export Mensuel
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 h-20 flex-col">
                  <Eye className="w-6 h-6 mb-2" />
                  Rapport Complet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}