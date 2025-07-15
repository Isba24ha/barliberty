import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always check auth status
    gcTime: 0, // Don't cache auth data
  });

  // Debug logging to track auth state changes
  console.log("Auth state:", { user, isLoading, isAuthenticated: !!user });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
