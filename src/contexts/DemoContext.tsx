import React, { createContext, useContext, useState, useEffect } from 'react';
import { isDemoModeActive, setDemoModeActive, request } from '../services/api';

interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  backendConnected: boolean;
  checkBackendHealth: () => Promise<boolean>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoModeActive());
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const res = await request<{ status: string; database?: string }>('/health');
      const isUp = res.status === 'ok' || res.status === 'degraded';
      setBackendConnected(isUp);
      return isUp;
    } catch {
      setBackendConnected(false);
      return false;
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    setDemoModeActive(nextVal);
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        toggleDemoMode,
        backendConnected,
        checkBackendHealth,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

