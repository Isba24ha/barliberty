import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@shared/schema";
import { Plus, Users, Clock } from "lucide-react";
import { PT } from "@/lib/i18n";

export default function Tables() {
  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    refetchInterval: 5000,
  });

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

  const occupiedTables = tables.filter(t => t.status === "occupied").length;
  const freeTables = tables.filter(t => t.status === "free").length;
  const reservedTables = tables.filter(t => t.status === "reserved").length;

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
        <h2 className="text-2xl font-bold text-white">Tables</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Table
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{tables.length}</p>
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

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card key={table.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">
                  Table {table.number}
                </CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {getStatusText(table.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getStatusColor(table.status)}`}>
                    {table.number}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Capacité: {table.capacity} personnes
                  </p>
                </div>

                {table.status === "occupied" && (
                  <div className="text-center">
                    <p className="text-sm text-green-400">
                      Commande en cours
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1 border-gray-600 hover:bg-gray-700">
                    Détails
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {table.status === "free" ? "Occuper" : "Libérer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
