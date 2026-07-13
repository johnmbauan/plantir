import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import supabase from "@/supabase";
import { captureInviteCallbackFromUrl } from "@/pages/password/password-helper";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, loading: true });

async function resolveAuthState(): Promise<{ session: Session | null; user: User | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { session: null, user: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  const resolvedUser = error ? session.user : user;

  return { session, user: resolvedUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    captureInviteCallbackFromUrl();

    resolveAuthState().then(({ session: nextSession, user: nextUser }) => {
      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      const { session: nextSession, user: nextUser } = await resolveAuthState();
      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);
    });

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
