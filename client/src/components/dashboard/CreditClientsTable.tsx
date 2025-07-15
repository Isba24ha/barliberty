import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { CreditClient } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

export function CreditClientsTable() {
  const { data: creditClients, isLoading } = useQuery<CreditClient[]>({
    queryKey: ["/api/credit-clients"],
    refetchInterval: 10000,
  });

  // Ensure creditClients is always an array
  const clients = creditClients || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Crédits Clients Actifs</CardTitle>
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
          <CardTitle className="text-lg text-white">Crédits Clients Actifs</CardTitle>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 text-gray-400">Client</th>
                <th className="text-left py-3 text-gray-400">Crédit Total</th>
                <th className="text-left py-3 text-gray-400">Dernière Mise à Jour</th>
                <th className="text-left py-3 text-gray-400">Statut</th>
                <th className="text-left py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Aucun client à crédit
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-600">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-white">{client.name}</div>
                        <div className="text-gray-400 text-xs">
                          Client depuis {formatDate(client.createdAt!)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-orange-400 font-medium">{formatCurrency(client.totalCredit)}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-gray-400">{formatDate(client.updatedAt!)}</span>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={client.isActive ? "default" : "secondary"}
                        className={client.isActive ? "bg-orange-500" : "bg-gray-500"}
                      >
                        {client.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
