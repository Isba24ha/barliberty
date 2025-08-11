import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  Clock,
  Plus,
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
  CreditCard,
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/currency";
import { PT } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { thermalPrinter } from "@/lib/thermalPrinter";
import type { User, CreditClient } from "@shared/schema";

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
  const [location] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Set active tab based on URL path
  useEffect(() => {
    if (location === "/credits") {
      setActiveTab("credits");
    } else if (location === "/inventory") {
      setActiveTab("inventory");
    } else if (location === "/stats") {
      setActiveTab("sales");
    } else {
      setActiveTab("overview");
    }
  }, [location]);

  const { data: managerStats, isLoading, refetch } = useQuery<ManagerStats>({
    queryKey: ["/api/manager/stats/daily", selectedDate],
    refetchInterval: 30000,
  });

  const { data: creditClients } = useQuery<CreditClient[]>({
    queryKey: ["/api/credit-clients"],
    refetchInterval: 10000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/manager/users"],
  });

  // New queries for enhanced features
  const { data: lowStockProducts } = useQuery({
    queryKey: ["/api/manager/low-stock"],
    refetchInterval: 30000,
  });

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedCreditClientId, setSelectedCreditClientId] = useState<number | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  
  // New state for enhanced features
  const [sessionHistoryPage, setSessionHistoryPage] = useState(0);
  const [showBulkStockUpdate, setShowBulkStockUpdate] = useState(false);
  const [selectedLowStockProducts, setSelectedLowStockProducts] = useState<number[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const SESSIONS_PER_PAGE = 15;

  const { data: sessionDetails } = useQuery({
    queryKey: ["/api/manager/session-details", selectedSessionId],
    enabled: !!selectedSessionId,
  });

  const { data: creditClientDetails } = useQuery({
    queryKey: ["/api/manager/credit-client", selectedCreditClientId, "details"],
    enabled: !!selectedCreditClientId,
  });

  // Enhanced queries for new features
  const { data: detailedSalesReport } = useQuery({
    queryKey: ["/api/manager/detailed-sales", selectedDate],
  });

  const { data: paymentBreakdownData } = useQuery({
    queryKey: ["/api/manager/payment-breakdown", selectedDate],
  });

  const { data: creditPaymentsData } = useQuery({
    queryKey: ["/api/manager/credit-payments", selectedDate],
  });

  const { data: productsForSearch } = useQuery({
    queryKey: ["/api/products/search"],
    enabled: showProductSearch,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const userFormSchema = z.object({
    id: z.string().min(1, "ID utilisateur requis"),
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    email: z.string().email("Email invalide"),
    role: z.enum(["cashier", "server", "manager"]),
    isActive: z.boolean(),
  });

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "cashier",
      isActive: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      const res = await apiRequest("POST", "/api/manager/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/users"] });
      setShowUserModal(false);
      userForm.reset();
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      const res = await apiRequest("PUT", `/api/manager/users/${userData.id}`, userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/users"] });
      setShowUserModal(false);
      setEditingUser(null);
      userForm.reset();
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/manager/users/${id}/status`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/users"] });
      toast({
        title: "Succès",
        description: "Statut utilisateur mis à jour",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    },
  });

  // Mutation for individual stock update
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newStock }: { productId: number; newStock: number }) => {
      const response = await apiRequest('POST', '/api/manager/update-product-stock', { 
        productId, 
        currentStock: newStock 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock atualizado",
        description: "Stock do produto atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/low-stock'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar stock",
        description: error.message || "Erro ao atualizar stock",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleExportSales = async (type?: string) => {
    try {
      const exportType = type || selectedPeriod;
      let exportData;
      let filename;

      if (exportType === 'complete') {
        // Comprehensive report with all data
        exportData = {
          summary: {
            totalSales: managerStats?.dailySales.total || 0,
            morningSales: managerStats?.dailySales.morning || 0,
            eveningSales: managerStats?.dailySales.evening || 0,
            activeCredits: managerStats?.activeCredits || 0,
            totalProducts: managerStats?.totalProducts || 0,
            lowStockProducts: managerStats?.lowStockProducts || 0,
          },
          sessions: managerStats?.sessionHistory || [],
          topProducts: managerStats?.topProducts || [],
          date: selectedDate,
        };
        filename = `relatorio_completo_${selectedDate}.json`;
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // CSV export for daily/weekly/monthly
        const csvData = managerStats?.sessionHistory?.map(session => ({
          Data: session.date,
          Turno: session.shift,
          Usuario: session.user,
          Vendas: session.sales,
          Transacoes: session.transactions,
        }));
        
        if (csvData && csvData.length > 0) {
          const csvContent = "data:text/csv;charset=utf-8," + 
            Object.keys(csvData[0]).join(",") + "\n" +
            csvData.map(row => Object.values(row).join(",")).join("\n");
          
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `vendas_${exportType}_${selectedDate}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na exportação dos dados",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    userForm.reset();
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.reset({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as "cashier" | "server" | "manager",
      isActive: user.isActive,
    });
    setShowUserModal(true);
  };

  const handleToggleUserStatus = (user: User) => {
    toggleUserStatusMutation.mutate({
      id: user.id,
      isActive: !user.isActive,
    });
  };

  const onSubmitUser = (values: z.infer<typeof userFormSchema>) => {
    if (editingUser) {
      updateUserMutation.mutate(values);
    } else {
      createUserMutation.mutate(values);
    }
  };

  // New enhanced functions
  const handleExportSession = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/manager/export/session/${sessionId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `sessao_${sessionId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: "Relatório da sessão exportado com sucesso!",
        });
      } else {
        throw new Error('Falha na exportação');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao exportar relatório da sessão",
        variant: "destructive",
      });
    }
  };

  // NEW: Export products sold by session
  const handleExportSessionProducts = async (sessionId: number) => {
    try {
      console.log(`[DEBUG Frontend] Starting export for session ${sessionId}`);
      const response = await fetch(`/api/manager/sessions/${sessionId}/products-export`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`[DEBUG Frontend] Response status: ${response.status}, ok: ${response.ok}`);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('[DEBUG] Export response data:', data);
        
        // Check if response data is valid
        if (!data || !data.sessionInfo) {
          throw new Error('Dados de resposta inválidos do servidor');
        }
        
        // Check if there are products to export
        if (!data.products || data.products.length === 0) {
          toast({
            title: "Aviso",
            description: "Nenhum produto vendido encontrado nesta sessão.",
          });
          return;
        }
        
        // Safely get headers from first product
        const firstProduct = data.products[0];
        if (!firstProduct || typeof firstProduct !== 'object') {
          throw new Error('Formato de produto inválido');
        }
        
        const headers = Object.keys(firstProduct);
        const csvContent = [
          `# Relatório de Produtos Vendidos - Sessão ${sessionId}`,
          `# Data: ${data.sessionInfo.date || 'N/A'}`,
          `# Turno: ${data.sessionInfo.shift || 'N/A'}`,
          `# Usuário: ${data.sessionInfo.user || 'N/A'}`,
          `# Total de Produtos: ${data.sessionInfo.totalProducts || 0}`,
          `# Receita Total: ${data.sessionInfo.totalRevenue || '0.00'} F CFA`,
          `# Exportado em: ${data.exportDate || new Date().toLocaleString('pt-PT')}`,
          '', // Empty line
          headers.join(','),
          ...data.products.map((product: any) => 
            headers.map(header => `"${product[header] || ''}"`).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `produtos_sessao_${sessionId}_${data.sessionInfo.date || 'unknown'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: `Lista de produtos exportada! ${data.sessionInfo.totalProducts || 0} produtos vendidos.`,
        });
      } else {
        let errorMessage = 'Falha na exportação de produtos';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao exportar lista de produtos vendidos",
        variant: "destructive",
      });
    }
  };

  const handleViewSessionDetails = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setShowSessionModal(true);
  };

  const handleViewCreditDetails = (clientId: number) => {
    setSelectedCreditClientId(clientId);
  };

  // New enhanced functions for improved features
  const handleBulkStockUpdate = () => {
    setShowBulkStockUpdate(true);
  };

  const bulkUpdateStockMutation = useMutation({
    mutationFn: async (updates: { productId: number; newStock: number }[]) => {
      const res = await apiRequest("PUT", "/api/manager/bulk-stock-update", { updates });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/stats/daily"] });
      setShowBulkStockUpdate(false);
      setSelectedLowStockProducts([]);
      toast({
        title: "Succès",
        description: "Stock mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du stock",
        variant: "destructive",
      });
    },
  });

  // Get all products for stock update modal
  const { data: allProducts } = useQuery({
    queryKey: ["/api/products"],
    enabled: showBulkStockUpdate,
  });

  // Filter products based on search term
  const filteredProducts = allProducts?.filter((product: any) => 
    productSearchTerm === "" || 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.id.toString().includes(productSearchTerm)
  ) || [];

  // Calculate paginated session history
  const paginatedSessionHistory = managerStats?.sessionHistory 
    ? managerStats.sessionHistory.slice(
        sessionHistoryPage * SESSIONS_PER_PAGE,
        (sessionHistoryPage + 1) * SESSIONS_PER_PAGE
      )
    : [];

  const totalSessionPages = managerStats?.sessionHistory 
    ? Math.ceil(managerStats.sessionHistory.length / SESSIONS_PER_PAGE)
    : 0;

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
          <h1 className="text-3xl font-bold text-white">{PT.manager.dashboard}</h1>
          <p className="text-gray-400 mt-1">Visão geral das operações e estatísticas</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportSales} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            {PT.manager.exportData}
          </Button>
          <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Sales Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Vendas Manhã</p>
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
                <p className="text-sm text-gray-400">Vendas Tarde</p>
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
                <p className="text-sm text-gray-400">Total Diário</p>
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
                <p className="text-sm text-gray-400">Créditos Ativos</p>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
          <TabsTrigger value="inventory">Stock</TabsTrigger>
          <TabsTrigger value="credits">Clientes Crédito</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Produtos Mais Vendidos
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
                        <p className="text-sm text-gray-400">{product.sales} vendidos</p>
                        <p className="text-sm font-medium text-green-400">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session History with Pagination */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Histórico de Sessões ({managerStats?.sessionHistory?.length || 0})
                  </CardTitle>
                  <div className="text-sm text-gray-400">
                    Página {sessionHistoryPage + 1} de {totalSessionPages || 1}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paginatedSessionHistory && paginatedSessionHistory.length > 0 ? (
                    paginatedSessionHistory.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{session.user}</p>
                          <p className="text-sm text-gray-400">{session.date} - {session.shift}</p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="text-sm font-medium text-green-400">{formatCurrency(session.sales)}</p>
                          <p className="text-sm text-gray-400">{session.transactions} transações</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-600 text-blue-400 hover:bg-blue-600"
                            onClick={() => handleViewSessionDetails(session.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-600 text-green-400 hover:bg-green-600"
                            onClick={() => handleExportSession(session.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-orange-600 text-orange-400 hover:bg-orange-600"
                            onClick={() => handleExportSessionProducts(session.id)}
                            title="Exportar Lista de Produtos Vendidos"
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">Nenhuma sessão encontrada</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination Controls */}
                {totalSessionPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4 pt-4 border-t border-gray-600">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600"
                      disabled={sessionHistoryPage === 0}
                      onClick={() => setSessionHistoryPage(prev => Math.max(0, prev - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-400 px-4">
                      {sessionHistoryPage + 1} / {totalSessionPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600"
                      disabled={sessionHistoryPage >= totalSessionPages - 1}
                      onClick={() => setSessionHistoryPage(prev => Math.min(totalSessionPages - 1, prev + 1))}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Vendas Manhã</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{managerStats?.dailySales?.morning || "0.00"} F CFA</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Vendas Tarde</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{managerStats?.dailySales?.evening || "0.00"} F CFA</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total do Dia</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{managerStats?.dailySales?.total || "0.00"} F CFA</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Stock Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">{lowStockProducts?.length || 0}</div>
                <p className="text-xs text-gray-400">
                  produtos em alerta
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Payment Breakdown Section - Daily & Weekly */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Breakdown Détaillé de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Daily Breakdown */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Dia: {selectedDate}</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-400">💵 Dinheiro</p>
                    <p className="text-2xl font-bold text-white">{paymentBreakdownData?.cash?.total || "0.00"} F CFA</p>
                    <p className="text-xs text-gray-400">{paymentBreakdownData?.cash?.count || 0} transações</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-400">📱 Mobile Money</p>
                    <p className="text-2xl font-bold text-white">{paymentBreakdownData?.mobile?.total || "0.00"} F CFA</p>
                    <p className="text-xs text-gray-400">{paymentBreakdownData?.mobile?.count || 0} transações</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-purple-400">💳 Cartão</p>
                    <p className="text-2xl font-bold text-white">{paymentBreakdownData?.card?.total || "0.00"} F CFA</p>
                    <p className="text-xs text-gray-400">{paymentBreakdownData?.card?.count || 0} transações</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-400">📝 Crédito</p>
                    <p className="text-2xl font-bold text-white">{paymentBreakdownData?.credit?.total || "0.00"} F CFA</p>
                    <p className="text-xs text-gray-400">{paymentBreakdownData?.credit?.count || 0} transações</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-white">Total Diário:</span>
                    <span className="text-2xl font-bold text-green-400">{paymentBreakdownData?.total || "0.00"} F CFA</span>
                  </div>
                </div>
              </div>

              {/* Weekly Breakdown */}
              <div className="border-t border-gray-600 pt-6">
                <h4 className="text-lg font-semibold text-white mb-3">Resumo Semanal</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Total da Semana</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(managerStats?.weeklySales || "0")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Média Diária</p>
                    <p className="text-xl font-bold text-blue-400">
                      {formatCurrency((parseFloat(managerStats?.weeklySales || "0") / 7).toFixed(2))}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Crescimento</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {managerStats?.weeklySales && managerStats?.dailySales?.total ? 
                        ((parseFloat(managerStats.dailySales.total) / (parseFloat(managerStats.weeklySales) / 7) - 1) * 100).toFixed(1) : "0.0"}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Credit Reimbursements */}
              {creditPaymentsData && creditPaymentsData.length > 0 && (
                <div className="border-t border-gray-600 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-400">Reembolsos de Crédito do Dia:</span>
                    <span className="text-lg font-bold text-blue-400">
                      {formatCurrency(creditPaymentsData.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0).toString())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{creditPaymentsData.length} reembolsos processados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Move the detailed breakdown to Sales tab */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                {PT.manager.salesReports}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">Vendas Semanais</h4>
                  <p className="text-2xl font-bold text-white">{formatCurrency(managerStats?.weeklySales || "0")}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">Vendas Mensais</h4>
                  <p className="text-2xl font-bold text-white">{formatCurrency(managerStats?.monthlySales || "0")}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">Média Diária</h4>
                  <p className="text-2xl font-bold text-white">{formatCurrency(managerStats?.dailySales.total || "0")}</p>
                </div>
              </div>

              {/* Detailed Payment Breakdown in Sales Tab */}
              <div className="border-t border-gray-600 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Breakdown Detalhado de Pagamentos</h3>
                
                {/* Daily Breakdown */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-300 mb-3">Dia: {selectedDate}</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-400">💵 Dinheiro</p>
                      <p className="text-xl font-bold text-white">{paymentBreakdownData?.cash?.total || "0.00"} F CFA</p>
                      <p className="text-xs text-gray-400">{paymentBreakdownData?.cash?.count || 0} transações</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-400">📱 Mobile Money</p>
                      <p className="text-xl font-bold text-white">{paymentBreakdownData?.mobile?.total || "0.00"} F CFA</p>
                      <p className="text-xs text-gray-400">{paymentBreakdownData?.mobile?.count || 0} transações</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-purple-400">💳 Cartão</p>
                      <p className="text-xl font-bold text-white">{paymentBreakdownData?.card?.total || "0.00"} F CFA</p>
                      <p className="text-xs text-gray-400">{paymentBreakdownData?.card?.count || 0} transações</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-orange-400">📝 Crédito</p>
                      <p className="text-xl font-bold text-white">{paymentBreakdownData?.credit?.total || "0.00"} F CFA</p>
                      <p className="text-xs text-gray-400">{paymentBreakdownData?.credit?.count || 0} transações</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-white">Total Diário:</span>
                      <span className="text-xl font-bold text-green-400">{paymentBreakdownData?.total || "0.00"} F CFA</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Summary */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-md font-semibold text-gray-300 mb-3">Resumo Semanal</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-400">Total da Semana</p>
                      <p className="text-lg font-bold text-green-400">{formatCurrency(managerStats?.weeklySales || "0")}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-400">Média Diária</p>
                      <p className="text-lg font-bold text-blue-400">
                        {formatCurrency((parseFloat(managerStats?.weeklySales || "0") / 7).toFixed(2))}
                      </p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-400">Crescimento</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {managerStats?.weeklySales && managerStats?.dailySales?.total ? 
                          ((parseFloat(managerStats.dailySales.total) / (parseFloat(managerStats.weeklySales) / 7) - 1) * 100).toFixed(1) : "0.0"}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credit Reimbursements */}
                {creditPaymentsData && creditPaymentsData.length > 0 && (
                  <div className="border-t border-gray-600 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-400">Reembolsos de Crédito do Dia:</span>
                      <span className="text-lg font-bold text-blue-400">
                        {formatCurrency(creditPaymentsData.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0).toString())}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{creditPaymentsData.length} reembolsos processados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {PT.manager.userManagement}
                </CardTitle>
                <Button onClick={handleCreateUser} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Utilizador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user: User) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{user.firstName?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={user.role === "manager" ? "bg-orange-600" : user.role === "cashier" ? "bg-blue-600" : "bg-green-600"}>
                        {user.role === "manager" ? "Gerente" : user.role === "cashier" ? "Caixa" : "Servidor"}
                      </Badge>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gray-600"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gray-600"
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab - Enhanced */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  {PT.manager.inventoryManagement}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">{managerStats?.totalProducts || 0}</p>
                    <p className="text-sm text-gray-400">Total Produtos</p>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-red-400">{managerStats?.lowStockProducts || 0}</p>
                    <p className="text-sm text-gray-400">Stock Baixo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simplified Stock Management */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Package className="w-5 h-5 mr-2 text-orange-500" />
                    Gestão de Stock
                  </CardTitle>
                  <Button
                    onClick={handleBulkStockUpdate}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Atualizar Stock
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stock Alerts Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-orange-400 mb-2">
                    Alertas de Stock ({lowStockProducts?.length || 0} produtos)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lowStockProducts && lowStockProducts.length > 0 ? (
                      lowStockProducts.map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-red-900/20 border border-red-700 rounded">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-gray-400">ID: {product.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-red-400 font-medium">
                              {product.currentStock}/{product.minStock}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              {product.status === 'out_of_stock' ? 'Esgotado' : 'Baixo'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4 text-sm">
                        ✓ Todos os produtos com stock adequado
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stock Statistics */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-600">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-400">{managerStats?.totalProducts || 0}</p>
                    <p className="text-xs text-gray-400">Total Produtos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-400">{lowStockProducts?.length || 0}</p>
                    <p className="text-xs text-gray-400">Stock Baixo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-400">
                      {((managerStats?.totalProducts || 0) - (lowStockProducts?.length || 0))}
                    </p>
                    <p className="text-xs text-gray-400">Stock OK</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gestão de Clientes Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditClients && creditClients.length > 0 ? (
                  <div className="grid gap-4">
                    {creditClients.map((client) => (
                      <div key={client.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{client.name}</h4>
                          <p className="text-sm text-gray-400">{client.email}</p>
                          <p className="text-sm text-gray-400">{client.phone}</p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="text-lg font-bold text-orange-400">
                            {formatCurrency(client.totalCredit)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {client.isActive ? "Ativo" : "Inativo"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-600 text-blue-400 hover:bg-blue-600"
                            onClick={() => handleViewCreditDetails(client.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Nenhum cliente crédito encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {PT.manager.reports}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 h-20 flex-col"
                  onClick={() => handleExportSales('daily')}
                >
                  <Download className="w-6 h-6 mb-2" />
                  Exportar Diário
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 h-20 flex-col"
                  onClick={() => handleExportSales('weekly')}
                >
                  <Download className="w-6 h-6 mb-2" />
                  Exportar Semanal
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 h-20 flex-col"
                  onClick={() => handleExportSales('monthly')}
                >
                  <Download className="w-6 h-6 mb-2" />
                  Exportar Mensal
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 h-20 flex-col"
                  onClick={() => handleExportSales('complete')}
                >
                  <Eye className="w-6 h-6 mb-2" />
                  Relatório Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Management Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modificar utilizador" : "Criar utilizador"}
            </DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Utilizador</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gray-700 border-gray-600"
                        disabled={!!editingUser}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-gray-700 border-gray-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apelido</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-gray-700 border-gray-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="bg-gray-700 border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Selecionar função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="cashier">Caixa</SelectItem>
                        <SelectItem value="server">Servidor</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUserModal(false)}
                  className="border-gray-600"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingUser ? "Modificar" : "Criar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Session Details Modal */}
      <Dialog open={!!selectedSessionId} onOpenChange={() => setSelectedSessionId(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{PT.manager.sessionDetails}</DialogTitle>
          </DialogHeader>
          {sessionDetails && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Informações da Sessão</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">ID:</span> {sessionDetails.id}</p>
                    <p><span className="text-gray-400">Data:</span> {sessionDetails.date}</p>
                    <p><span className="text-gray-400">Turno:</span> {sessionDetails.shiftType}</p>
                    <p><span className="text-gray-400">Utilizador:</span> {sessionDetails.cashier}</p>
                    <p><span className="text-gray-400">Transações:</span> {sessionDetails.transactionCount}</p>
                    <p><span className="text-gray-400">Status:</span> <span className={sessionDetails.isActive ? "text-green-400" : "text-gray-400"}>{sessionDetails.isActive ? "Ativa" : "Finalizada"}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{PT.manager.paymentMethods}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dinheiro ({sessionDetails.paymentBreakdown.cash.count}x):</span>
                      <span className="text-green-400">{formatCurrency(sessionDetails.paymentBreakdown.cash.total.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mobile Money ({sessionDetails.paymentBreakdown.mobile_money.count}x):</span>
                      <span className="text-blue-400">{formatCurrency(sessionDetails.paymentBreakdown.mobile_money.total.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Crédito ({sessionDetails.paymentBreakdown.credit.count}x):</span>
                      <span className="text-orange-400">{formatCurrency(sessionDetails.paymentBreakdown.credit.total.toString())}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-white">Total:</span>
                        <span className="text-green-400">{formatCurrency(sessionDetails.totalSales.toString())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Lista de Pedidos</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {sessionDetails.orders?.map((order: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-600' : 
                          order.status === 'pending' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                        <p className="text-white mt-1">Mesa {order.tableId} - {order.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{formatCurrency(order.totalPrice)}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString('pt-PT')}</p>
                      </div>
                    </div>
                  )) || <p className="text-gray-400 text-center py-4">Nenhum pedido encontrado</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  onClick={() => selectedSessionId && handleExportSession(selectedSessionId)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {PT.manager.exportData}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Search Modal */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pesquisar Produtos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Pesquisar por nome ou ID do produto..."
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
            
            {/* Fixed Categories List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-700 rounded-lg">
              <div className="text-center">
                <Badge variant="outline" className="w-full">Bebidas</Badge>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">Comidas</Badge>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">Vinhos</Badge>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">Cervejas</Badge>
              </div>
            </div>
            
            {/* Filtered Products Results */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">ID: {product.id} - {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-400">Stock: {product.currentStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Update Modal */}
      <Dialog open={showBulkStockUpdate} onOpenChange={setShowBulkStockUpdate}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Atualização de Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search products */}
            <div className="border-b border-gray-600 pb-4">
              <Input
                placeholder="Pesquisar produtos por nome ou ID..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            
            {/* Products list with stock update */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-sm text-gray-400">ID: {product.id} - {product.category}</p>
                      <p className="text-xs text-gray-500">Preço: {formatCurrency(product.price)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-300">Stock atual:</p>
                        <p className="text-lg font-bold text-white">{product.currentStock}</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Novo"
                          className="bg-gray-600 border-gray-500 text-center"
                          id={`stock-${product.id}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const inputElement = document.getElementById(`stock-${product.id}`) as HTMLInputElement;
                          const newStock = inputElement?.value;
                          if (newStock && parseInt(newStock) >= 0) {
                            // Call update API for individual product
                            updateStockMutation.mutate({ productId: product.id, newStock: parseInt(newStock) });
                            inputElement.value = '';
                          } else {
                            toast({
                              title: "Erro",
                              description: "Por favor, insira um valor válido para o stock",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={updateStockMutation.isPending}
                      >
                        {updateStockMutation.isPending ? "..." : "Atualizar"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {productSearchTerm ? "Nenhum produto encontrado" : "Digite para pesquisar produtos"}
                </p>
              )}
            </div>
            
            {/* Alert products section */}
            {lowStockProducts && lowStockProducts.length > 0 && (
              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-orange-400 mb-2">
                  Produtos com Stock Baixo
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {lowStockProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-red-900/20 border border-red-700 rounded text-sm">
                      <span className="text-white">{product.name}</span>
                      <span className="text-red-400 font-medium">{product.currentStock}/{product.minStock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-600">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkStockUpdate(false)}
                className="border-gray-600"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Client Details Modal */}
      <Dialog open={!!selectedCreditClientId} onOpenChange={() => setSelectedCreditClientId(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{PT.manager.creditDetails}</DialogTitle>
          </DialogHeader>
          {creditClientDetails && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Informações do Cliente</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">Nome:</span> {creditClientDetails.client.name}</p>
                    <p><span className="text-gray-400">Email:</span> {creditClientDetails.client.email || 'N/A'}</p>
                    <p><span className="text-gray-400">Telefone:</span> {creditClientDetails.client.phone || 'N/A'}</p>
                    <p><span className="text-gray-400">Status:</span> 
                      <span className={creditClientDetails.client.isActive ? 'text-green-400' : 'text-red-400'}>
                        {creditClientDetails.client.isActive ? ' Ativo' : ' Inativo'}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Resumo Financeiro</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Crédito Dado:</span>
                      <span className="text-red-400">{formatCurrency(creditClientDetails.summary.totalCreditGiven)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Pago:</span>
                      <span className="text-green-400">{formatCurrency(creditClientDetails.summary.totalPaymentsReceived)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-white">Saldo Devedor:</span>
                        <span className="text-orange-400">{formatCurrency(creditClientDetails.summary.outstandingBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Histórico de Créditos</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {creditClientDetails.creditHistory.map((credit: any, index: number) => (
                      <div key={index} className="p-2 bg-red-900/20 border border-red-700 rounded">
                        <div className="flex justify-between">
                          <span className="text-red-400">{formatCurrency(credit.amount)}</span>
                          <span className="text-xs text-gray-400">{new Date(credit.date).toLocaleDateString('pt-PT')}</span>
                        </div>
                        <p className="text-xs text-gray-500">Sessão: {credit.sessionId}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{PT.manager.paymentHistory}</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {creditClientDetails.paymentHistory.map((payment: any, index: number) => (
                      <div key={index} className="p-2 bg-green-900/20 border border-green-700 rounded">
                        <div className="flex justify-between">
                          <span className="text-green-400">{formatCurrency(payment.amount)}</span>
                          <span className="text-xs text-gray-400">{new Date(payment.date).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Details Modal */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Detalhes da Sessão #{selectedSessionId}
            </DialogTitle>
          </DialogHeader>
          {sessionDetails && (
            <div className="space-y-6">
              {/* Session Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Data</p>
                      <p className="text-lg font-semibold text-white">{sessionDetails.date}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Turno</p>
                      <p className="text-lg font-semibold text-blue-400">{sessionDetails.shiftType}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Caixa</p>
                      <p className="text-lg font-semibold text-green-400">{sessionDetails.cashier}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Status</p>
                      <Badge variant={sessionDetails.isActive ? "default" : "secondary"}>
                        {sessionDetails.isActive ? "Ativa" : "Fechada"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total de Vendas</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(sessionDetails.totalSales)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Transações</p>
                        <p className="text-2xl font-bold text-blue-400">{sessionDetails.transactionCount}</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Horário</p>
                        <p className="text-lg font-semibold text-orange-400">
                          {sessionDetails.startTime} - {sessionDetails.endTime}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods Breakdown */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(sessionDetails.paymentBreakdown || {}).map(([method, data]: [string, any]) => {
                      const methodNames = {
                        cash: "Dinheiro",
                        mobile_money: "Mobile Money",
                        credit: "Crédito", 
                        partial: "Parcial"
                      };
                      return (
                        <div key={method} className="text-center p-3 bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-400">{methodNames[method as keyof typeof methodNames] || method}</p>
                          <p className="text-lg font-semibold text-white">{formatCurrency(data.total.toString())}</p>
                          <p className="text-xs text-gray-500">{data.count} transações</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Pedidos da Sessão ({sessionDetails.orders?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {sessionDetails.orders?.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">Mesa {order.tableId} - {order.clientName || "Cliente"}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleString('pt-PT')} | Status: {order.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-400">{formatCurrency(order.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <Button 
                  onClick={() => handleExportSession(selectedSessionId!)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Relatório
                </Button>
                <Button 
                  onClick={() => setShowSessionModal(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}