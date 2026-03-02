import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UseAuthReturn {
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (token: string, uid: string, email?: string) => void;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.access_token && session?.user?.id) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? null);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === "SIGNED_IN" && session) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        setIsAuthenticated(true);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const login = (token: string, uid: string, email?: string) => {
    setAccessToken(token);
    setUserId(uid);
    if (email) setUserEmail(email);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setAccessToken(null);
      setUserId(null);
      setUserEmail(null);
      await createClient().auth.signOut();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return { isAuthenticated, accessToken, userId, userEmail, isLoading, login, logout };
}
