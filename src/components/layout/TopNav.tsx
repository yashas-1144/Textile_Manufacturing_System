import { Fragment, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings, CheckCircle, AlertTriangle, Clock, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { useLayout } from '@/app/layout/layout-context';
import { useAuth } from '@/app/auth-context';

interface TopNavProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

const mockNotifications = [
  { id: 1, type: 'warning' as const, icon: AlertTriangle, title: 'Low stock: Cotton Yarn NE 30/1', time: '12 min ago' },
  { id: 2, type: 'info' as const, icon: Clock, title: 'Machine WM-04 maintenance due', time: '1 hour ago' },
  { id: 3, type: 'success' as const, icon: CheckCircle, title: 'Order ORD-2024-0456 passed QC', time: '3 hours ago' },
];

export function TopNav({
  title,
  breadcrumbs = [],
  actions,
  showSearch = true,
  onSearch,
}: TopNavProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { openMobile } = useLayout();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleLogout = () => {
    logout();
    addToast({
      type: 'info',
      title: 'Logged out',
      message: 'You have been logged out successfully',
    });
    navigate('/login');
  };

  const userMenuItems: DropdownItem[] = [
    { label: 'Profile', onClick: () => navigate('/settings'), icon: <User className="h-4 w-4" /> },
    { label: 'Settings', onClick: () => navigate('/settings'), icon: <Settings className="h-4 w-4" /> },
    { label: 'Logout', onClick: handleLogout, icon: <LogOut className="h-4 w-4" />, danger: true },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-200">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2"
            onClick={openMobile}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 text-neutral-700" />
          </Button>
          <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                {index > 0 && <span className="text-neutral-400">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-neutral-500 hover:text-neutral-700 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-neutral-900 font-medium">{crumb.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
          <h1 className="text-lg font-semibold text-neutral-900 truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {showSearch && (
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 lg:w-72 pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors placeholder:text-neutral-400"
                aria-label="Search"
              />
            </form>
          )}

          {actions}

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen((v) => !v)}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              className="relative"
            >
              <Bell className="h-5 w-5 text-neutral-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </Button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-elevated z-50 animate-in">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-neutral-900">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {mockNotifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
                      >
                        <n.icon
                          className={
                            n.type === 'warning'
                              ? 'h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0'
                              : n.type === 'success'
                                ? 'h-4 w-4 mt-0.5 text-green-500 flex-shrink-0'
                                : 'h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0'
                          }
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-neutral-800">{n.title}</span>
                          <span className="block text-xs text-neutral-400 mt-0.5">{n.time}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Dropdown
            align="right"
            trigger={
              <span className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-700" />
                </span>
                <span className="hidden lg:block text-left">
                  <span className="block text-sm font-medium text-neutral-800 leading-tight">Admin User</span>
                  <span className="block text-xs text-neutral-500 leading-tight">Administrator</span>
                </span>
              </span>
            }
            items={userMenuItems}
          />
        </div>
      </div>
    </header>
  );
}
