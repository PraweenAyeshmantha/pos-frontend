import React, { memo, type ReactNode } from 'react';

interface ToastContainerProps {
  children: ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md pointer-events-none">
      {children}
    </div>
  );
};

export default memo(ToastContainer);
