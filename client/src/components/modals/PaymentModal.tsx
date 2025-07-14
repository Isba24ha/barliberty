import { useState } from "react";
import { useBarStore } from "@/store/useBarStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Banknote, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PaymentModal() {
  const { selectedOrder, showPaymentModal, setShowPaymentModal, setSelectedOrder } = useBarStore();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest("POST", "/api/payments", paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Paiement réussi",
        description: "Le paiement a été traité avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement du paiement",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    setPaymentMethod("cash");
    setReceivedAmount("");
  };

  const handlePayment = () => {
    if (!selectedOrder) return;

    const paymentData = {
      orderId: selectedOrder.id,
      method: paymentMethod,
      amount: selectedOrder.totalAmount,
      receivedAmount: receivedAmount ? parseFloat(receivedAmount) : undefined,
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
          <DialogTitle className="text-lg font-semibold">Traitement du Paiement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Table {selectedOrder.table?.number || "N/A"}</span>
                <span className="text-green-400 font-bold">€{selectedOrder.totalAmount}</span>
              </div>
              <div className="text-sm text-gray-400">
                {selectedOrder.items.map((item) => (
                  <div key={item.id}>
                    {item.quantity}x {item.product.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
              <span className="text-sm">Espèces</span>
            </Button>
            <Button
              onClick={() => setPaymentMethod("card")}
              variant={paymentMethod === "card" ? "default" : "outline"}
              className={`py-6 flex-col ${
                paymentMethod === "card"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-gray-600 hover:bg-gray-700"
              }`}
            >
              <CreditCard className="w-6 h-6 mb-1" />
              <span className="text-sm">Carte</span>
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
              <FileText className="w-6 h-6 mb-1" />
              <span className="text-sm">Crédit</span>
            </Button>
          </div>

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="received" className="text-sm font-medium">
                Montant reçu (€)
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
                  Rendu: €{calculateChange().toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {paymentMutation.isPending ? "Traitement..." : "Valider"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
