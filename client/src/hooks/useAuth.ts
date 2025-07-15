import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always check auth status
  });

  // Remove debug logging for production
  // console.log("Auth state:", { user, isLoading, isAuthenticated: !!user });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
