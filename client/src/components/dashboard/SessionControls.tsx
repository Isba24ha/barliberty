import { useBarStore } from "@/store/useBarStore";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, AlertCircle } from "lucide-react";

export function SessionControls() {
  const { user } = useAuth();
  const { activeSession, setShowOpenSessionModal } = useBarStore();

  // Only show for cashiers
  if (user?.role !== "cashier") {
    return null;
  }

  return (
    <Card className="bg-gray-800 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Gestão de Sessão
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activeSession ? (
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-400" />
            <h3 className="text-lg font-medium text-white mb-2">
              Nenhuma sessão ativa
            </h3>
            <p className="text-gray-400 mb-4">
              Você precisa abrir uma sessão de caixa para começar a trabalhar
            </p>
            <Button
              onClick={() => setShowOpenSessionModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Abrir Nova Sessão
            </Button>
          </div>
        ) : (
          <div className="bg-green-500 bg-opacity-20 p-4 rounded-lg border border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-400">
                  Sessão Ativa
                </h3>
                <p className="text-sm text-gray-300">
                  {activeSession.shiftType === "morning" ? "Turno da Manhã" : "Turno da Tarde"}
                </p>
                <p className="text-xs text-gray-400">
                  Iniciada às {new Date(activeSession.startTime).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Em funcionamento</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}