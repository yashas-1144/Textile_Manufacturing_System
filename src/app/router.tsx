import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout } from './layout/Layout';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { BuyersPage } from '@/pages/Buyers/BuyersPage';
import { InventoryPage } from '@/pages/Inventory/InventoryPage';
import { ProductionPage } from '@/pages/Production/ProductionPage';
import { MachinesPage } from '@/pages/Machines/MachinesPage';
import { QualityPage } from '@/pages/Quality/QualityPage';
import { FinishedGoodsPage } from '@/pages/FinishedGoods/FinishedGoodsPage';
import { DispatchPage } from '@/pages/Dispatch/DispatchPage';
import { WorkforcePage } from '@/pages/Workforce/WorkforcePage';
import { FinancePage } from '@/pages/Finance/FinancePage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/Login';
import { useAuth } from './auth-context';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'orders', element: <BuyersPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'production', element: <ProductionPage /> },
      { path: 'machines', element: <MachinesPage /> },
      { path: 'quality', element: <QualityPage /> },
      { path: 'finished-goods', element: <FinishedGoodsPage /> },
      { path: 'dispatch', element: <DispatchPage /> },
      { path: 'workforce', element: <WorkforcePage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);