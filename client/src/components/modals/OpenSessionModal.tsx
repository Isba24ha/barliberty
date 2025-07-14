import { useState } from "react";
import { useBarStore } from "@/store/useBarStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OpenSessionModal() {
  const { showOpenSessionModal, setShowOpenSessionModal, setActiveSession } = useBarStore();
  const [shiftType, setShiftType] = useState<"morning" | "evening">("morning");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const openSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sessions", { shiftType });
    },
    onSuccess: (data) => {
      toast({
        title: "Sessão Aberta",
        description: `Sessão ${shiftType === "morning" ? "da manhã" : "da tarde"} iniciada com sucesso`,
      });
      setActiveSession(data);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setShowOpenSessionModal(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao abrir sessão",
        variant: "destructive",
      });
    },
  });

  const handleOpenSession = () => {
    openSessionMutation.mutate();
  };

  // Auto-detect shift type based on current time
  const getCurrentShiftType = () => {
    const hour = new Date().getHours();
    return hour < 14 ? "morning" : "evening";
  };

  // Set default shift type based on current time
  useState(() => {
    setShiftType(getCurrentShiftType());
  });

  return (
    <Dialog open={showOpenSessionModal} onOpenChange={setShowOpenSessionModal}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center">
            <PlayCircle className="w-5 h-5 mr-2 text-green-400" />
            Abrir Nova Sessão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-300">
            Selecione o tipo de turno para iniciar uma nova sessão de caixa.
          </p>

          <div className="space-y-2">
            <Label htmlFor="shift-type" className="text-sm font-medium">
              Tipo de Turno
            </Label>
            <Select value={shiftType} onValueChange={(value: "morning" | "evening") => setShiftType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecionar turno" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="morning" className="text-white">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Manhã (06:00 - 14:00)
                  </div>
                </SelectItem>
                <SelectItem value="evening" className="text-white">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Tarde (14:00 - 22:00)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-2">Informações da Sessão</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Turno:</span>
                  <span className="text-white">
                    {shiftType === "morning" ? "Manhã" : "Tarde"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Início:</span>
                  <span className="text-white">
                    {new Date().toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data:</span>
                  <span className="text-white">
                    {new Date().toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowOpenSessionModal(false)}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOpenSession}
              disabled={openSessionMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {openSessionMutation.isPending ? "Abrindo..." : "Abrir Sessão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}