import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthSession } from '../types';
import { authService } from '../services/authService';
import { getStoredUser, isDemoModeActive } from '../services/api';
import { DEMO_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (name: string, email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isDemoModeActive()) {
          const remoteUser = await authService.getMe();
          if (remoteUser) {
            setUser(remoteUser);
            return;
          }
        }
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const session = await authService.login(email, password);
      setUser(session.user);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const session = await authService.register(name, email, password);
      setUser(session.user);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const target = DEMO_USERS[targetRole];
    if (target) {
      if (!isDemoModeActive()) {
        try {
          await login(target.user.email, target.passwordHint);
          return;
        } catch (e) {
          console.error('Failed live demo login:', e);
        }
      }
      setUser(target.user);
      localStorage.setItem('ruralcare_user', JSON.stringify(target.user));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

