import { useBarStore } from "@/store/useBarStore";

export function RoleIndicator() {
  const { currentUser } = useBarStore();

  if (!currentUser) return null;

  const getRoleColor = (role: string) => {
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

  return (
    <div
      className={`fixed top-0 left-0 w-1 h-full z-50 ${getRoleColor(currentUser.role)}`}
    />
  );
}
