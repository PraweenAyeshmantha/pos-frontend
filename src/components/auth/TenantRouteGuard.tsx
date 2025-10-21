import React from 'react';
import { useParams } from 'react-router-dom';

interface TenantRouteGuardProps {
  children: React.ReactNode;
}

// Reserved route names that cannot be used as tenant IDs
const RESERVED_ROUTE_NAMES = [
  'login',
  'reset-password',
  'admin',
  'missing-tenant'
];

/**
 * Component that ensures tenant ID is present in the URL
 * Blocks access if tenant ID is missing or is a reserved route name
 */
const TenantRouteGuard: React.FC<TenantRouteGuardProps> = ({ children }) => {
  const { tenantId } = useParams<{ tenantId: string }>();

  // Check if tenant ID is a reserved route name
  const isReservedName = tenantId && RESERVED_ROUTE_NAMES.includes(tenantId.toLowerCase());

  // If no tenant ID is in the URL or it's a reserved name, show an error page
  if (!tenantId || isReservedName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isReservedName ? 'Invalid Tenant ID' : 'Invalid URL - Tenant ID Missing'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isReservedName 
              ? `"${tenantId}" is a reserved system route and cannot be used as a tenant ID. Please use your company's actual tenant ID.`
              : 'Please check that the address is correct. Use the tenant ID related to your company to access the system.'
            }
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2 font-semibold">Correct URL format:</p>
            <code className="block bg-gray-100 p-3 rounded text-sm text-left break-all">
              http://localhost:5173/posai/&#123;tenantId&#125;
            </code>
          </div>
          <p className="text-gray-500 text-sm">
            Replace <code className="bg-gray-100 px-1 py-0.5 rounded">&#123;tenantId&#125;</code> with your company's tenant ID.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Contact your administrator if you don't have the correct URL.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TenantRouteGuard;
