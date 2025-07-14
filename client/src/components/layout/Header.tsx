import { useBarStore } from "@/store/useBarStore";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { currentUser, activeSession, setShowSessionModal } = useBarStore();

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
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🍺</div>
            <h1 className="text-xl font-bold text-white">BarManager Pro</h1>
          </div>
          {currentUser && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role === "cashier" && "Caissier"}
              {currentUser.role === "server" && "Serveur"}
              {currentUser.role === "manager" && "Gérant"}
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
                  Session: {activeSession.shiftType === "morning" ? "Matin" : "Soir"}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(activeSession.startTime)} - En cours
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
