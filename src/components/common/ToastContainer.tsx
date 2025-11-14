import React, { Children, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

let toastRoot: HTMLDivElement | null = null;

const getToastRoot = () => {
  if (toastRoot && document.body.contains(toastRoot)) {
    return toastRoot;
  }

  toastRoot = document.createElement('div');
  toastRoot.id = 'toast-root';
  toastRoot.className = 'pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3';
  document.body.appendChild(toastRoot);
  return toastRoot;
};

interface ToastContainerProps {
  children?: ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const nodes = Children.toArray(children);

  return createPortal(
    nodes.map((child, index) => (
      <div key={index} className="pointer-events-auto w-[calc(100vw-3rem)] max-w-md sm:w-[360px]">
        {child}
      </div>
    )),
    getToastRoot(),
  );
};

export default memo(ToastContainer);
