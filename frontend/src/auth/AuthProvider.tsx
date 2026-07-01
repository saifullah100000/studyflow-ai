import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  message: string;
  user: AuthUser;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser =
    useCallback(async (): Promise<AuthUser | null> => {
      try {
        const response = await api.get<AuthUser>("/profile");
        return response.data;
      } catch {
        return null;
      }
    }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    const currentUser = await fetchCurrentUser();

    setUser(currentUser);
    setIsLoading(false);
  }, [fetchCurrentUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      setUser(response.data.user);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    void fetchCurrentUser().then((currentUser) => {
      if (!isActive) {
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [fetchCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}