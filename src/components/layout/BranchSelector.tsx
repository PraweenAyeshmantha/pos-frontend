import React, { useCallback, useState } from 'react';
import { useOutlet } from '../../contexts/OutletContext';
import type { OutletSummaryDTO } from '../../types/auth';

interface BranchSelectorProps {
  className?: string;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ className = '' }) => {
  const { currentOutlet, assignedOutlets, selectOutlet, isSwitchingOutlet } = useOutlet();
  const [isOpen, setIsOpen] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleSelectOutlet = useCallback(async (outlet: OutletSummaryDTO) => {
    setSwitchError(null);
    try {
      await selectOutlet(outlet);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch outlet', error);
      setSwitchError('Unable to switch outlet. Please try again.');
    }
  }, [selectOutlet]);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  if (!assignedOutlets || assignedOutlets.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        disabled={isSwitchingOutlet}
        className={`flex items-center space-x-2 bg-blue-700 px-3 py-1.5 rounded-full transition-colors text-white ${
          isSwitchingOutlet ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-800'
        }`}
      >
        <div className="w-7 h-7 bg-orange-400 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <span className="text-sm font-medium truncate">
          {isSwitchingOutlet ? 'Switching...' : currentOutlet?.name || 'Select Branch'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {switchError && (
        <p className="mt-1 text-xs text-red-200">{switchError}</p>
      )}

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg py-1 z-20 max-h-60 overflow-y-auto">
          {assignedOutlets.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => handleSelectOutlet(outlet)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                currentOutlet?.id === outlet.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{outlet.name}</span>
                {currentOutlet?.id === outlet.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {outlet.code}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
