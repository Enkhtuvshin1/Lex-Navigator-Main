import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProfile, type UserPublic } from "@/lib/api";

interface AuthContextType {
  user: UserPublic | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: UserPublic) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    getProfile()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("access_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setAuth = (newToken: string, newUser: UserPublic) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
