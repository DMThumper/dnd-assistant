"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requiresVerification: boolean }>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasBackofficeAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      setAccessToken(null);
      return;
    }

    try {
      const response = await api.me();
      setUser(response.data.user);
      setAccessToken(token);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        api.setToken(null);
        setUser(null);
        setAccessToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const { user: userData } = response.data;

    setUser(userData);
    // Get the token that was just stored by api.login()
    setAccessToken(api.getToken());
    return { requiresVerification: false };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    await api.register(name, email, password, passwordConfirmation);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasBackofficeAccess = user?.backoffice_access ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
        hasAnyRole,
        hasBackofficeAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
