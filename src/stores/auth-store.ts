"use client";

import { create } from "zustand";
import { loginRequest } from "@/features/auth/api";
import { LoginFormValues, AuthUser } from "@/features/auth/types";
import { tokenStorage } from "@/lib/auth/token";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => void;
  login: (payload: LoginFormValues) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  isLoading: false,
  error: null,
  hydrate: () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    set({
      accessToken,
      refreshToken,
      isHydrated: true
    });
  },
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginRequest(payload);
      tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      set({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        user: data.user,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  logout: () => {
    tokenStorage.clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      error: null
    });
  }
}));

