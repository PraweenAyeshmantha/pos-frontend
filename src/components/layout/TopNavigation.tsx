import React from 'react';

const TopNavigation: React.FC = () => {
  return (
    <div className="h-16 bg-blue-600 shadow-md flex items-center justify-between px-6 fixed top-0 right-0 left-24 z-10">
      {/* Left side - empty or can add breadcrumbs */}
      <div className="flex items-center space-x-4">
        {/* Placeholder for additional features */}
      </div>

      {/* Right side - User profile and actions */}
      <div className="flex items-center space-x-4">
        {/* WiFi/Connection Status */}
        <button className="text-white hover:text-gray-200 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </button>

        {/* Sync/Refresh */}
        <button className="text-white hover:text-gray-200 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 bg-blue-700 px-4 py-2 rounded-full">
          <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
            MD
          </div>
          <span className="text-white font-medium">Mark Doe</span>
          <button className="text-white hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
