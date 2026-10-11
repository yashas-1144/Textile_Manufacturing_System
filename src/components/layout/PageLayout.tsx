import { type ReactNode } from 'react';
import { TopNav } from './TopNav';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function PageLayout({
  children,
  title,
  description,
  breadcrumbs = [],
  actions,
  showSearch = true,
  onSearch,
}: PageLayoutProps) {
  const fullBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    ...breadcrumbs,
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav
        title={title}
        breadcrumbs={fullBreadcrumbs}
        actions={actions}
        showSearch={showSearch}
        onSearch={onSearch}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8" id="main-content" tabIndex={-1}>
        {description && (
          <p className="text-neutral-600 mb-6 text-sm">{description}</p>
        )}
        {children}
      </main>
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryActions?: ReactNode;
}

export function PageHeader({ title, description, action, secondaryActions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {secondaryActions && <div className="flex-1 sm:flex-none flex items-center gap-2">{secondaryActions}</div>}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-medium text-neutral-900">{title}</h2>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
