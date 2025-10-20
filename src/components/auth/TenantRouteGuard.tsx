import React from 'react';
import { useParams } from 'react-router-dom';

interface TenantRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Component that ensures tenant ID is present in the URL
 * Blocks access if tenant ID is missing
 */
const TenantRouteGuard: React.FC<TenantRouteGuardProps> = ({ children }) => {
  const { tenantId } = useParams<{ tenantId: string }>();

  // If no tenant ID is in the URL, show an error page
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid URL Format
          </h1>
          <p className="text-gray-600 mb-6">
            Please access the system using the correct URL format:
          </p>
          <code className="block bg-gray-100 p-3 rounded text-sm text-left">
            http://localhost:5173/posai/&#123;tenantId&#125;
          </code>
          <p className="text-gray-500 text-sm mt-4">
            Contact your administrator if you don't have the correct URL.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TenantRouteGuard;
