'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import axios from 'axios';

type AuthContextType = {
  devotee: object | null;
  isAuthenticated: boolean;
  login: (accessTokenInLoginResponse: string, devoteeInLoginResponse: object) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [devotee, setDevotee] = useState<object | null>(null);
  const [authInProgress, setAuthInProgress] = useState<boolean>(false);
  const router = useRouter();

  const fetchMe = async () => {
    try {
      setAuthInProgress(true);
      const res = await api.get('/auth/me');
      if (res && res.status === 200 && res.data?.devotee) {
        setDevotee(res.data.devotee);
      } else {
        throw new Error();
      }
    } catch {
      logout();
    } finally {
      setAuthInProgress(false);
    }
  };

  const login = (accessTokenInLoginResponse: string, devoteeInLoginResponse: object) => {
    localStorage.setItem('access_token', accessTokenInLoginResponse);
    setDevotee(devoteeInLoginResponse);
    router.push('/'); // Redirect to home page
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    await axios.post('/api/auth/logout'); // NOTE: use raw axios, not the wrapped one
    setDevotee(null);
    router.push('/login');
  };

  useEffect(() => {
    if(!authInProgress) {
      const token = localStorage.getItem('access_token');
      if (token) { 
        if (!devotee) {
          fetchMe();
        }
      } else {
          logout();
      }
    }
  });

  return (
    <AuthContext.Provider value={{ devotee, isAuthenticated: !!devotee, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};