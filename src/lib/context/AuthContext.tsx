"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthToken, getAuthToken, apiFetch } from "@/lib/api/client";

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  restaurantId: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage on mount
    try {
      const storedToken = localStorage.getItem("chotu_auth_token");
      const storedUser = localStorage.getItem("chotu_user_session");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setAuthToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Default demo session for immediate exploration
        const demoSession: UserSession = {
          userId: "user-mgr-01",
          email: "manager@spicejunction.in",
          fullName: "Rahul Sharma (Manager)",
          role: "manager",
          restaurantId: "rest-spice-jct",
        };
        setUser(demoSession);
        setToken("demo-token");
        setAuthToken("demo-token");
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{
        access_token: string;
        user_id: string;
        role: string;
        restaurant_id: string;
        full_name: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const session: UserSession = {
        userId: data.user_id,
        email,
        fullName: data.full_name,
        role: data.role,
        restaurantId: data.restaurant_id,
      };

      setToken(data.access_token);
      setUser(session);
      setAuthToken(data.access_token);
      localStorage.setItem("chotu_auth_token", data.access_token);
      localStorage.setItem("chotu_user_session", JSON.stringify(session));

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("chotu_auth_token");
      localStorage.removeItem("chotu_user_session");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
