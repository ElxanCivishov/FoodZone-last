import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AppSelect({ value, options, onChange, placeholder, disabled, className }: AppSelectProps) {
  const selected = options.find(o => o.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        className={cn(
          'group flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left text-sm transition-colors',
          'hover:border-primary-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className={cn('truncate', !selected && 'text-foreground-muted')}>
          {selected ? selected.label : (placeholder ?? 'Seçin...')}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-data-[open]:rotate-180" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        transition
        className={cn(
          'z-[9999] w-[var(--button-width)] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-xl focus:outline-none',
          '[--anchor-gap:6px]',
          'transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
        )}
      >
        {options.map(option => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className={({ focus, selected: sel }) =>
              cn(
                'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm transition-colors',
                focus && 'bg-primary-500/10 text-primary-500',
                sel && !focus && 'text-primary-500',
                !focus && !sel && 'text-foreground',
              )
            }
          >
            {({ selected: sel }) => (
              <>
                <span className="truncate">{option.label}</span>
                {sel && <Check className="h-4 w-4 shrink-0" />}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
