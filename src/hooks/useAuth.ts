import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UseAuthOptions {
  /** Called when Supabase fires a SIGNED_IN auth state change. */
  onSignIn?: () => void;
  /** Called after checking the initial session (whether or not it exists). */
  onSessionChecked?: (hasSession: boolean) => void;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (token: string, uid: string, email?: string) => void;
  logout: () => Promise<void>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to avoid stale closures in the auth listener
  const onSignInRef = useRef(options.onSignIn);
  const onSessionCheckedRef = useRef(options.onSessionChecked);
  onSignInRef.current = options.onSignIn;
  onSessionCheckedRef.current = options.onSessionChecked;

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
          onSessionCheckedRef.current?.(true);
        } else {
          setIsAuthenticated(false);
          onSessionCheckedRef.current?.(false);
        }
      } catch {
        setIsAuthenticated(false);
        onSessionCheckedRef.current?.(false);
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
        onSignInRef.current?.();
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const login = useCallback((token: string, uid: string, email?: string) => {
    setAccessToken(token);
    setUserId(uid);
    if (email) setUserEmail(email);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  return { isAuthenticated, accessToken, userId, userEmail, isLoading, login, logout };
}
