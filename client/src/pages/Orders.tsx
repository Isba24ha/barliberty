import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderWithItems } from "@shared/schema";
import { Clock, User, Table as TableIcon } from "lucide-react";
import { PT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

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
        return PT.orders.pending;
      case "preparing":
        return PT.orders.preparing;
      case "ready":
        return PT.orders.ready;
      case "completed":
        return PT.orders.completed;
      case "cancelled":
        return PT.orders.cancelled;
      default:
        return status;
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{PT.orders.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-600 rounded"></div>
                  </div>
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
        <h2 className="text-2xl font-bold text-white">{PT.orders.title}</h2>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-gray-700">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Nenhum pedido encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    {PT.orders.orderNumber} #{order.id}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <TableIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Mesa {order.table?.number || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{formatTime(order.createdAt!)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      {order.server?.firstName} {order.server?.lastName}
                    </span>
                  </div>

                  <div className="border-t border-gray-600 pt-3">
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="text-white">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-600 pt-3 flex justify-between items-center">
                    <span className="font-medium text-white">{PT.common.total}: {formatCurrency(order.totalAmount)}</span>
                    <div className="flex space-x-2">
                      {order.status === "pending" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Preparar
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Servir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
