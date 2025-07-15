import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useLocation } from "wouter";

export function useAuthRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only handle redirection after auth state is stable
    if (!isLoading && isAuthenticated && user) {
      console.log("Auth redirect check:", { isAuthenticated, userRole: user?.role });
      
      // If authenticated and we're on login page, redirect to dashboard
      if (window.location.pathname === "/login") {
        console.log("Redirecting authenticated user from login page to dashboard");
        setLocation("/");
      }
      
      // Auto-open session modal for cashiers on dashboard
      if (user.role === "cashier" && window.location.pathname === "/") {
        console.log("Opening session modal for cashier");
        // Trigger session modal opening after a brief delay
        setTimeout(() => {
          const event = new CustomEvent("openSessionModal");
          window.dispatchEvent(event);
        }, 1000);
      }
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  return { isAuthenticated, user, isLoading };
}