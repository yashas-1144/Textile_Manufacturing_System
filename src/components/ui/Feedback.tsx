import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-neutral-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingState({ size = 'md', text, className }: LoadingStateProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600', sizes[size])} />
      {text && <p className={cn('mt-3 text-neutral-500', textSizes[size])}>{text}</p>}
    </div>
  );
}

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  lines?: number;
}

export function Skeleton({ className, variant = 'text', width, height, lines = 1 }: SkeletonProps) {
  if (variant === 'circular') {
    return (
      <div
        className={cn('animate-pulse rounded-full bg-neutral-200', className)}
        style={{ width: width || '1rem', height: height || '1rem' }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn('animate-pulse rounded-lg bg-neutral-200', className)}
        style={{ width: width || '100%', height: height || '1rem' }}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-4 bg-neutral-200 rounded"
          style={{ width: i === lines - 1 && width ? width : '100%' }}
        />
      ))}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-400 mb-4">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
      {message && <p className="mt-2 text-sm text-neutral-500 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}