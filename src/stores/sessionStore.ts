import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionData, QRScanResult } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { post } from '@/services/api';

interface SessionState {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  setSession: (session: SessionData) => void;
  clearSession: () => void;
  validateQR: (qrData: string) => Promise<QRScanResult>;
  updateLanguage: (language: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,
      setSession: (session) => set({ session, error: null }),
      clearSession: () => {
        set({ session: null, error: null });
        localStorage.removeItem(STORAGE_KEYS.CART);
      },
      validateQR: async (qrData: string) => {
        set({ isLoading: true, error: null });
        try {
          let result: QRScanResult;
          try {
            const response: any = await post('/qr/validate', { qrData });
            result = response.data;
          } catch {
            const data = JSON.parse(qrData);
            result = {
              restaurantId: data.restaurantId || 'demo',
              branchId: data.branchId || 'demo-branch',
              tableId: data.tableId || 'demo-table',
              tableNumber: data.tableNumber || '1',
              branchName: 'Sahil',
              restaurantName: 'FoodZone',
              language: data.language || 'az',
              valid: true,
            };
          }
          if (!result.valid) {
            set({ error: result.message || 'Invalid QR code', isLoading: false });
            return result;
          }
          const session: SessionData = {
            restaurantId: result.restaurantId,
            branchId: result.branchId,
            tableId: result.tableId,
            tableNumber: result.tableNumber,
            language: result.language || 'az',
            sessionId: generateId(),
          };
          set({ session, isLoading: false });
          return result;
        } catch (error: any) {
          set({ error: error.message || 'Network error', isLoading: false });
          throw error;
        }
      },
      updateLanguage: (language: string) => {
        const session = get().session;
        if (session) set({ session: { ...session, language } });
      },
    }),
    { name: STORAGE_KEYS.SESSION, partialize: (state) => ({ session: state.session }) }
  )
);

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
