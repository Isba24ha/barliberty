import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useEffect, useState } from "react";

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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    enabled: !isSessionValid, // Only fetch if no valid session
  });

  // Update localStorage when server auth succeeds
  useEffect(() => {
    if (user && !isSessionValid) {
      const sessionData: SessionData = {
        user,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setIsSessionValid(true);
      setSessionUser(user);
      console.log("Session stored in localStorage:", user.id);
    }
  }, [user, isSessionValid]);

  const logout = () => {
    console.log("Clearing session from localStorage");
    localStorage.removeItem(SESSION_KEY);
    setIsSessionValid(false);
    setSessionUser(null);
  };

  const finalUser = isSessionValid ? sessionUser : user;
  const finalLoading = isSessionValid ? false : isLoading;

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
