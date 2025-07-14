import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditClient } from "@shared/schema";
import { Plus, Search, Euro, Calendar, User } from "lucide-react";
import { useState } from "react";

export default function Credits() {
  const [searchTerm, setSearchTerm] = useState("");

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
    return new Date(date).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Crédits Clients</h2>
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
        <h2 className="text-2xl font-bold text-white">Crédits Clients</h2>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Crédits</p>
                <p className="text-2xl font-bold text-orange-400">€{totalCredit.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Euro className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Clients Actifs</p>
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
                <p className="text-sm text-gray-400">Total Clients</p>
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
            placeholder="Rechercher un client..."
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
                      <p className="text-xl font-bold text-orange-400">€{client.totalCredit}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-400">Limite</p>
                      <p className="text-sm text-white">€{client.creditLimit}</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
