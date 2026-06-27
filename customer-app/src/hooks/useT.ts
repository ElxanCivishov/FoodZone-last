import { useUIStore } from '@/store';
import T from '@/i18n/translations';
import type { Translations } from '@/i18n/translations';

export function useT(): Translations {
  const language = useUIStore((s) => s.language);
  return T[language];
}
