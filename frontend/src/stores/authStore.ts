import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, MahasiswaProfile, ReviewerProfile } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  profile: MahasiswaProfile | ReviewerProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (data: {
    user: AuthUser;
    profile: MahasiswaProfile | ReviewerProfile | null;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data) => {
        // Set cookies for middleware route protection
        if (typeof document !== 'undefined') {
          document.cookie = `pkm-auth-token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          document.cookie = `pkm-auth-role=${data.user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        set({
          user: data.user,
          profile: data.profile,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () => {
        // Clear cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'pkm-auth-token=; path=/; max-age=0';
          document.cookie = 'pkm-auth-role=; path=/; max-age=0';
        }
        set({
          user: null,
          profile: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'pkm-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
