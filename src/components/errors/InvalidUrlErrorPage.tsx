import React from 'react';

/**
 * Error page displayed when user accesses an invalid/non-existent URL
 */
const InvalidUrlErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Invalid URL - Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist. Please check the URL and try again.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2 font-semibold">Correct URL format:</p>
          <code className="block bg-gray-100 p-3 rounded text-sm text-left break-all">
            http://localhost:5173/posai/&#123;tenantId&#125;/login
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
};

export default InvalidUrlErrorPage;
