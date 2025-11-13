import React from 'react';
import Alert from '../common/Alert';
import ToastContainer from '../common/ToastContainer';

interface SelectOutletReminderProps {
  message: string;
  title?: string;
}

const SelectOutletReminder: React.FC<SelectOutletReminderProps> = ({
  message,
  title = 'Select Outlet',
}) => {
  return (
    <>
      <ToastContainer>
        <Alert type="info" title={title} message={message} />
      </ToastContainer>
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center text-slate-500">
        <div className="text-5xl">🏬</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-800">{title} Required</h2>
        <p className="mt-2 max-w-md text-sm">{message}</p>
      </div>
    </>
  );
};

export default SelectOutletReminder;
