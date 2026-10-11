import { PageLayout } from '@/components/layout/PageLayout';
import { useMockAction } from '@/hooks/useMockAction';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Table, type Column, Tabs, TabList, Tab, TabPanel } from '@/components/ui/Table';
import { Plus, Building2, Bell, Users } from 'lucide-react';
import { useState } from 'react';
import { type User as UserModel } from '@/models';
import { settingsUsers } from '@/services/fixtures/settings';

const roleVariant = { admin: 'danger', manager: 'info', operator: 'neutral', viewer: 'outline' } as const;

const getUserColumns = (notify: (feature: string) => void): Column<UserModel>[] => [
  {
    key: 'name',
    header: 'User',
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
          {row.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-neutral-900">{row.name}</p>
          <p className="text-xs text-neutral-500">{row.email}</p>
        </div>
      </div>
    ),
    width: '260px',
  },
  { key: 'role', header: 'Role', accessor: (row) => <Badge variant={roleVariant[row.role]}>{row.role}</Badge>, width: '120px' },
  { key: 'createdAt', header: 'Created', accessor: 'createdAt', width: '130px' },
  { key: 'updatedAt', header: 'Last Updated', accessor: 'updatedAt', width: '140px' },
  {
    key: 'actions',
    header: '',
    accessor: (row) => (
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => notify(`Edit User · ${row.name}`)}>Edit</Button>
      </div>
    ),
    width: '90px',
    align: 'right',
  },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const notify = useMockAction();
  const userColumns = getUserColumns(notify);

  return (
    <PageLayout
      title="Settings"
      description="Manage users, roles, and application preferences"
      actions={<Button onClick={() => notify('Add User')}><Plus className="h-4 w-4" /> Add User</Button>}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabList className="mb-6">
          <Tab value="general"><Building2 className="h-4 w-4 mr-2" />General</Tab>
          <Tab value="users"><Users className="h-4 w-4 mr-2" />Users & Roles</Tab>
          <Tab value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</Tab>
        </TabList>

        <TabPanel value="general">
          <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Displayed across invoices and reports</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                <Input label="Company Name" defaultValue="Everest Textile Mills" />
                <Input label="Address" defaultValue="Industrial Area Phase II, Sector 18" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" defaultValue="Lahore" />
                  <Input label="Country" defaultValue="Pakistan" />
                </div>
                <Input label="Tax ID" defaultValue="TX-7788123-4" />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Default settings for this workspace</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                <Select
                  label="Default Currency"
                  options={[
                    { value: 'INR', label: 'INR - Indian Rupee' },
                    { value: 'USD', label: 'USD - US Dollar' },
                    { value: 'EUR', label: 'EUR - Euro' },
                  ]}
                  defaultValue="INR"
                />
                <Select
                  label="Date Format"
                  options={[
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  ]}
                  defaultValue="YYYY-MM-DD"
                />
                <Select
                  label="Weight Unit"
                  options={[
                    { value: 'kg', label: 'Kilograms (kg)' },
                    { value: 'lbs', label: 'Pounds (lbs)' },
                  ]}
                  defaultValue="kg"
                />
                <div className="pt-2">
                  <Button onClick={() => notify('Save Company Profile')}>Save Changes</Button>
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage who can access TexFlow and what they can do</CardDescription>
            </CardHeader>
            <Table columns={userColumns} data={settingsUsers} keyAccessor="id" striped hoverable emptyMessage="No users found" />
          </Card>
        </TabPanel>

        <TabPanel value="notifications">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose which events trigger in-app alerts</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                {[
                  { label: 'Low stock alerts', description: 'Notify when raw material falls below minimum stock' },
                  { label: 'Machine breakdowns', description: 'Notify when a machine reports a breakdown status' },
                  { label: 'Quality inspection failures', description: 'Notify when an inspection result is failed' },
                  { label: 'Overdue invoices', description: 'Notify when an invoice passes its due date' },
                  { label: 'Dispatch delays', description: 'Notify when a dispatch misses its expected delivery date' },
                ].map((item) => (
                  <label key={item.label} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                    <span>
                      <span className="block text-sm font-medium text-neutral-900">{item.label}</span>
                      <span className="block text-xs text-neutral-500 mt-0.5">{item.description}</span>
                    </span>
                  </label>
                ))}
                <div className="pt-2">
                  <Button onClick={() => notify('Save Preferences')}>Save Preferences</Button>
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </PageLayout>
  );
}
