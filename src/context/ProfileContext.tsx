import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile, type UserProfile } from "@/services/profileService";
import { getErrorMessage } from "@/utils/error";

interface ProfileContextValue {
  nickname: string | null;
  avatarUrl: string | null;
  loading: boolean;
  error: string | null;
  setLocalProfile: (profile: UserProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setLocalProfile = useCallback((next: UserProfile) => {
    setProfile(next);
    setError(null);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        nickname: profile?.nickname ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        loading,
        error,
        setLocalProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return value;
}
