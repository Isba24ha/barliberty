import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditClient } from "@shared/schema";
import { Plus, Search, DollarSign, Calendar, User, CreditCard, Banknote, Smartphone, Minus } from "lucide-react";
import { useState } from "react";
import { PT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Credits() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<CreditClient | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money">("cash");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  const { data: creditClients = [], isLoading } = useQuery<CreditClient[]>({
    queryKey: ["/api/credit-clients"],
    refetchInterval: 10000,
  });

  const filteredClients = creditClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCredit = creditClients.reduce((sum, client) => sum + parseFloat(client.totalCredit), 0);
  const activeClients = creditClients.filter(client => client.isActive && parseFloat(client.totalCredit) > 0);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  // Credit payment mutation
  const creditPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      clientId: number;
      amount: string;
      method: string;
      phoneNumber?: string;
    }) => {
      return apiRequest("POST", "/api/credit-payments", paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pagamento de crédito processado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-clients"] });
      handleClosePaymentModal();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento",
        variant: "destructive",
      });
    },
  });

  const handleOpenPaymentModal = (client: CreditClient) => {
    setSelectedClient(client);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setSelectedClient(null);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPhoneNumber("");
    setShowPaymentModal(false);
  };

  const handlePayment = () => {
    if (!selectedClient || !paymentAmount) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    const clientCredit = parseFloat(selectedClient.totalCredit);

    if (amount <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (amount > clientCredit) {
      toast({
        title: "Erro",
        description: "Valor não pode ser maior que o crédito disponível",
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

    const paymentData = {
      clientId: selectedClient.id,
      amount: amount.toString(),
      method: paymentMethod,
      phoneNumber: paymentMethod === "mobile_money" ? phoneNumber : undefined,
    };

    creditPaymentMutation.mutate(paymentData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{PT.credits.title}</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
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
        <h2 className="text-2xl font-bold text-white">{PT.credits.title}</h2>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Créditos</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalCredit)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Clientes Ativos</p>
                <p className="text-2xl font-bold text-green-400">{activeClients.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Clientes</p>
                <p className="text-2xl font-bold text-white">{creditClients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">
                {searchTerm ? "Aucun client trouvé" : "Aucun client à crédit"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          {client.email && (
                            <span>{client.email}</span>
                          )}
                          {client.phone && (
                            <span>{client.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Crédit actuel</p>
                      <p className="text-xl font-bold text-orange-400">{formatCurrency(client.totalCredit)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-400">Limite</p>
                      <p className="text-sm text-white">{formatCurrency(client.creditLimit)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-400">Dernière mise à jour</p>
                      <p className="text-sm text-white">{formatDate(client.updatedAt!)}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={client.isActive ? "default" : "secondary"}
                        className={client.isActive ? "bg-green-500" : "bg-gray-500"}
                      >
                        {client.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleOpenPaymentModal(client)}
                        disabled={parseFloat(client.totalCredit) <= 0}
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        Paiement
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Historique
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Paiement de Crédit - {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Client Credit Info */}
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Crédit actuel</span>
                  <span className="text-xl font-bold text-orange-400">
                    {selectedClient && formatCurrency(selectedClient.totalCredit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Montant du paiement
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={selectedClient?.totalCredit}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>Max: {selectedClient && formatCurrency(selectedClient.totalCredit)}</span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-blue-400 hover:text-blue-300"
                  onClick={() => setPaymentAmount(selectedClient?.totalCredit || "0")}
                >
                  Montant total
                </Button>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Méthode de paiement</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setPaymentMethod("cash")}
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className={`py-6 flex-col ${
                    paymentMethod === "cash"
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-gray-600 hover:bg-gray-700"
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1" />
                  <span className="text-sm">Espèces</span>
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
                  <Smartphone className="w-5 h-5 mb-1" />
                  <span className="text-sm">Mobile Money</span>
                </Button>
              </div>
            </div>

            {/* Mobile Money Phone Number */}
            {paymentMethod === "mobile_money" && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+XXX XXX XXX XXX"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}

            {/* New Credit Balance Preview */}
            {paymentAmount && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Nouveau solde</span>
                    <span className="text-lg font-bold text-green-400">
                      {selectedClient && formatCurrency(
                        (parseFloat(selectedClient.totalCredit) - parseFloat(paymentAmount || "0")).toFixed(2)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleClosePaymentModal}
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                onClick={handlePayment}
                disabled={creditPaymentMutation.isPending || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {creditPaymentMutation.isPending ? "Traitement..." : "Confirmer Paiement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
