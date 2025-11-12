import React, { memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastContainerProps {
  children: ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-w-md flex-col gap-3">
      {children}
    </div>,
    document.body,
  );
};

export default memo(ToastContainer);
