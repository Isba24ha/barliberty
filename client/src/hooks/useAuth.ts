import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SessionData {
  user: User;
  timestamp: number;
  expiresAt: number;
}

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const SESSION_KEY = "liberty_session";

export function useAuth() {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  // Check localStorage session on mount
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const parsed: SessionData = JSON.parse(sessionData);
          const now = Date.now();
          
          if (now < parsed.expiresAt) {
            setIsSessionValid(true);
            setSessionUser(parsed.user);
            console.log("Valid session found in localStorage:", parsed.user.id);
            return;
          } else {
            console.log("Session expired, clearing localStorage");
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (error) {
          console.error("Error parsing session data:", error);
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setIsSessionValid(false);
      setSessionUser(null);
    };

    checkSession();
    
    // Check session validity every minute
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1 * 60 * 1000, // 1 minute for more responsive auth
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always validate with server to ensure session persistence
  });

  // Update localStorage when server auth succeeds
  useEffect(() => {
    if (user) {
      const sessionData: SessionData = {
        user,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setIsSessionValid(true);
      setSessionUser(user);
      console.log("Session stored in localStorage:", user.id);
    } else if (!isLoading && !user) {
      // Server returned 401, clear localStorage
      localStorage.removeItem(SESSION_KEY);
      setIsSessionValid(false);
      setSessionUser(null);
    }
  }, [user, isLoading]);

  const logout = async () => {
    console.log("Clearing session from localStorage");
    
    // Clear server session
    try {
      await apiRequest("POST", "/api/auth/logout");
      console.log("Server logout successful, clearing client state");
    } catch (error) {
      console.error("Server logout failed:", error);
    }
    
    // Clear client state
    localStorage.removeItem(SESSION_KEY);
    setIsSessionValid(false);
    setSessionUser(null);
    
    // Redirect to login page
    window.location.replace("/login");
  };

  const finalUser = user || sessionUser;
  const finalLoading = isLoading;

  console.log("Auth state:", { 
    user: finalUser?.id, 
    isLoading: finalLoading, 
    isAuthenticated: !!finalUser,
    sessionValid: isSessionValid
  });

  return {
    user: finalUser,
    isLoading: finalLoading,
    isAuthenticated: !!finalUser,
    refetch,
    logout,
  };
}
