import { type User } from '@/models';

/** Application users shown in Settings → Users & Roles (front-end shell data). */
export const settingsUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@everesttextile.com', role: 'admin', createdAt: '2023-06-01', updatedAt: '2024-01-10' },
  { id: '2', name: 'Production Manager', email: 'manager@everesttextile.com', role: 'manager', createdAt: '2023-07-15', updatedAt: '2024-01-08' },
  { id: '3', name: 'Floor Operator', email: 'operator@everesttextile.com', role: 'operator', createdAt: '2023-09-20', updatedAt: '2023-12-28' },
  { id: '4', name: 'Finance Viewer', email: 'finance@everesttextile.com', role: 'viewer', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
];
