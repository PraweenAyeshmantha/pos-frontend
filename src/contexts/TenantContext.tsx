import React, { createContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';

interface TenantContextType {
  tenantId: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export { TenantContext };

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { tenantId } = useParams<{ tenantId: string }>();

  const contextValue = useMemo(
    () => ({
      tenantId: tenantId || '',
    }),
    [tenantId]
  );

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
