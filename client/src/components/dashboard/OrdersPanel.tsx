import { useQuery } from "@tanstack/react-query";
import { useBarStore } from "@/store/useBarStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderWithItems } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

export function OrdersPanel() {
  const { setSelectedOrder, setShowPaymentModal } = useBarStore();

  const { data: pendingOrders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders/pending"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Ensure pendingOrders is always an array
  const orders = pendingOrders || [];

  const handlePayment = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Commandes en Attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-700 p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Commandes en Attente</CardTitle>
          <Badge variant="secondary" className="bg-orange-500 text-white">
            {orders.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Aucune commande en attente</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-orange-500 text-white">
                      Table {order.table?.number || "N/A"}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      Serveur: {order.server?.firstName || "N/A"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatTime(order.createdAt!)}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-300">
                        {item.quantity}x {item.product.name}
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">
                          {formatCurrency(item.unitPrice)} cada
                        </span>
                        <br />
                        <span className="text-white">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-600">
                  <span className="font-medium text-white">Total: {formatCurrency(order.totalAmount)}</span>
                  <Button
                    onClick={() => handlePayment(order)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Encaisser
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
