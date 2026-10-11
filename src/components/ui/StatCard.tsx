import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type StatAccent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: StatAccent;
  hint?: string;
  onClick?: () => void;
}

const ACCENTS: Record<StatAccent, string> = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600',
  neutral: 'bg-neutral-100 text-neutral-600',
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, accent = 'primary', hint, onClick, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white border border-neutral-200 rounded-xl p-4 shadow-card transition-all',
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
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', ACCENTS[accent])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-neutral-600">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {hint && <p className="truncate text-xs text-neutral-400">{hint}</p>}
        </div>
      </div>
    </div>
  )
);

StatCard.displayName = 'StatCard';
