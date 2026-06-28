import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

export const COUNTRIES = [
  { code: 'AZ', flag: '🇦🇿', prefix: '+994', mask: '(##) ###-##-##' },
  { code: 'TR', flag: '🇹🇷', prefix: '+90',  mask: '(###) ###-##-##' },
  { code: 'RU', flag: '🇷🇺', prefix: '+7',   mask: '(###) ###-##-##' },
  { code: 'UA', flag: '🇺🇦', prefix: '+380', mask: '(##) ###-##-##'  },
  { code: 'GE', flag: '🇬🇪', prefix: '+995', mask: '(###) ##-##-##'  },
  { code: 'US', flag: '🇺🇸', prefix: '+1',   mask: '(###) ###-####'  },
  { code: 'GB', flag: '🇬🇧', prefix: '+44',  mask: '(####) ######'   },
  { code: 'DE', flag: '🇩🇪', prefix: '+49',  mask: '(###) #######'   },
] as const;

export type Country = (typeof COUNTRIES)[number];
export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

function maxDigits(mask: string) {
  return (mask.match(/#/g) ?? []).length;
}

/** Apply mask — stops at last digit, no trailing separators */
function applyMask(digits: string, mask: string): string {
  let result = '';
  let di = 0;
  for (let mi = 0; mi < mask.length; mi++) {
    if (di >= digits.length) break;
    if (mask[mi] === '#') {
      result += digits[di++];
    } else {
      result += mask[mi];
    }
  }
  return result;
}

function rawDigits(formatted: string) {
  return formatted.replace(/\D/g, '');
}

interface Props {
  value: string;          // formatted display value
  country: Country;
  onChange: (formatted: string, country: Country) => void;
  onCountryChange: (c: Country) => void;
  error?: string;
  className?: string;
}

export default function PhoneInput({
  value, country, onChange, onCountryChange, error, className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── Dropdown position ── */
  const openDropdown = () => {
    if (wrapRef.current) setDropRect(wrapRef.current.getBoundingClientRect());
    setOpen(true);
  };

  /* ── Close on outside click or scroll ── */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      const inWrap = wrapRef.current?.contains(t);
      const inPortal = document.getElementById('phone-dd')?.contains(t);
      if (!inWrap && !inPortal) setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  /* ── Typing ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = rawDigits(e.target.value).slice(0, maxDigits(country.mask));
    onChange(applyMask(digits, country.mask), country);
  };

  /* ── Backspace: strip last raw digit ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const d = rawDigits(value);
      onChange(applyMask(d.slice(0, -1), country.mask), country);
    }
  };

  /* ── Country select ── */
  const handleSelect = (c: Country) => {
    onCountryChange(c);
    onChange('', c);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className={`flex h-12 rounded-xl border overflow-hidden transition-colors ${
        error ? 'border-coral bg-coral/5' : 'border-border-light bg-white focus-within:border-primary'
      }`}>
        {/* Country trigger */}
        <button
          type="button"
          onClick={() => open ? setOpen(false) : openDropdown()}
          className="flex items-center gap-1.5 px-3 border-r border-border-light bg-surface-elevated shrink-0 hover:bg-gray-100 transition-colors"
        >
          <span className="text-[16px] leading-none">{country.flag}</span>
          <span className="text-[12px] font-bold text-text-secondary">{country.prefix}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={12} className="text-text-tertiary" />
          </motion.div>
        </button>

        {/* Input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={applyMask('0'.repeat(maxDigits(country.mask)), country.mask)}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 text-[14px] text-text-primary placeholder:text-text-tertiary/50 outline-none bg-transparent"
        />
      </div>

      {error && <p className="text-coral text-[11px] mt-1">{error}</p>}

      {/* Dropdown rendered via portal to escape overflow-hidden parents */}
      {createPortal(
        <AnimatePresence>
          {open && dropRect && (
            <div
              id="phone-dd"
              style={{
                position: 'fixed',
                top: dropRect.bottom + 4,
                left: dropRect.left,
                width: dropRect.width,
                zIndex: 9999,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={SPRING}
                className="bg-white rounded-2xl shadow-xl border border-border-light overflow-hidden"
              >
                {COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-elevated ${
                      c.code === country.code ? 'bg-primary-light' : ''
                    }`}
                  >
                    <span className="text-[17px] leading-none">{c.flag}</span>
                    <span className="text-[13px] font-semibold text-text-primary flex-1">{c.code}</span>
                    <span className="text-[12px] text-text-secondary">{c.prefix}</span>
                    {c.code === country.code && (
                      <Check size={13} className="text-primary" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById('app-root') ?? document.body
      )}
    </div>
  );
}
