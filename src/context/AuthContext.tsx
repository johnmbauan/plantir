import { createContext, useContext, useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import supabase from "@/supabase";
import {
  captureInviteCallbackFromUrl,
  clearPendingPasswordSetup,
} from "@/pages/password/password-helper";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    captureInviteCallbackFromUrl();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession: Session | null) => {
        if (event === "SIGNED_OUT" || !nextSession) {
          clearPendingPasswordSetup();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);

        // One server verification on first session restore. Later events
        // (TOKEN_REFRESHED, SIGNED_IN, …) already carry a trusted session user.
        if (event === "INITIAL_SESSION") {
          void supabase.auth.getUser().then(({ data: { user: freshUser }, error }) => {
            if (error || !freshUser) return;
            setUser(freshUser);
          });
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
