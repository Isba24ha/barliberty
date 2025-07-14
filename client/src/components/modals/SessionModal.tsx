import { useBarStore } from "@/store/useBarStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SessionModal() {
  const { activeSession, sessionStats, showSessionModal, setShowSessionModal } = useBarStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No active session");
      return apiRequest("POST", `/api/sessions/${activeSession.id}/end`, {});
    },
    onSuccess: () => {
      toast({
        title: "Session fermée",
        description: "La session a été fermée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setShowSessionModal(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la fermeture de la session",
        variant: "destructive",
      });
    },
  });

  const handleEndSession = () => {
    endSessionMutation.mutate();
  };

  if (!activeSession) return null;

  return (
    <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
            Fermer la Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-300">
            Êtes-vous sûr de vouloir fermer la session actuelle ? Cette action ne peut pas être annulée.
          </p>

          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3">Résumé de la Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">
                    {activeSession.shiftType === "morning" ? "Matin" : "Soir"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Début:</span>
                  <span className="text-white">
                    {new Date(activeSession.startTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ventes totales:</span>
                  <span className="text-green-400">€{sessionStats?.totalSales || "0.00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Nombre de transactions:</span>
                  <span className="text-white">{sessionStats?.transactionCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowSessionModal(false)}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {endSessionMutation.isPending ? "Fermeture..." : "Fermer Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
