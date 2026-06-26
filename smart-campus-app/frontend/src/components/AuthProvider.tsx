'use client';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, login: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { user, login, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !user) {
      api.get('/student/profile').then(res => {
        login(token, res.data.data);
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem('access_token');
        setLoading(false);
      });
    } else { setLoading(false); }
  }, []);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
    router.push('/auth/login');
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
