import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ChartWrapperProps {
  children: ReactNode;
  height?: number;
  className?: string;
}

function ChartWrapper({ children, height = 300, className }: ChartWrapperProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; label: string; color?: string }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function LineChart({ data, xKey, lines, height = 300, showGrid = true, showLegend = true, showTooltip = true, className }: LineChartProps) {
  return (
    <ChartWrapper height={height} className={className}>
      <RechartsLineChart data={data} margin={{ top: 10, right: showLegend ? 20 : 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />}
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        {showTooltip && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />}
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color || COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartWrapper>
  );
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: { key: string; label: string; color?: string; opacity?: number }[];
  height?: number;
  stacked?: boolean;
  className?: string;
}

export function AreaChart({ data, xKey, areas, height = 300, stacked = false, className }: AreaChartProps) {
  return (
    <ChartWrapper height={height} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.label}
            stroke={area.color || COLORS[index % COLORS.length]}
            fill={area.color || COLORS[index % COLORS.length]}
            fillOpacity={area.opacity ?? 0.3}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ChartWrapper>
  );
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; label: string; color?: string }[];
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  className?: string;
}

export function BarChart({ data, xKey, bars, height = 300, horizontal = false, stacked = false, className }: BarChartProps) {
  return (
    <ChartWrapper height={height} className={className}>
      {horizontal ? (
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <YAxis type="category" dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <XAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color || COLORS[index % COLORS.length]}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsBarChart>
      ) : (
        <RechartsBarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color || COLORS[index % COLORS.length]}
              radius={[0, 0, 4, 4]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsBarChart>
      )}
    </ChartWrapper>
  );
}

interface PieChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export function PieChart({ data, dataKey, nameKey, height = 300, innerRadius = 60, outerRadius = 100, className }: PieChartProps) {
  return (
    <ChartWrapper height={height} className={className}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
        <Legend />
      </RechartsPieChart>
    </ChartWrapper>
  );
}

export type KPICardAccent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  supporting?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accent?: KPICardAccent;
  onClick?: () => void;
  className?: string;
}

const KPI_ACCENTS: Record<KPICardAccent, string> = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-blue-50 text-blue-600',
  neutral: 'bg-neutral-100 text-neutral-600',
};

export function KPICard({ title, value, change, changeLabel, supporting, icon, trend = 'neutral', accent = 'primary', onClick, className }: KPICardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-neutral-500',
  };

  const trendIcons = {
    up: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>,
    down: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
    neutral: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>,
  };

  const hasMeta = change !== undefined || changeLabel || supporting;

  return (
    <div
      className={cn(
        'bg-white border border-neutral-200 rounded-xl p-5 shadow-card transition-all',
        onClick && 'cursor-pointer hover:shadow-elevated hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-600 truncate">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 tracking-tight">{value}</p>
          {hasMeta && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {change !== undefined && (
                <span className={cn('inline-flex items-center gap-0.5 text-sm font-medium', trendColors[trend])}>
                  {trendIcons[trend]}
                  {`${change >= 0 ? '+' : ''}${change}%`}
                </span>
              )}
              {(changeLabel || supporting) && (
                <span className="text-sm text-neutral-500">{changeLabel || supporting}</span>
              )}
            </div>
          )}
        </div>
        {icon && <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', KPI_ACCENTS[accent])}>{icon}</div>}
      </div>
    </div>
  );
}