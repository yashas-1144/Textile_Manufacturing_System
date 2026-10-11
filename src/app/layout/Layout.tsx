import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/utils/cn';
import { LayoutContext } from './layout-context';

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <LayoutContext.Provider
      value={{
        collapsed,
        toggleCollapsed: () => setCollapsed((v) => !v),
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      <div className="min-h-screen bg-neutral-50">
        <Sidebar />
        <div className={cn('transition-all duration-200 min-h-screen', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
          <Outlet />
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
