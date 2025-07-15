import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useAuthRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // Only handle redirection after auth state is stable
    if (!isLoading) {
      console.log("Auth redirect check:", { isAuthenticated, userRole: user?.role });
      
      // If authenticated and we're on login page, redirect to dashboard
      if (isAuthenticated && window.location.pathname === "/login") {
        console.log("Redirecting authenticated user from login page to dashboard");
        window.location.href = "/";
      }
    }
  }, [isAuthenticated, user, isLoading]);

  return { isAuthenticated, user, isLoading };
}