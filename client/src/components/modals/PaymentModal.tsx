import { useState } from "react";
import { useBarStore } from "@/store/useBarStore";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Banknote, FileText, X, Smartphone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import type { CreditClient } from "@shared/schema";

export function PaymentModal() {
  const { selectedOrder, showPaymentModal, setShowPaymentModal, setSelectedOrder } = useBarStore();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "credit">("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCreditClient, setSelectedCreditClient] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch credit clients
  const { data: creditClients = [] } = useQuery<CreditClient[]>({
    queryKey: ["/api/credit-clients"],
  });

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest("POST", "/api/payments", paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pagamento processado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-clients"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    setPaymentMethod("cash");
    setReceivedAmount("");
    setPhoneNumber("");
    setSelectedCreditClient(null);
  };

  const handlePayment = () => {
    if (!selectedOrder) return;

    // Validation based on payment method
    if (paymentMethod === "cash" && (!receivedAmount || parseFloat(receivedAmount) < parseFloat(selectedOrder.totalAmount))) {
      toast({
        title: "Erro",
        description: "Valor recebido deve ser maior ou igual ao total",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "mobile_money" && !phoneNumber) {
      toast({
        title: "Erro",
        description: "Por favor, insira o número de telefone",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "credit" && !selectedCreditClient) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um cliente de crédito",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      orderId: selectedOrder.id,
      method: paymentMethod,
      amount: selectedOrder.totalAmount,
      receivedAmount: paymentMethod === "cash" ? parseFloat(receivedAmount) : null,
      creditClientId: paymentMethod === "credit" ? selectedCreditClient : null,
      phoneNumber: paymentMethod === "mobile_money" ? phoneNumber : null,
    };

    paymentMutation.mutate(paymentData);
  };

  const calculateChange = () => {
    if (!selectedOrder || !receivedAmount) return 0;
    return Math.max(0, parseFloat(receivedAmount) - parseFloat(selectedOrder.totalAmount));
  };

  if (!selectedOrder) return null;

  return (
    <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Processamento de Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Mesa {selectedOrder.table?.number || "N/A"}</span>
                <span className="text-green-400 font-bold">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
              <div className="text-sm text-gray-400">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>{formatCurrency(parseFloat(item.unitPrice) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => setPaymentMethod("cash")}
              variant={paymentMethod === "cash" ? "default" : "outline"}
              className={`py-6 flex-col ${
                paymentMethod === "cash"
                  ? "bg-green-600 hover:bg-green-700"
                  : "border-gray-600 hover:bg-gray-700"
              }`}
            >
              <Banknote className="w-6 h-6 mb-1" />
              <span className="text-sm">Dinheiro</span>
            </Button>
            <Button
              onClick={() => setPaymentMethod("mobile_money")}
              variant={paymentMethod === "mobile_money" ? "default" : "outline"}
              className={`py-6 flex-col ${
                paymentMethod === "mobile_money"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-gray-600 hover:bg-gray-700"
              }`}
            >
              <Smartphone className="w-6 h-6 mb-1" />
              <span className="text-sm">Mobile Money</span>
            </Button>
            <Button
              onClick={() => setPaymentMethod("credit")}
              variant={paymentMethod === "credit" ? "default" : "outline"}
              className={`py-6 flex-col ${
                paymentMethod === "credit"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "border-gray-600 hover:bg-gray-700"
              }`}
            >
              <Users className="w-6 h-6 mb-1" />
              <span className="text-sm">Crédito</span>
            </Button>
          </div>

          {/* Payment Method Forms */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="received" className="text-sm font-medium">
                Valor Recebido
              </Label>
              <Input
                id="received"
                type="number"
                step="0.01"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder={selectedOrder.totalAmount}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {receivedAmount && (
                <p className="text-sm text-gray-400">
                  Troco: {formatCurrency(calculateChange())}
                </p>
              )}
            </div>
          )}

          {paymentMethod === "mobile_money" && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Número de Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: +245 123 456 789"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-sm text-gray-400">
                Total: {formatCurrency(selectedOrder.totalAmount)}
              </p>
            </div>
          )}

          {paymentMethod === "credit" && (
            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">
                Cliente de Crédito
              </Label>
              <Select value={selectedCreditClient?.toString()} onValueChange={(value) => setSelectedCreditClient(parseInt(value))}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {creditClients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="text-white">
                      {client.name} - {formatCurrency(client.totalCredit)} crédito
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCreditClient && (
                <p className="text-sm text-gray-400">
                  Será adicionado ao crédito: {formatCurrency(selectedOrder.totalAmount)}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {paymentMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}