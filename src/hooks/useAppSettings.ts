import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';

export interface AppSettings {
  id: string;
  defaultPrepTime: number;
  urgencyWarnMin: number;
  urgencyDangerMin: number;
  kitchenAutoPrint: boolean;
  kitchenSoundOn: boolean;
  waiterSoundOn: boolean;
}

export const DEFAULT_SETTINGS: Omit<AppSettings, 'id'> = {
  defaultPrepTime: 15,
  urgencyWarnMin: 4,
  urgencyDangerMin: 8,
  kitchenAutoPrint: false,
  kitchenSoundOn: true,
  waiterSoundOn: true,
};

export function useAppSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => get<AppSettings>('/settings'),
    staleTime: 60_000,
  });
}
