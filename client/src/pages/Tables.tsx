import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, OrderWithItems } from "@shared/schema";
import { Plus, Users, Clock, ShoppingCart, Receipt, Edit } from "lucide-react";
import { PT } from "@/lib/i18n";
import { useState } from "react";
import { formatCurrency } from "@/lib/currency";

export default function Tables() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  const { data: tables, isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    refetchInterval: 5000,
  });

  const { data: orders } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders/pending"],
    refetchInterval: 5000,
  });

  // Ensure arrays are always defined
  const tablesList = tables || [];
  const ordersList = orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-500";
      case "free":
        return "bg-green-500";
      case "reserved":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied":
        return PT.tables.occupied;
      case "free":
        return PT.tables.free;
      case "reserved":
        return PT.tables.reserved;
      default:
        return status;
    }
  };

  const occupiedTables = tablesList.filter(t => t.status === "occupied").length;
  const freeTables = tablesList.filter(t => t.status === "free").length;
  const reservedTables = tablesList.filter(t => t.status === "reserved").length;

  const getTableOrder = (tableId: number): OrderWithItems | undefined => {
    return ordersList.find(order => order.tableId === tableId && order.status === "pending");
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

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{PT.tables.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-600 rounded-full w-16 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2 mx-auto"></div>
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
        <h2 className="text-2xl font-bold text-white">Gestion des Tables</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => window.location.href = '/orders'} 
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nouveau Pedido
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{tablesList.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Occupées</p>
                <p className="text-2xl font-bold text-red-400">{occupiedTables}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Libres</p>
                <p className="text-2xl font-bold text-green-400">{freeTables}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Réservées</p>
                <p className="text-2xl font-bold text-yellow-400">{reservedTables}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables by Location */}
      {Object.entries(groupTablesByLocation(tablesList)).map(([location, locationTables]) => (
        <div key={location} className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-orange-400" />
            {getLocationName(location)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locationTables.map((table) => {
              const tableOrder = getTableOrder(table.id);
              const hasPendingOrder = tableOrder !== undefined;
              
              return (
                <Card key={table.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">
                        Table {table.number}
                      </CardTitle>
                      <Badge className={`${getStatusColor(table.status)} text-white`}>
                        {getStatusText(table.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                          table.status === 'free' 
                            ? 'bg-green-500 text-white' 
                            : hasPendingOrder
                            ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {table.number}
                          {hasPendingOrder && <span className="text-xs ml-1">+</span>}
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-400">
                          Capacité: {table.capacity} personnes
                        </p>
                        <p className="text-sm text-gray-400">
                          {getLocationName(table.location)}
                        </p>
                      </div>

                      {/* Order Information */}
                      {tableOrder && (
                        <div className="bg-gray-700 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Client:</span>
                            <span className="text-sm text-white">
                              {tableOrder.clientName || tableOrder.creditClient?.name || 'Anônimo'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Total:</span>
                            <span className="text-sm text-green-400 font-bold">
                              {formatCurrency(tableOrder.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Itens:</span>
                            <span className="text-sm text-white">
                              {tableOrder.items.length} produtos
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {table.status === 'free' ? (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => window.location.href = `/orders?table=${table.id}`}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Novo Pedido
                          </Button>
                        ) : hasPendingOrder ? (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-600/20"
                                >
                                  <Receipt className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-800 border-gray-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white">
                                    Commande Table {table.number}
                                  </DialogTitle>
                                </DialogHeader>
                                {tableOrder && (
                                  <div className="space-y-4">
                                    <div className="bg-gray-700 rounded-lg p-4">
                                      <h4 className="font-medium text-white mb-2">Détails de la commande</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Client:</span>
                                          <span className="text-white">{tableOrder.clientName || tableOrder.creditClient?.name || 'Anônimo'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Serveur:</span>
                                          <span className="text-white">{tableOrder.server?.firstName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Total:</span>
                                          <span className="text-green-400 font-bold">{formatCurrency(tableOrder.totalAmount)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-700 rounded-lg p-4">
                                      <h4 className="font-medium text-white mb-2">Articles ({tableOrder.items.length})</h4>
                                      <div className="space-y-2">
                                        {tableOrder.items.map((item, index) => (
                                          <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-300">
                                              {item.quantity}x {item.product.name}
                                            </span>
                                            <span className="text-white">{formatCurrency(item.totalPrice)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-orange-600 hover:bg-orange-700"
                              onClick={() => window.location.href = `/orders?table=${table.id}`}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Ajouter
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 border-gray-600 hover:bg-gray-700"
                            disabled
                          >
                            Table occupée
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
