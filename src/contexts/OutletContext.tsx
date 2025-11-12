import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import settingsService from '../services/settingsService';
import type { OutletSummaryDTO } from '../types/auth';

interface OutletContextType {
  currentOutlet: OutletSummaryDTO | null;
  assignedOutlets: OutletSummaryDTO[];
  isSwitchingOutlet: boolean;
  selectOutlet: (outlet: OutletSummaryDTO) => Promise<void>;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

interface OutletProviderProps {
  children: ReactNode;
}

const buildStorageKey = (username?: string) => (username ? `pos-selected-outlet:${username}` : null);

export const OutletProvider: React.FC<OutletProviderProps> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [currentOutlet, setCurrentOutlet] = useState<OutletSummaryDTO | null>(null);
  const [isSwitchingOutlet, setIsSwitchingOutlet] = useState(false);

  const assignedOutlets = useMemo(() => user?.assignedOutlets ?? [], [user?.assignedOutlets]);

  // Initialize outlet when user changes
  useEffect(() => {
    if (!user) {
      setCurrentOutlet(null);
      return;
    }

    const storageKey = buildStorageKey(user.username);
    const storedOutletId = storageKey ? sessionStorage.getItem(storageKey) : null;

    const findOutletById = (id?: number | null) =>
      typeof id === 'number'
        ? assignedOutlets.find((outlet) => outlet.id === id) ?? null
        : null;

    const storedOutlet = storedOutletId ? findOutletById(Number(storedOutletId)) : null;
    const defaultOutlet = user.defaultOutlet ? findOutletById(user.defaultOutlet.id) : null;
    const fallbackOutlet = assignedOutlets.length > 0 ? assignedOutlets[0] : null;

    setCurrentOutlet(storedOutlet ?? defaultOutlet ?? fallbackOutlet);
  }, [assignedOutlets, user]);

  const selectOutlet = useCallback(async (outlet: OutletSummaryDTO) => {
    if (!user) {
      throw new Error('No authenticated user available to switch outlets');
    }

    if (currentOutlet?.id === outlet.id) {
      return;
    }

    setIsSwitchingOutlet(true);
    try {
      if (user.cashierId) {
        await settingsService.switchCashierOutlet(user.cashierId, { outletId: outlet.id });
      } else if (user.userId) {
        await settingsService.switchAdminOutlet(user.userId, { outletId: outlet.id });
      } else {
        throw new Error('Unable to determine user identity for outlet switching');
      }

      setCurrentOutlet(outlet);

      const storageKey = buildStorageKey(user.username);
      if (storageKey) {
        sessionStorage.setItem(storageKey, outlet.id.toString());
      }

      updateUser({
        ...user,
        defaultOutlet: outlet,
      });
    } finally {
      setIsSwitchingOutlet(false);
    }
  }, [currentOutlet?.id, updateUser, user]);

  const value: OutletContextType = {
    currentOutlet,
    assignedOutlets,
    isSwitchingOutlet,
    selectOutlet,
  };

  return (
    <OutletContext.Provider value={value}>
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlet = () => {
  const context = React.useContext(OutletContext);
  if (context === undefined) {
    throw new Error('useOutlet must be used within an OutletProvider');
  }
  return context;
};
