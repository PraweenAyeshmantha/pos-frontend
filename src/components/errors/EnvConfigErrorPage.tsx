import React from 'react';

interface EnvConfigErrorPageProps {
  errorMessage?: string;
}

/**
 * Error page displayed when environment configuration is invalid
 */
const EnvConfigErrorPage: React.FC<EnvConfigErrorPageProps> = ({ errorMessage }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Environment Configuration Error
        </h1>
        <p className="text-gray-600 mb-6">
          The application is not properly configured. Please check the environment variables.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2 font-semibold">Required steps:</p>
          <div className="text-left">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Create a <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> file in the root directory</li>
              <li>Add the required environment variable:
                <code className="block bg-gray-100 p-2 rounded text-xs mt-1 break-all">
                  VITE_API_BASE_URL=http://localhost:8080/posai/api
                </code>
              </li>
              <li>You can copy <code className="bg-gray-100 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> and update the values</li>
            </ol>
          </div>
        </div>
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-red-700 text-left whitespace-pre-wrap font-mono">
              {errorMessage}
            </p>
          </div>
        )}
        <p className="text-gray-500 text-sm">
          After creating the .env file, refresh the page.
        </p>
      </div>
    </div>
  );
};

export default EnvConfigErrorPage;
