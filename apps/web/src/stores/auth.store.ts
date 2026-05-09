import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@berry-x/types';
import { api } from '@/lib/api';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (identifier: string, password: string, deviceId?: string) => Promise<{ requiresTwoFactor?: boolean }>;
  register: (data: { email: string; phone: string; firstName: string; lastName: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (identifier, password, deviceId) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { identifier, password, deviceId });
          const result = data.data || data;

          if (result.requiresTwoFactor) {
            set({ isLoading: false });
            return { requiresTwoFactor: true };
          }

          localStorage.setItem('access_token', result.accessToken);
          localStorage.setItem('refresh_token', result.refreshToken);

          set({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return {};
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/register', data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },
    }),
    {
      name: 'berry-x-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
