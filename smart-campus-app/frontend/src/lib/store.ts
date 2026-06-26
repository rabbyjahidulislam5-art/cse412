import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: { id: string; studentId: string; fullName: string; role: string; department?: string; semester?: number } | null;
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  setUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem('access_token', token);
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
