'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import { convertDateStringIntoDateObject } from '@/lib/conversions';

type AuthContextType = {
  devotee: Devotee | null;
  isAuthenticated: boolean;
  systemRole: string | null;
  login: (accessTokenInLoginResponse: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Devotee = Prisma.devoteesGetPayload<{
  include: {
    system_roles: {
      select: {
        name: true;
      };
    },
    spiritual_levels: {
      select: {
        title_male: true,
        title_female: true,
        title_other: true
      };
    },
    devotees: {
      select: {
        id: true,
        name: true
      }
    }
  };
}>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [devotee, setDevotee] = useState<Devotee | null>(null);
  const [systemRole, setSystemRole] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState<boolean>(false);
  const router = useRouter();

  const fetchMe = async () => {
    try {
      setAuthInProgress(true);
      const res = await api.get('/auth/me');
      if (res && res.status === 200 && res.data?.devotee) {
        const parsedDevotee: Devotee = convertDateStringIntoDateObject(res.data.devotee);
        setDevotee(parsedDevotee);
        setSystemRole(res.data.devotee.system_roles.name);
      } else {
        throw new Error();
      }
    } catch {
      logout();
    } finally {
      setAuthInProgress(false);
    }
  };

  const login = async (accessTokenInLoginResponse: string) => {
    localStorage.setItem('access_token', accessTokenInLoginResponse);
    await fetchMe();
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
    <AuthContext.Provider value={{ devotee, isAuthenticated: !!devotee, systemRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};