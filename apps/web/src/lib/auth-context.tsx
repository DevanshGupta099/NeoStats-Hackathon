'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, ApiClientError } from './api-client';
import { GlobalRole } from '@forgeline/shared';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  handle: string;
  globalRole: GlobalRole;
  isActive: boolean;
  avatarSeed?: string;
  tokenVersion?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/', '/login', '/register', '/health'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiClient.get<{ user: UserProfile }>('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublic = pathname === '/' || PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route));
    const isAdminRoute = pathname.startsWith('/users');

    if (!user && !isPublic) {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace('/dashboard');
    } else if (user && isAdminRoute && user.globalRole !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await apiClient.post<{ user: UserProfile; accessToken?: string; message: string }>('/auth/login', {
      email,
      password,
    });
    if (res.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('forgeline_token', res.accessToken);
    }
    setUser(res.user);
    router.push('/dashboard');
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('forgeline_token');
      }
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser: async () => {
          await fetchCurrentUser();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
