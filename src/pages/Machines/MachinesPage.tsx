import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Plus, Cpu, Play, Square, AlertTriangle, Wrench, MoreVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Machine } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import { machineService, isMaintenanceDue, isMaintenanceSoon } from '@/services/machineService';
import type { MachineRecord } from '@/services/fixtures/machines';
import { MachineFormModal, MaintenanceModal } from './MachineModals';

const NOW = new Date();

const statusVariant: Record<Machine['status'], 'success' | 'neutral' | 'warning' | 'danger'> = {
  running: 'success',
  idle: 'neutral',
  maintenance: 'warning',
  breakdown: 'danger',
  offline: 'neutral',
};

const statusLabel: Record<Machine['status'], string> = {
  running: 'Running',
  idle: 'Idle',
  maintenance: 'Maintenance',
  breakdown: 'Breakdown',
  offline: 'Offline',
};

const typeFilters: { value: Machine['type'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'inspection', label: 'Inspection' },
];

export function MachinesPage() {
  const { data, setData, loading, error } = useServiceData(machineService.getMachines);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<Machine['type'] | 'all'>('all');
  const [status, setStatus] = useState<Machine['status'] | 'all'>('all');
  const [machineFormOpen, setMachineFormOpen] = useState(false);
  const [maintenanceTarget, setMaintenanceTarget] = useState<MachineRecord | null>(null);

  const machines = data ?? [];

  const query = search.trim().toLowerCase();
  const filtered = machines.filter((m) => {
    if (type !== 'all' && m.type !== type) return false;
    if (status !== 'all' && m.status !== status) return false;
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.model.toLowerCase().includes(query) ||
      m.manufacturer.toLowerCase().includes(query) ||
      m.location.toLowerCase().includes(query)
    );
  });

  const summary = {
    total: machines.length,
    running: machines.filter((m) => m.status === 'running').length,
    idle: machines.filter((m) => m.status === 'idle').length,
    maintenance: machines.filter((m) => m.status === 'maintenance').length,
    breakdown: machines.filter((m) => m.status === 'breakdown').length,
  };

  const applyStatus = (id: string, next: Machine['status'], extra: Partial<MachineRecord> = {}) => {
    setData((prev) =>
      prev ? prev.map((m) => (m.id === id ? { ...m, status: next, updatedAt: new Date().toISOString(), ...extra } : m)) : prev
    );
  };

  const reload = async () => {
    try {
      setData(await machineService.getMachines());
    } catch {
      /* keep current view on refresh failure */
    }
  };

  const handleStart = (m: MachineRecord) => {
    applyStatus(m.id, 'running', { currentOutput: Math.round(m.capacity * 0.95), efficiency: 95 });
    void machineService.setStatus(m.id, 'running').then(reload).catch(reload);
    addToast({ type: 'success', title: `${m.name} started`, message: 'Machine status set to Running.' });
  };

  const handleStop = (m: MachineRecord) => {
    applyStatus(m.id, 'idle', { currentOutput: 0, efficiency: 0 });
    void machineService.setStatus(m.id, 'idle').then(reload).catch(reload);
    addToast({ type: 'info', title: `${m.name} stopped`, message: 'Machine status set to Idle.' });
  };

  const handleBreakdown = (m: MachineRecord) => {
    applyStatus(m.id, 'breakdown', { currentOutput: 0, efficiency: 0 });
    void machineService.setStatus(m.id, 'breakdown').then(reload).catch(reload);
    addToast({ type: 'warning', title: `${m.name} reported as breakdown`, message: 'Maintenance team notified.' });
  };

  const handleAddMachine = async (input: Parameters<typeof machineService.createMachine>[0]) => {
    try {
      const machine = await machineService.createMachine(input);
      setData((prev) => (prev ? [machine, ...prev] : [machine]));
      setMachineFormOpen(false);
      addToast({ type: 'success', title: 'Machine added', message: `${machine.name} was added to the machine list.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not add machine', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleScheduleMaintenance = async (date: string, notes: string) => {
    const target = maintenanceTarget;
    if (!target) return;
    try {
      await machineService.scheduleMaintenance(target.id, date, notes);
      applyStatus(target.id, 'maintenance', { nextMaintenance: date });
      setMaintenanceTarget(null);
      addToast({
        type: 'success',
        title: 'Maintenance scheduled',
        message: `${target.name} scheduled for ${date}.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not schedule maintenance', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const columns: Column<MachineRecord>[] = [
    {
      key: 'name',
      header: 'Machine',
      width: '200px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.name}</p>
          <p className="text-xs text-neutral-500">{row.model} · {row.manufacturer}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '110px',
      accessor: (row) => (
        <Badge variant="outline" size="sm">
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </Badge>
      ),
    },
    { key: 'location', header: 'Location', width: '160px', accessor: 'location' },
    {
      key: 'utilization',
      header: 'Utilization',
      width: '160px',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={cn('h-full rounded-full', row.utilization >= 70 ? 'bg-green-500' : row.utilization >= 40 ? 'bg-amber-500' : 'bg-red-500')}
              style={{ width: `${row.utilization}%` }}
            />
          </div>
          <span className="text-xs font-medium text-neutral-600">{row.utilization}%</span>
        </div>
      ),
    },
    {
      key: 'downtimeHours',
      header: 'Downtime',
      width: '100px',
      align: 'right',
      accessor: (row) => (
        <span className={cn(row.downtimeHours >= 24 ? 'text-red-600 font-medium' : 'text-neutral-600')}>
          {row.downtimeHours} h
        </span>
      ),
    },
    {
      key: 'nextMaintenance',
      header: 'Next Maint.',
      width: '150px',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span>{row.nextMaintenance}</span>
          {isMaintenanceDue(row, NOW) && <Badge variant="danger" size="sm">Due</Badge>}
          {isMaintenanceSoon(row, NOW) && !isMaintenanceDue(row, NOW) && <Badge variant="warning" size="sm">Soon</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      accessor: (row) => (
        <Badge variant={statusVariant[row.status]} dot>
          {statusLabel[row.status]}
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
          triggerButtonProps={{ 'aria-label': `Actions for ${row.name}` }}
          items={[
            { label: 'Start', icon: <Play className="h-4 w-4" />, disabled: row.status === 'running', onClick: () => handleStart(row) },
            { label: 'Stop', icon: <Square className="h-4 w-4" />, disabled: row.status === 'idle', onClick: () => handleStop(row) },
            { label: 'Report Breakdown', icon: <AlertTriangle className="h-4 w-4" />, danger: true, disabled: row.status === 'breakdown', onClick: () => handleBreakdown(row) },
            { label: 'Schedule Maintenance', icon: <Wrench className="h-4 w-4" />, onClick: () => setMaintenanceTarget(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Machine Management"
      description="Track machine status, utilization, downtime, and maintenance schedules"
      actions={
        <Button onClick={() => setMachineFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Machine
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading machines…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Total Machines" value={summary.total} icon={<Cpu className="h-5 w-5" />} accent="primary" />
            <StatCard label="Running" value={summary.running} icon={<Play className="h-5 w-5" />} accent="success" onClick={() => setStatus('running')} />
            <StatCard label="Idle" value={summary.idle} icon={<Square className="h-5 w-5" />} accent="neutral" onClick={() => setStatus('idle')} />
            <StatCard label="Maintenance" value={summary.maintenance} icon={<Wrench className="h-5 w-5" />} accent="warning" onClick={() => setStatus('maintenance')} />
            <StatCard label="Breakdown" value={summary.breakdown} icon={<AlertTriangle className="h-5 w-5" />} accent="danger" onClick={() => setStatus('breakdown')} />
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {typeFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setType(f.value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    type === f.value ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatus('all')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  status === 'all' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                All Status
              </button>
              {(['running', 'idle', 'maintenance', 'breakdown'] as Machine['status'][]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                    status === s ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {statusLabel[s]}
                </button>
              ))}
              <span className="ml-auto text-sm text-neutral-500">
                {filtered.length} of {machines.length} machines
              </span>
            </div>
          </div>

          <Table columns={columns} data={filtered} keyAccessor="id" striped hoverable emptyMessage="No machines match the current filters" />
        </>
      )}

      {machineFormOpen && <MachineFormModal isOpen onClose={() => setMachineFormOpen(false)} onSubmit={handleAddMachine} />}
      <MaintenanceModal
        isOpen={maintenanceTarget !== null}
        machine={maintenanceTarget}
        onClose={() => setMaintenanceTarget(null)}
        onSchedule={handleScheduleMaintenance}
      />
    </PageLayout>
  );
}
