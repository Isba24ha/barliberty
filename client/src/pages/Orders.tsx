import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { NewClientModal } from "@/components/modals/NewClientModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  ShoppingCart, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Minus,
  MapPin,
  User,
  UserPlus,
  Table as TableIcon
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { PT } from "@/lib/i18n";
import type { Table, Product, Order, OrderItem, CreditClient, Category, OrderWithItems } from "@shared/schema";

interface OrderStep {
  step: 'table' | 'client' | 'products' | 'complete';
  selectedTable: Table | null;
  clientType: 'anonymous' | 'credit' | null;
  selectedClient: CreditClient | null;
  anonymousName: string;
  orderItems: Array<{
    product: Product;
    quantity: number;
  }>;
  notes: string;
}

export default function Orders() {
  const { toast } = useToast();
  const [orderStep, setOrderStep] = useState<OrderStep>({
    step: 'table',
    selectedTable: null,
    clientType: null,
    selectedClient: null,
    anonymousName: '',
    orderItems: [],
    notes: ''
  });
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Data queries
  const { data: tables = [], isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    refetchInterval: 5000,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: creditClients = [] } = useQuery<CreditClient[]>({
    queryKey: ["/api/credit-clients"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!",
      });
      resetOrder();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar pedido",
        variant: "destructive",
      });
    },
  });

  const addItemsToOrderMutation = useMutation({
    mutationFn: async ({ orderId, items }: { orderId: number; items: any[] }) => {
      return apiRequest("POST", `/api/orders/${orderId}/items`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Sucesso",
        description: "Itens adicionados ao pedido com sucesso!",
      });
      resetOrder();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar itens ao pedido",
        variant: "destructive",
      });
    },
  });

  const resetOrder = () => {
    setOrderStep({
      step: 'table',
      selectedTable: null,
      clientType: null,
      selectedClient: null,
      anonymousName: '',
      orderItems: [],
      notes: ''
    });
  };

  const handleTableSelection = (table: Table) => {
    // Check if table is occupied and has an existing order
    if (table.status === 'occupied' && table.currentOrderId) {
      // Find the existing order for this table
      const existingOrder = orders.find(order => order.id === table.currentOrderId);
      if (existingOrder) {
        // Pre-populate the form with existing order data
        setOrderStep(prev => ({
          ...prev,
          selectedTable: table,
          clientType: existingOrder.creditClientId ? 'credit' : 'anonymous',
          selectedClient: existingOrder.creditClientId ? creditClients.find(c => c.id === existingOrder.creditClientId) || null : null,
          anonymousName: existingOrder.customerName || '',
          orderItems: existingOrder.items.map(item => ({
            product: item.product,
            quantity: item.quantity
          })),
          notes: existingOrder.notes || '',
          step: 'products'
        }));
        return;
      }
    }

    // For free tables, start normal process
    setOrderStep(prev => ({
      ...prev,
      selectedTable: table,
      step: 'client'
    }));
  };

  const handleClientSelection = (type: 'anonymous' | 'credit', client?: CreditClient, name?: string) => {
    setOrderStep(prev => ({
      ...prev,
      clientType: type,
      selectedClient: client || null,
      anonymousName: name || '',
      step: 'products'
    }));
  };

  const handleClientCreated = (client: CreditClient) => {
    queryClient.invalidateQueries({ queryKey: ["/api/credit-clients"] });
    handleClientSelection('credit', client);
  };

  const handleProductAdd = (product: Product) => {
    setOrderStep(prev => {
      const existingItem = prev.orderItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return {
          ...prev,
          orderItems: prev.orderItems.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        return {
          ...prev,
          orderItems: [...prev.orderItems, { product, quantity: 1 }]
        };
      }
    });
  };

  const handleProductRemove = (productId: number) => {
    setOrderStep(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter(item => item.product.id !== productId)
    }));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleProductRemove(productId);
      return;
    }

    setOrderStep(prev => ({
      ...prev,
      orderItems: prev.orderItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    }));
  };

  const calculateTotal = () => {
    return orderStep.orderItems.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (!orderStep.selectedTable || !orderStep.clientType || orderStep.orderItems.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, complete todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Check if this table has an existing order
    const existingOrder = orders.find(order => order.id === orderStep.selectedTable?.currentOrderId);
    
    if (existingOrder) {
      // Find new items (not in existing order)
      const existingProductIds = existingOrder.items.map(item => item.product.id);
      const newItems = orderStep.orderItems.filter(item => !existingProductIds.includes(item.product.id));
      
      if (newItems.length > 0) {
        // Add new items to existing order
        const itemsToAdd = newItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }));
        
        addItemsToOrderMutation.mutate({ 
          orderId: existingOrder.id, 
          items: itemsToAdd 
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhum item novo para adicionar",
          variant: "default",
        });
      }
    } else {
      // Create new order
      const orderData = {
        tableId: orderStep.selectedTable.id,
        creditClientId: orderStep.clientType === 'credit' ? orderStep.selectedClient?.id : null,
        customerName: orderStep.clientType === 'anonymous' ? orderStep.anonymousName : null,
        totalAmount: calculateTotal(),
        notes: orderStep.notes,
        items: orderStep.orderItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }))
      };

      createOrderMutation.mutate(orderData);
    }
  };

  const getLocationName = (location: string) => {
    switch (location) {
      case 'main_hall':
        return 'Sala Principal';
      case 'balcony':
        return 'Varanda';
      case 'terrace':
        return 'Esplanada';
      default:
        return location;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "preparing":
        return "bg-blue-500";
      case "ready":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "preparing":
        return "Preparando";
      case "ready":
        return "Pronto";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const groupTablesByLocation = (tables: Table[]) => {
    const grouped = tables.reduce((acc, table) => {
      if (!acc[table.location]) {
        acc[table.location] = [];
      }
      acc[table.location].push(table);
      return acc;
    }, {} as Record<string, Table[]>);

    // Sort tables by number within each location
    Object.keys(grouped).forEach(location => {
      grouped[location].sort((a, b) => a.number - b.number);
    });

    return grouped;
  };

  const groupProductsByCategory = (products: Product[]) => {
    const grouped = products.reduce((acc, product) => {
      const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Outros';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return grouped;
  };

  if (tablesLoading || productsLoading || ordersLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Sistema de Pedidos</h2>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-800 rounded mb-4"></div>
          <div className="h-32 bg-gray-800 rounded mb-4"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Sistema de Pedidos</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Pedido</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <div className={`flex items-center space-x-2 ${orderStep.step === 'table' ? 'text-orange-400' : orderStep.selectedTable ? 'text-green-400' : 'text-gray-400'}`}>
                    <TableIcon className="w-5 h-5" />
                    <span>Mesa</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${orderStep.step === 'client' ? 'text-orange-400' : orderStep.clientType ? 'text-green-400' : 'text-gray-400'}`}>
                    <User className="w-5 h-5" />
                    <span>Cliente</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${orderStep.step === 'products' ? 'text-orange-400' : orderStep.orderItems.length > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Produtos</span>
                  </div>
                </div>
                <Button
                  onClick={resetOrder}
                  variant="outline"
                  size="sm"
                  className="text-gray-400 border-gray-600 hover:bg-gray-700"
                >
                  Reiniciar
                </Button>
              </div>

              {/* Step 1: Table Selection */}
              {orderStep.step === 'table' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Selecionar Mesa</h3>
                  
                  {Object.entries(groupTablesByLocation(tables)).map(([location, locationTables]) => (
                    <div key={location} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-orange-400" />
                        <h4 className="font-medium text-white">{getLocationName(location)}</h4>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {locationTables.map((table) => (
                          <Button
                            key={table.id}
                            onClick={() => handleTableSelection(table)}
                            variant={table.status === 'free' ? 'outline' : 'secondary'}
                            className={`h-16 flex-col ${
                              table.status === 'free' 
                                ? 'border-green-500 text-green-400 hover:bg-green-500/20' 
                                : 'border-red-500 text-red-400 cursor-not-allowed'
                            }`}
                            disabled={table.status !== 'free'}
                          >
                            <span className="font-bold">{table.number}</span>
                            <span className="text-xs">{table.capacity}p</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: Client Selection */}
              {orderStep.step === 'client' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Selecionar Cliente - Mesa {orderStep.selectedTable?.number} ({getLocationName(orderStep.selectedTable?.location || '')})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Anonymous Client */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <User className="w-5 h-5 mr-2" />
                          Cliente Anônimo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          placeholder="Nome do cliente (opcional)"
                          value={orderStep.anonymousName}
                          onChange={(e) => setOrderStep(prev => ({...prev, anonymousName: e.target.value}))}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <Button
                          onClick={() => handleClientSelection('anonymous', undefined, orderStep.anonymousName)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Continuar como Anônimo
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Credit Client */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <UserPlus className="w-5 h-5 mr-2" />
                          Cliente de Crédito
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Select 
                          onValueChange={(value) => {
                            const client = creditClients.find(c => c.id === parseInt(value));
                            if (client) {
                              handleClientSelection('credit', client);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecionar cliente" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {creditClients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()} className="text-white">
                                {client.name} - {formatCurrency(client.totalCredit)} crédito
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          onClick={() => setShowNewClientModal(true)}
                          variant="outline"
                          className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/20"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Novo Cliente
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 3: Products Selection */}
              {orderStep.step === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">
                      Adicionar Produtos - Mesa {orderStep.selectedTable?.number}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Cliente: {orderStep.clientType === 'credit' ? orderStep.selectedClient?.name : (orderStep.anonymousName || 'Anônimo')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Products List */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-white">Produtos Disponíveis</h4>
                      <div className="max-h-96 overflow-y-auto">
                        {Object.entries(groupProductsByCategory(products)).map(([categoryName, categoryProducts]) => (
                          <div key={categoryName} className="mb-4">
                            <h5 className="font-medium text-orange-400 mb-2">{categoryName}</h5>
                            <div className="space-y-2">
                              {categoryProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="font-medium text-white">{product.name}</div>
                                      <div className={`px-2 py-1 rounded text-xs ${
                                        product.stockQuantity <= product.minStockLevel 
                                          ? 'bg-red-500 text-white' 
                                          : product.stockQuantity <= product.minStockLevel * 2
                                          ? 'bg-orange-500 text-white'
                                          : 'bg-green-500 text-white'
                                      }`}>
                                        {product.stockQuantity} em estoque
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-400">{formatCurrency(product.price)}</div>
                                  </div>
                                  <Button
                                    onClick={() => handleProductAdd(product)}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700"
                                    disabled={product.stockQuantity <= 0}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-white">Resumo do Pedido</h4>
                      <div className="bg-gray-700 rounded-lg p-4">
                        {orderStep.orderItems.length === 0 ? (
                          <p className="text-gray-400 text-center py-8">Nenhum produto adicionado</p>
                        ) : (
                          <div className="space-y-3">
                            {orderStep.orderItems.map((item) => (
                              <div key={item.product.id} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-white">{item.product.name}</div>
                                  <div className="text-sm text-gray-400">{formatCurrency(item.product.price)} cada</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="text-white min-w-[2rem] text-center">{item.quantity}</span>
                                  <Button
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleProductRemove(item.product.id)}
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 w-8 p-0"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <div className="border-t border-gray-600 pt-3">
                              <div className="flex justify-between items-center font-bold text-white">
                                <span>Total:</span>
                                <span>{formatCurrency(calculateTotal())}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white">Observações</Label>
                        <Textarea
                          value={orderStep.notes}
                          onChange={(e) => setOrderStep(prev => ({...prev, notes: e.target.value}))}
                          placeholder="Observações adicionais..."
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>

                      <Button
                        onClick={handleSubmitOrder}
                        disabled={orderStep.orderItems.length === 0 || createOrderMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {createOrderMutation.isPending ? 'Criando...' : 'Criar Pedido'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Orders */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Pedidos Ativos</h3>
        {orders.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum pedido ativo</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">
                        Mesa {order.table?.number} - {getLocationName(order.table?.location || '')}
                      </CardTitle>
                      <p className="text-sm text-gray-400">
                        {order.customerName || order.creditClient?.name || 'Cliente anônimo'}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.quantity}x {item.product.name}</span>
                        <span className="text-gray-300">{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-600">
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(order.createdAt).toLocaleTimeString('pt-PT', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="font-semibold text-white">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      <NewClientModal
        open={showNewClientModal}
        onOpenChange={setShowNewClientModal}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}