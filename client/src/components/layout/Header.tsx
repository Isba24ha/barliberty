import { useBarStore } from "@/store/useBarStore";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";

export function Header() {
  const { currentUser, activeSession, setShowSessionModal } = useBarStore();
  const [, setLocation] = useLocation();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "cashier":
        return "bg-blue-600";
      case "server":
        return "bg-green-600";
      case "manager":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to login page
      setLocation("/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Force redirect even on error
      setLocation("/login");
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Logo size="sm" />
          {currentUser && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role === "cashier" && "Caixa"}
              {currentUser.role === "server" && "Empregado"}
              {currentUser.role === "manager" && "Gerente"}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Session Info */}
          {activeSession && (
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-white">
                  Sessão: {activeSession.shiftType === "morning" ? "Manhã" : "Tarde"}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(activeSession.startTime)} - Em andamento
                </span>
              </div>
            </div>
          )}

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser?.profileImageUrl} />
              <AvatarFallback className="bg-blue-600 text-white">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-white">
                {currentUser?.firstName} {currentUser?.lastName}
              </div>
              <div className="text-xs text-gray-400">
                {currentUser?.role === "cashier" && "Caissière"}
                {currentUser?.role === "server" && "Serveur"}
                {currentUser?.role === "manager" && "Gérant"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
