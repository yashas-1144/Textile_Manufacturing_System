import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column, Tabs, TabList, Tab, TabPanel } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Users, Clock, DollarSign, Plus, CalendarCheck, Calculator, MoreVertical, CheckCircle, Wallet } from 'lucide-react';
import type { Worker, Attendance, Wage } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import { workforceService, type CreateWorkerInput, type RecordAttendanceInput, type CalculateWageInput } from '@/services/workforceService';
import { WorkerFormModal, AttendanceFormModal, WageCalculationModal } from './WorkforceModals';

type TabValue = 'workers' | 'attendance' | 'wages';

const today = new Date().toISOString().slice(0, 10);

const attendanceVariants: Record<Attendance['status'], 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  half_day: 'info',
  on_leave: 'neutral',
};

const attendanceFilters: (Attendance['status'] | 'all')[] = ['all', 'present', 'late', 'half_day', 'absent', 'on_leave'];

const labelize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');

export function WorkforcePage() {
  const { data, setData, loading, error } = useServiceData(workforceService.getWorkforce);
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabValue>('workers');
  const [search, setSearch] = useState('');
  const [attStatus, setAttStatus] = useState<Attendance['status'] | 'all'>('all');
  const [workerFormOpen, setWorkerFormOpen] = useState(false);
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
  const [wageModalOpen, setWageModalOpen] = useState(false);

  const workers = data?.workers ?? [];
  const attendance = data?.attendance ?? [];
  const wages = data?.wages ?? [];

  const query = search.trim().toLowerCase();
  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(query) ||
      w.employeeId.toLowerCase().includes(query) ||
      w.department.toLowerCase().includes(query) ||
      w.role.toLowerCase().includes(query)
  );
  const filteredAttendance = attendance
    .filter((a) => (attStatus === 'all' || a.status === attStatus) && (!query || a.workerName.toLowerCase().includes(query)))
    .slice()
    .sort((a, b) => (a.date === b.date ? a.workerName.localeCompare(b.workerName) : b.date.localeCompare(a.date)));
  const filteredWages = wages.filter((w) => !query || w.workerName.toLowerCase().includes(query));

  const presentToday = attendance.filter((a) => a.date === today && ['present', 'late', 'half_day'].includes(a.status)).length;
  const onLeave = workers.filter((w) => w.status === 'on_leave').length;
  const unpaidWages = wages.filter((w) => w.status !== 'paid');
  const payrollDue = unpaidWages.reduce((sum, w) => sum + w.netPay, 0);

  const updateWorkers = (worker: Worker) => setData((prev) => (prev ? { ...prev, workers: [worker, ...prev.workers] } : prev));
  const updateAttendance = (record: Attendance) =>
    setData((prev) => (prev ? { ...prev, attendance: [record, ...prev.attendance] } : prev));
  const replaceWage = (wage: Wage) => setData((prev) => (prev ? { ...prev, wages: prev.wages.map((w) => (w.id === wage.id ? wage : w)) } : prev));
  const addWage = (wage: Wage) => setData((prev) => (prev ? { ...prev, wages: [wage, ...prev.wages] } : prev));

  const handleCreateWorker = async (input: CreateWorkerInput) => {
    try {
      const worker = await workforceService.createWorker(input);
      updateWorkers(worker);
      setWorkerFormOpen(false);
      addToast({ type: 'success', title: 'Worker added', message: `${worker.name} (${worker.employeeId}) onboarded.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not add worker', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleRecordAttendance = async (input: RecordAttendanceInput) => {
    try {
      const record = await workforceService.recordAttendance(input);
      updateAttendance(record);
      setAttendanceFormOpen(false);
      addToast({ type: 'success', title: 'Attendance recorded', message: `${record.workerName} · ${record.date} · ${labelize(record.status)}.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not record attendance', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleCalculateWage = async (input: CalculateWageInput) => {
    try {
      const wage = await workforceService.calculateWage(input);
      addWage(wage);
      setWageModalOpen(false);
      setActiveTab('wages');
      addToast({ type: 'success', title: 'Wage calculated', message: `${wage.workerName}: net ₹${wage.netPay.toLocaleString()} for ${wage.periodStart} → ${wage.periodEnd}.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not calculate wage', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleApproveWage = async (wage: Wage) => {
    try {
      const updated = await workforceService.approveWage(wage.id);
      replaceWage(updated);
      addToast({ type: 'success', title: 'Wage approved', message: `${updated.workerName} · ₹${updated.netPay.toLocaleString()} ready for payment.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not approve wage', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleMarkPaid = async (wage: Wage) => {
    try {
      const updated = await workforceService.markWagePaid(wage.id);
      replaceWage(updated);
      addToast({ type: 'success', title: 'Wage paid', message: `${updated.workerName} paid on ${updated.paidDate}.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not mark wage paid', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const workerColumns: Column<Worker>[] = [
    { key: 'employeeId', header: 'Employee ID', width: '120px', accessor: 'employeeId' },
    {
      key: 'name',
      header: 'Name',
      width: '190px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.name}</p>
          <p className="text-xs text-neutral-500">{row.role}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Department', width: '130px', accessor: (row) => <Badge variant="outline" size="sm">{labelize(row.department)}</Badge> },
    { key: 'shift', header: 'Shift', width: '110px', accessor: (row) => <Badge variant="outline" size="sm">{labelize(row.shift)}</Badge> },
    { key: 'hourlyRate', header: 'Hourly Rate', width: '120px', align: 'right', accessor: (row) => `₹${row.hourlyRate.toFixed(2)}` },
    { key: 'overtimeRate', header: 'OT Rate', width: '120px', align: 'right', accessor: (row) => `₹${row.overtimeRate.toFixed(2)}/h` },
    { key: 'hireDate', header: 'Hired', width: '120px', accessor: 'hireDate' },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      accessor: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'on_leave' ? 'warning' : 'neutral'} size="sm">
          {labelize(row.status)}
        </Badge>
      ),
    },
  ];

  const attendanceColumns: Column<Attendance>[] = [
    { key: 'date', header: 'Date', width: '120px', accessor: 'date' },
    {
      key: 'workerName',
      header: 'Worker',
      width: '170px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.workerName}</p>
          {row.notes && <p className="text-xs text-neutral-500">{row.notes}</p>}
        </div>
      ),
    },
    { key: 'shift', header: 'Shift', width: '100px', accessor: (row) => <Badge variant="outline" size="sm">{labelize(row.shift)}</Badge> },
    { key: 'checkIn', header: 'Check In', width: '100px', align: 'center', accessor: (row) => row.checkIn || '—' },
    { key: 'checkOut', header: 'Check Out', width: '100px', align: 'center', accessor: (row) => row.checkOut || '—' },
    { key: 'overtimeHours', header: 'OT Hours', width: '100px', align: 'center', accessor: (row) => `${row.overtimeHours}h` },
    { key: 'status', header: 'Status', width: '110px', accessor: (row) => <Badge variant={attendanceVariants[row.status]} size="sm">{labelize(row.status)}</Badge> },
  ];

  const wageColumns: Column<Wage>[] = [
    { key: 'workerName', header: 'Worker', width: '160px', accessor: 'workerName' },
    { key: 'period', header: 'Period', width: '200px', accessor: (row) => `${row.periodStart} → ${row.periodEnd}` },
    { key: 'baseHours', header: 'Base Hrs', width: '100px', align: 'center', accessor: 'baseHours' },
    { key: 'overtimeHours', header: 'OT Hrs', width: '90px', align: 'center', accessor: 'overtimeHours' },
    { key: 'basePay', header: 'Base Pay', width: '120px', align: 'right', accessor: (row) => `₹${row.basePay.toLocaleString()}` },
    { key: 'overtimePay', header: 'OT Pay', width: '110px', align: 'right', accessor: (row) => `₹${row.overtimePay.toLocaleString()}` },
    { key: 'deductions', header: 'Deductions', width: '120px', align: 'right', accessor: (row) => `−₹${row.deductions.toLocaleString()}` },
    { key: 'bonuses', header: 'Bonuses', width: '110px', align: 'right', accessor: (row) => `+₹${row.bonuses.toLocaleString()}` },
    { key: 'netPay', header: 'Net Pay', width: '130px', align: 'right', accessor: (row) => <span className="font-semibold text-neutral-900">${row.netPay.toLocaleString()}</span> },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      accessor: (row) => (
        <Badge variant={row.status === 'paid' ? 'success' : row.status === 'approved' ? 'info' : 'warning'} size="sm">
          {labelize(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      accessor: (row) => (
        <Dropdown
          trigger={<MoreVertical className="h-4 w-4" />}
          triggerButtonProps={{ 'aria-label': `Actions for ${row.workerName} wage` }}
          items={[
            {
              label: 'Approve',
              icon: <CheckCircle className="h-4 w-4" />,
              disabled: row.status !== 'calculated',
              onClick: () => void handleApproveWage(row),
            },
            {
              label: 'Mark Paid',
              icon: <Wallet className="h-4 w-4" />,
              disabled: row.status !== 'approved',
              onClick: () => void handleMarkPaid(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Workforce"
      description="Manage workers, record attendance, and calculate payroll"
      actions={
        <Button onClick={() => setWorkerFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Worker
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading workforce…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Workers" value={workers.length} icon={<Users className="h-5 w-5" />} accent="primary" onClick={() => setActiveTab('workers')} />
            <StatCard label="Present Today" value={presentToday} icon={<CalendarCheck className="h-5 w-5" />} accent="success" hint={today} onClick={() => setActiveTab('attendance')} />
            <StatCard label="On Leave" value={onLeave} icon={<Clock className="h-5 w-5" />} accent="warning" />
            <StatCard label="Unpaid Wages" value={unpaidWages.length} icon={<Calculator className="h-5 w-5" />} accent="info" onClick={() => setActiveTab('wages')} />
            <StatCard label="Payroll Due" value={`₹${payrollDue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} accent="neutral" hint="Calculated + approved" />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
            <TabList className="mb-6">
              <Tab value="workers"><Users className="h-4 w-4 mr-2 inline" />Workers</Tab>
              <Tab value="attendance"><Clock className="h-4 w-4 mr-2 inline" />Attendance</Tab>
              <Tab value="wages"><DollarSign className="h-4 w-4 mr-2 inline" />Wages</Tab>
            </TabList>

            <TabPanel value="workers">
              <Table columns={workerColumns} data={filteredWorkers} keyAccessor="id" striped hoverable emptyMessage="No workers match the current search" />
            </TabPanel>

            <TabPanel value="attendance">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setAttendanceFormOpen(true)}>
                  <CalendarCheck className="h-4 w-4" />
                  Record Attendance
                </Button>
                <div className="flex flex-wrap gap-2">
                  {attendanceFilters.map((s) => (
                    <button
                      key={s}
                      onClick={() => setAttStatus(s)}
                      className={
                        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors ' +
                        (attStatus === s ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')
                      }
                    >
                      {s === 'all' ? 'All' : labelize(s)}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-sm text-neutral-500">{filteredAttendance.length} records</span>
              </div>
              <Table columns={attendanceColumns} data={filteredAttendance} keyAccessor="id" striped hoverable emptyMessage="No attendance records match the current filters" />
            </TabPanel>

            <TabPanel value="wages">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={() => setWageModalOpen(true)}>
                  <Calculator className="h-4 w-4" />
                  Calculate Wage
                </Button>
                <p className="text-sm text-neutral-500">
                  Net pay = base hours × hourly rate + OT hours × OT rate − deductions + bonuses
                </p>
                <span className="ml-auto text-sm text-neutral-500">{filteredWages.length} records</span>
              </div>
              <Table columns={wageColumns} data={filteredWages} keyAccessor="id" striped hoverable emptyMessage="No wage records yet — calculate one to get started" />
            </TabPanel>
          </Tabs>
        </>
      )}

      {workerFormOpen && <WorkerFormModal isOpen onClose={() => setWorkerFormOpen(false)} onSubmit={handleCreateWorker} />}
      {attendanceFormOpen && (
        <AttendanceFormModal isOpen workers={workers} defaultDate={today} onClose={() => setAttendanceFormOpen(false)} onSubmit={handleRecordAttendance} />
      )}
      {wageModalOpen && (
        <WageCalculationModal isOpen workers={workers} onClose={() => setWageModalOpen(false)} onSubmit={handleCalculateWage} />
      )}
    </PageLayout>
  );
}
