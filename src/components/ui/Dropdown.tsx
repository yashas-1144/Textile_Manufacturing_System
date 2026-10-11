import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  triggerButtonProps?: Record<string, unknown>;
}

export function Dropdown({ trigger, items, align = 'right', triggerButtonProps }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        {...triggerButtonProps}
      >
        {trigger}
        <ChevronDown className={cn('h-4 w-4 ml-1 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 min-w-[180px] bg-white border border-neutral-200 rounded-lg shadow-elevated animate-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                'w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors',
                'hover:bg-neutral-50 focus:outline-none focus:bg-neutral-50',
                item.danger ? 'text-red-600' : 'text-neutral-700',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              role="menuitem"
              tabIndex={-1}
            >
              {item.icon && <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && <span className="text-xs text-neutral-400 font-mono">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface SelectItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownSelectProps {
  value: string;
  onChange: (value: string) => void;
  items: SelectItem[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function DropdownSelect({
  value,
  onChange,
  items,
  placeholder,
  disabled,
  className,
  label,
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = items.find((item) => item.value === value);

  return (
    <div className="w-full" ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm bg-white border rounded-lg appearance-none flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          disabled
            ? 'border-neutral-200'
            : 'border-neutral-300 hover:border-neutral-400',
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={cn('truncate', !selectedItem && placeholder && 'text-neutral-400')}>
          {selectedItem?.label || placeholder || 'Select...'}
        </span>
        <ChevronDown className={cn('h-4 w-4 ml-2 text-neutral-400 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-neutral-200 rounded-lg shadow-elevated animate-in max-h-60 overflow-auto">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                'w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors',
                'hover:bg-neutral-50 focus:outline-none focus:bg-neutral-50',
                item.disabled ? 'opacity-50 cursor-not-allowed' : 'text-neutral-700',
                value === item.value && 'bg-primary-50 text-primary-700'
              )}
              role="option"
              aria-selected={value === item.value}
            >
              {item.icon && <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
              {value === item.value && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}