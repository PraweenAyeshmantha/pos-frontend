import type { FC, ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

const AdminPageHeader: FC<AdminPageHeaderProps> = ({ title, description, actions, meta }) => {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="mt-2.5 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? <p className="max-w-3xl text-base text-slate-600">{description}</p> : null}
        </div>
        {meta ? <div className="flex flex-wrap gap-3 text-sm text-slate-500">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">{actions}</div>
      ) : null}
    </header>
  );
};

export default AdminPageHeader;
