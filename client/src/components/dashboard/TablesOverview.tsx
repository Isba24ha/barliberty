import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@shared/schema";

export function TablesOverview() {
  const { data: tables, isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    refetchInterval: 5000,
  });

  // Ensure tables is always an array
  const tablesList = tables || [];

  const getTableStatusColor = (status: string) => {
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

  const getTableStatusText = (status: string) => {
    switch (status) {
      case "occupied":
        return "Occupé";
      case "free":
        return "Libre";
      case "reserved":
        return "Réservé";
      default:
        return "Inconnu";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">État des Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-gray-700 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-full"></div>
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
        <CardTitle className="text-lg text-white">État des Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {tablesList.map((table) => (
            <div
              key={table.id}
              className="bg-gray-700 p-3 rounded-lg text-center cursor-pointer hover:bg-gray-600 transition-colors"
            >
              <div
                className={`w-8 h-8 ${getTableStatusColor(table.status)} mx-auto mb-2 rounded-full flex items-center justify-center`}
              >
                <span className="text-white text-sm font-medium">{table.number}</span>
              </div>
              <p className="text-xs text-gray-400">{table.capacity} pers.</p>
              <p className="text-xs text-gray-300">{getTableStatusText(table.status)}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Occupé</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Libre</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Réservé</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
