import { useContext } from 'react';
import { TenantContext } from '../contexts/TenantContext';

export const useTenantId = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantId must be used within a TenantProvider');
  }
  return context.tenantId;
};

export default useTenantId;
