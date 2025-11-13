import React, { Children, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastContainerProps {
  children?: ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {Children.map(children, (child, index) => (
        <div
          key={index}
          className="pointer-events-auto w-[calc(100vw-3rem)] max-w-md sm:w-[360px]"
        >
          {child}
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default memo(ToastContainer);
