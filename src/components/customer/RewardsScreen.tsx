import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import { useAuthStore } from '@/stores/authStore';
import { Gift, Star, ChevronLeft, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';
import { Reward } from '@/types';

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS = [
  { name: 'Bronze',   key: 'bronze',   min: 0,    bar: 'bg-amber-600',  text: 'text-amber-700',  bg: 'from-amber-100 to-amber-50'   },
  { name: 'Silver',   key: 'silver',   min: 500,  bar: 'bg-slate-400',  text: 'text-slate-600',  bg: 'from-slate-100 to-slate-50'   },
  { name: 'Gold',     key: 'gold',     min: 1500, bar: 'bg-yellow-400', text: 'text-yellow-600', bg: 'from-yellow-100 to-yellow-50'  },
  { name: 'Platinum', key: 'platinum', min: 5000, bar: 'bg-violet-500', text: 'text-violet-600', bg: 'from-violet-100 to-violet-50'  },
] as const;

function getTier(points: number) {
  return [...TIERS].reverse().find(t => points >= t.min) ?? TIERS[0];
}

function getNextTier(points: number) {
  const idx = TIERS.findIndex(t => t === getTier(points));
  return TIERS[idx + 1] ?? null;
}

function LoyaltyCard({ points }: { points: number }) {
  const { t } = useTranslation();
  const tier = getTier(points);
  const next = getNextTier(points);
  const progress = next
    ? Math.min(100, ((points - tier.min) / (next.min - tier.min)) * 100)
    : 100;

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br p-5', tier.bg)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Cari səviyyə</p>
          <p className={cn('text-xl font-black mt-0.5', tier.text)}>
            {t(`rewards.tier.${tier.key}` as any, { defaultValue: tier.name })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums">{points}</p>
          <p className="text-xs text-foreground-muted">{t('rewards.points')}</p>
        </div>
      </div>

      {next && (
        <div className="space-y-1.5">
          <div className="h-2 bg-black/10 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', tier.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, type: 'spring', stiffness: 80 }}
            />
          </div>
          <p className="text-xs text-foreground-muted">
            {t('rewards.nextTier', {
              count: next.min - points,
              next: t(`rewards.tier.${next.key}` as any, { defaultValue: next.name }),
            })}
          </p>
        </div>
      )}

      {!next && (
        <p className="text-xs font-medium text-violet-600">En yüksək səviyyəsiniz! 🏆</p>
      )}
    </div>
  );
}

export function RewardsScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const session = useSessionStore((state) => state.session);
  const { user } = useAuthStore();

  // Fetch rewards catalogue
  const { data: rewardsResponse, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', session?.branchId],
    queryFn: () => get<Reward[]>(`/branches/${session?.branchId}/rewards`),
    enabled: !!session?.branchId,
  });
  const rewards = rewardsResponse?.data ?? [];

  // Fetch customer points if logged in
  const { data: customerData } = useQuery({
    queryKey: ['customer-me', user?.id, session?.branchId],
    queryFn: () =>
      get<{ points: number; totalOrders: number; totalSpent: number }>(
        `/customers/me?branchId=${session?.branchId}`,
      ),
    enabled: !!user?.id && !!session?.branchId,
  });
  const points = customerData?.data?.points ?? 0;

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('rewards.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Loyalty card with tier */}
        {user ? (
          <LoyaltyCard points={points} />
        ) : (
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white text-center">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-3xl font-bold">0</h2>
            <p className="opacity-90 mt-1">{t('rewards.points')}</p>
            <p className="text-sm opacity-75 mt-2">{t('rewards.earnPoints')}</p>
          </div>
        )}

        {/* Stats row */}
        {user && customerData?.data && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-elevated rounded-2xl border border-border p-4 text-center">
              <p className="text-2xl font-black">{customerData.data.totalOrders}</p>
              <p className="text-xs text-foreground-muted mt-0.5">Ümumi sifariş</p>
            </div>
            <div className="bg-surface-elevated rounded-2xl border border-border p-4 text-center">
              <p className="text-2xl font-black">{customerData.data.totalSpent.toFixed(0)} ₼</p>
              <p className="text-xs text-foreground-muted mt-0.5">Ümumi məbləğ</p>
            </div>
          </div>
        )}

        {/* Available rewards */}
        <div>
          <h3 className="font-semibold mb-3">{t('rewards.available')}</h3>
          {rewardsLoading ? (
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
                    <p className="text-xs text-primary-500 font-semibold mt-0.5">{reward.pointsRequired} xal</p>
                  </div>
                  <button
                    disabled={points < reward.pointsRequired}
                    className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t('rewards.redeem')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earn points hint */}
        <div className="text-center py-4">
          <p className="text-sm text-foreground-muted">{t('rewards.earnPoints')}</p>
          <p className="text-xs text-foreground-muted/70 mt-1">1 ₼ = 1 xal • 100 xal = 1 ₼ endirim</p>
        </div>
      </div>
    </div>
  );
}
