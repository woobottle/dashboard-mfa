import { Role, User } from "@dashboard/shared-types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthState {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error: string | null;
}

export interface AuthActions {
  login: (username: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  setApiBase: (apiBase: string) => void;
  getApiBase: () => string;
}

interface AuthStoreState extends AuthState {
  apiBase: string;
}

const INITIAL: AuthStoreState = {
  token: null,
  user: null,
  status: 'idle',
  error: null,
  apiBase: 'http://localhost:4000',
}


export const useAuthStore = create<AuthStoreState & AuthActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      async login(username: string) {
        set({ status: 'loading', error: null })
        try {
          const res = await fetch(`${get().apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          })

          if (!res.ok) {
            const body = await res.json().catch(() => ({ message: res.statusText }))
            throw new Error(typeof body === 'object' && body !== null && 'message' in body ? String(body.message) : res.statusText)
          }

          const data = (await res.json()) as {
            token: string;
            user: User;
          }
          set({ token: data.token, user: data.user, status: 'authenticated' })
        } catch (error) {
          set({ status: 'error', error: error instanceof Error ? error.message : 'Network error' })
          throw error;
        }
      },
      logout: () => set(() => ({
        user: null,
        token: null,
        status: 'unauthenticated',
        error: null
      })),
      setApiBase: (apiBase: string) => set({ apiBase }),
      getApiBase: () => get().apiBase,
      hydrate: async () => {
        set({ status: 'loading' });
        try {
          const token = get().token;
          if (!token) {
            set({ status: 'unauthenticated', error: 'No token' });
            return;
          }
          const res = await fetch(`${get().apiBase}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            throw new Error('Invalid token');
          }
          const user = (await res.json()) as User;
          set({ token, user, status: 'authenticated' });
        } catch (error) {
          set({ token: null, user: null, status: 'unauthenticated', error: error instanceof Error ? error.message : 'Failed to hydrate' });
          throw error;
        }
      },
    }),
    {
      name: 'dashboardAuthStore',
      storage: createJSONStorage(() => localStorage),
      // 토큰/유저만 persist. status/error는 매 세션마다 재계산.
      partialize: (s) => ({ token: s.token, user: s.user, apiBase: s.apiBase }),
    },
  )
)

export const selectRole = (s: AuthStoreState) => s.user?.role;
export const selectToken = (s: AuthStoreState) => s.token;

export const hasRole = (role: Role | null, allowed: Role[]) => {
  if (!role) return false;
  return allowed.includes(role);
};