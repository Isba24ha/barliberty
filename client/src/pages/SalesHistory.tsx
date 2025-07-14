import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  History, 
  Receipt, 
  Search, 
  Eye, 
  Calendar,
  DollarSign,
  Clock,
  User,
  Printer
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { thermalPrinter } from "@/lib/thermalPrinter";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithItems } from "@shared/schema";

export default function SalesHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: completedOrders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", "completed", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/orders?status=completed&date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const filteredOrders = completedOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.table?.number.toString().includes(searchLower) ||
      order.server?.firstName?.toLowerCase().includes(searchLower) ||
      order.clientName?.toLowerCase().includes(searchLower) ||
      order.items.some(item => item.product.name.toLowerCase().includes(searchLower))
    );
  });

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      cash: "bg-green-500",
      mobile_money: "bg-blue-500",
      credit: "bg-orange-500",
      partial: "bg-purple-500"
    };
    const labels = {
      cash: "Dinheiro",
      mobile_money: "Mobile Money",
      credit: "Crédito",
      partial: "Parcial"
    };
    return (
      <Badge className={`${colors[method as keyof typeof colors]} text-white`}>
        {labels[method as keyof typeof labels]}
      </Badge>
    );
  };

  const handlePrintReceipt = async (order: OrderWithItems) => {
    try {
      await thermalPrinter.printReceipt(order);
      toast({
        title: "Sucesso",
        description: "Recibo enviado para impressão",
      });
    } catch (error) {
      toast({
        title: "Erro de Impressão",
        description: error instanceof Error ? error.message : "Erro ao imprimir recibo",
        variant: "destructive",
      });
    }
  };

  const OrderReceiptDialog = ({ order }: { order: OrderWithItems }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700">
          <Eye className="w-4 h-4 mr-1" />
          Ver Recibo
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Recibo de Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center border-b border-gray-600 pb-4">
            <h3 className="font-bold">BarManager Pro</h3>
            <p className="text-sm text-gray-400">Recibo #{order.id}</p>
            <p className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleString("pt-PT")}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mesa:</span>
              <span>{order.table?.number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Servidor:</span>
              <span>{order.server?.firstName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cliente:</span>
              <span>{order.clientName || "Cliente Anônimo"}</span>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h4 className="font-medium mb-2">Itens:</h4>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>{formatCurrency(parseFloat(item.totalPrice))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4 space-y-2">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span className="text-green-400">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pagamento:</span>
              {getPaymentMethodBadge(order.paymentMethod || 'cash')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <History className="w-8 h-8 mr-3" />
            Histórico de Vendas
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <History className="w-8 h-8 mr-3" />
          Histórico de Vendas
        </h2>
        <Badge variant="secondary" className="bg-gray-700 text-white">
          {filteredOrders.length} vendas
        </Badge>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-gray-300">
                Pesquisar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Mesa, servidor, cliente ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-300">
                Data
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(
                    filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)
                  )}
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
                <p className="text-sm text-gray-400">Número de Vendas</p>
                <p className="text-2xl font-bold text-blue-400">{filteredOrders.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Venda Média</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(
                    filteredOrders.length > 0 
                      ? filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) / filteredOrders.length
                      : 0
                  )}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Nenhuma venda encontrada</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-500 text-white">
                      Mesa {order.table?.number}
                    </Badge>
                    {getPaymentMethodBadge(order.paymentMethod || 'cash')}
                  </div>
                  <span className="text-sm text-gray-400">
                    #{order.id}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {new Date(order.createdAt).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-green-400 font-bold">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {order.server?.firstName}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {order.items.length} itens
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-400">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>{formatCurrency(parseFloat(item.totalPrice))}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{order.items.length - 2} mais itens
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <OrderReceiptDialog order={order} />
                  <Button
                    onClick={() => handlePrintReceipt(order)}
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-400 hover:bg-green-600/20"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Imprimir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}