import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';

export interface DateRangeValue {
  from: string;
  to: string;
}

export interface DateRangePreset {
  label: string;
  getValue: () => DateRangeValue;
}

interface DateRangeFieldProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  locale?: string;
  presets?: DateRangePreset[];
  disabled?: boolean;
  className?: string;
}

const fallbackLocale = 'az-AZ';

export function DateRangeField({
  value,
  onChange,
  locale = fallbackLocale,
  presets = [],
  disabled,
  className,
}: DateRangeFieldProps) {
  const selectedFrom = parseIsoDate(value.from);
  const selectedTo = parseIsoDate(value.to);
  const initialMonth = selectedFrom ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialMonth));
  const [draftFrom, setDraftFrom] = useState<Date | null>(selectedFrom);
  const [draftTo, setDraftTo] = useState<Date | null>(selectedTo);

  const displayText = useMemo(() => {
    if (!selectedFrom || !selectedTo) return '';
    return `${formatDate(selectedFrom, locale)} - ${formatDate(selectedTo, locale)}`;
  }, [locale, selectedFrom, selectedTo]);

  const months = useMemo(
    () => [visibleMonth, addMonths(visibleMonth, 1)],
    [visibleMonth],
  );

  const commitRange = (from: Date | null, to: Date | null) => {
    if (!from || !to) return;
    const normalized = normalizeRange(from, to);
    onChange({ from: toIsoDate(normalized.from), to: toIsoDate(normalized.to) });
  };

  const handleDayClick = (date: Date) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(date);
      setDraftTo(null);
      return;
    }

    const normalized = normalizeRange(draftFrom, date);
    setDraftFrom(normalized.from);
    setDraftTo(normalized.to);
    onChange({ from: toIsoDate(normalized.from), to: toIsoDate(normalized.to) });
  };

  const handlePreset = (preset: DateRangePreset) => {
    const next = preset.getValue();
    const from = parseIsoDate(next.from);
    const to = parseIsoDate(next.to);
    setDraftFrom(from);
    setDraftTo(to);
    if (from) setVisibleMonth(startOfMonth(from));
    onChange(next);
  };

  const clearDraft = () => {
    setDraftFrom(selectedFrom);
    setDraftTo(selectedTo);
  };

  return (
    <Popover className={cn('relative', className)}>
      <PopoverButton
        disabled={disabled}
        className={cn(
          'flex h-10 w-full min-w-[260px] items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left text-sm transition-colors',
          'hover:border-primary-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className={cn('truncate', !displayText && 'text-foreground-muted')}>
          {displayText || 'Tarix araligi'}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-foreground-muted" />
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        transition
        className={cn(
          'z-[9999] w-[min(720px,calc(100vw-24px))] rounded-2xl border border-border bg-surface-elevated p-4 shadow-xl focus:outline-none',
          '[--anchor-gap:8px]',
          'transition duration-100 ease-out data-[closed]:translate-y-1 data-[closed]:opacity-0',
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Tarix araligi</p>
              <p className="text-xs text-foreground-muted">
                {draftFrom && draftTo
                  ? `${formatDate(draftFrom, locale)} - ${formatDate(draftTo, locale)}`
                  : 'Baslangic ve bitis tarixini secin'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted hover:bg-surface hover:text-foreground"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted hover:bg-surface hover:text-foreground"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted hover:bg-surface hover:text-foreground"
                aria-label="Reset draft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {presets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-500"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {months.map((month) => (
              <CalendarMonth
                key={month.toISOString()}
                month={month}
                locale={locale}
                from={draftFrom}
                to={draftTo}
                onDayClick={handleDayClick}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!draftFrom || !draftTo}
              onClick={() => commitRange(draftFrom, draftTo)}
              className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tetbiq et
            </button>
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}

function CalendarMonth({
  month,
  locale,
  from,
  to,
  onDayClick,
}: {
  month: Date;
  locale: string;
  from: Date | null;
  to: Date | null;
  onDayClick: (date: Date) => void;
}) {
  const days = useMemo(() => getCalendarGrid(month), [month]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold">
        {formatMonth(month, locale)}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1 text-[11px] font-semibold text-foreground-muted">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === month.getMonth();
          const selected = isSameDay(day, from) || isSameDay(day, to);
          const inRange = isInRange(day, from, to);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                !inCurrentMonth && 'text-foreground-muted/45',
                inCurrentMonth && !selected && !inRange && 'hover:bg-primary-500/10',
                inRange && !selected && 'bg-primary-500/10 text-primary-500',
                selected && 'bg-primary-500 text-white',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseIsoDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function normalizeRange(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? { from: a, to: b } : { from: b, to: a };
}

function isSameDay(a: Date, b: Date | null) {
  return !!b && toIsoDate(a) === toIsoDate(b);
}

function isInRange(day: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  return day.getTime() >= from.getTime() && day.getTime() <= to.getTime();
}

function getCalendarGrid(month: Date) {
  const first = startOfMonth(month);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayIndex);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function getWeekdayLabels(locale: string) {
  const monday = new Date(2026, 0, 5);
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(addDays(monday, index)),
  );
}

function formatMonth(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
