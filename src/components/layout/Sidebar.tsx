import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  Cpu,
  ShieldCheck,
  Box,
  Truck,
  Users,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLayout } from '@/app/layout/layout-context';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Buyer Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Raw Material Inventory', href: '/inventory', icon: Package },
  { name: 'Production', href: '/production', icon: Factory },
  { name: 'Machines', href: '/machines', icon: Cpu },
  { name: 'Quality Control', href: '/quality', icon: ShieldCheck },
  { name: 'Finished Goods', href: '/finished-goods', icon: Box },
  { name: 'Dispatch', href: '/dispatch', icon: Truck },
  { name: 'Workforce', href: '/workforce', icon: Users },
  { name: 'Finance & Reports', href: '/finance', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
] as const;

export function Sidebar() {
  const location = useLocation();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useLayout();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-navy-900 border-r border-navy-800 transition-all duration-200 flex flex-col',
          'w-64 lg:w-auto',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-navy-800">
          <NavLink
            to="/dashboard"
            className={cn('flex items-center gap-2', collapsed && 'lg:mx-auto')}
            aria-label="TexFlow Home"
            onClick={closeMobile}
          >
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className={cn('font-semibold text-white text-lg', collapsed && 'lg:hidden')}>TexFlow</span>
          </NavLink>
          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:block p-1.5 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 transition-colors',
              collapsed && 'lg:absolute lg:right-4'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2" aria-label="Main navigation">
          <ul className="space-y-1" role="list">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-navy-900',
                      isActive
                        ? 'bg-primary-600/20 text-primary-100'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white',
                      collapsed && 'lg:justify-center'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-300')} aria-hidden="true" />
                    <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn('p-4 border-t border-navy-800', collapsed && 'lg:hidden')}>
          <div className="px-3 py-2 text-xs text-navy-400">
            <p className="font-medium text-navy-300">Everest Textile Mills</p>
            <p className="mt-0.5">Textile Manufacturing Management</p>
          </div>
        </div>
      </aside>
    </>
  );
}
