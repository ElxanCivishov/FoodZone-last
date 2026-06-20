import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import { Gift, Star, ChevronLeft, Ticket } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Reward } from '@/types';

export function RewardsScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const session = useSessionStore((state) => state.session);

  const { data: rewardsResponse, isLoading } = useQuery({
    queryKey: ['rewards', session?.branchId],
    queryFn: () => get<Reward[]>(`/branches/${session?.branchId}/rewards`),
    enabled: !!session?.branchId,
  });
  const rewards = rewardsResponse?.data ?? [];

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('rewards.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white text-center">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h2 className="text-3xl font-bold">0</h2>
          <p className="opacity-90 mt-1">{t('rewards.points')}</p>
          <p className="text-sm opacity-75 mt-2">{t('rewards.earnPoints')}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">{t('rewards.available')}</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('rewards.noRewards')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-4 p-4 bg-surface-elevated border border-border rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{reward.title}</h4>
                    <p className="text-sm text-foreground-muted truncate">{reward.description}</p>
                  </div>
                  <button className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg">
                    {t('rewards.redeem')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
