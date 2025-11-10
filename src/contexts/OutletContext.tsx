import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { OutletSummaryDTO } from '../types/auth';

interface OutletContextType {
  currentOutlet: OutletSummaryDTO | null;
  setCurrentOutlet: (outlet: OutletSummaryDTO | null) => void;
  assignedOutlets: OutletSummaryDTO[];
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

interface OutletProviderProps {
  children: ReactNode;
}

export const OutletProvider: React.FC<OutletProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentOutlet, setCurrentOutlet] = useState<OutletSummaryDTO | null>(null);

  // Set default outlet when user changes
  useEffect(() => {
    if (user?.defaultOutlet) {
      setCurrentOutlet(user.defaultOutlet);
    } else if (user?.assignedOutlets && user.assignedOutlets.length > 0) {
      setCurrentOutlet(user.assignedOutlets[0]);
    } else {
      setCurrentOutlet(null);
    }
  }, [user]);

  const value: OutletContextType = {
    currentOutlet,
    setCurrentOutlet,
    assignedOutlets: user?.assignedOutlets || [],
  };

  return (
    <OutletContext.Provider value={value}>
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlet = () => {
  const context = useContext(OutletContext);
  if (context === undefined) {
    throw new Error('useOutlet must be used within an OutletProvider');
  }
  return context;
};