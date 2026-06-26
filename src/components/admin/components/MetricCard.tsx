import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

function parseNumericValue(value: string | number): { numeric: number | null; prefix: string; suffix: string } {
  if (typeof value === 'number') return { numeric: value, prefix: '', suffix: '' };
  const match = value.match(/^([^\d]*)(\d+(?:[.,]\d+)?)([^\d]*)$/);
  if (!match) return { numeric: null, prefix: '', suffix: '' };
  return {
    numeric: parseFloat(match[2].replace(',', '.')),
    prefix: match[1],
    suffix: match[3],
  };
}

export function MetricCard({ label, value, change, icon: Icon, color, bg }: MetricCardProps) {
  const { numeric, prefix, suffix } = parseNumericValue(value);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasAnimated(true); },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isPositive = change.startsWith('+');
  const isNegative = change.startsWith('-');

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -3, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="p-4 bg-surface-elevated border border-border rounded-2xl cursor-default select-none"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>

      <p className="text-2xl font-bold tabular-nums">
        {numeric !== null && hasAnimated ? (
          <>
            {prefix}
            <CountUp
              end={numeric}
              duration={1.2}
              separator=","
              decimals={Number.isInteger(numeric) ? 0 : 2}
            />
            {suffix}
          </>
        ) : (
          value
        )}
      </p>

      <p className="text-sm text-foreground-muted mt-1">{label}</p>

      <p
        className={cn(
          'text-xs font-medium mt-1',
          isPositive && 'text-success-500',
          isNegative && 'text-danger-500',
          !isPositive && !isNegative && 'text-foreground-muted',
        )}
      >
        {change}
      </p>
    </motion.div>
  );
}
