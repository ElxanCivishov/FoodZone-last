import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  ConciergeBell,
  DollarSign,
  MessageSquareText,
  PackageCheck,
  Plus,
  QrCode,
  Settings,
  ShoppingBag,
  Tags,
  TimerReset,
  TrendingUp,
  TrendingDown,
  Users,
  UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDashboardStats, useOrdersByStatus, useWaiterRequests } from '@/hooks/useDashboard';
import { get } from '@/services/api';
import type { Category, Order, Table, WaiterRequest } from '@/types';
import { getLocalizedName } from '@/utils/i18nHelper';
import { MetricCard } from '../components/MetricCard';
import { SectionTitle } from '../components/SectionTitle';
import { useActiveBranchId } from '../hooks/useActiveBranch';
import type { AdminTab } from '../AdminApp';

type Translation = (key: string, options?: Record<string, unknown>) => string;
type DashboardTab = 'overview' | 'operations' | 'tables';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-success-500',
  served: 'bg-primary-500',
  cancelled: 'bg-danger-500',
};

interface DashboardViewProps {
  onSelectTab: (tab: AdminTab) => void;
}

interface AlertItem {
  tone: string;
  title: string;
  detail: string;
  target: AdminTab;
}

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  dotClassName: string;
}

export function DashboardView({ onSelectTab }: DashboardViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const needsOperationalData = activeTab === 'overview' || activeTab === 'operations';
  const needsTableData = activeTab === 'overview' || activeTab === 'operations' || activeTab === 'tables';
  const { data: stats, isLoading } = useDashboardStats();
  const { data: requests } = useWaiterRequests(undefined, {
    enabled: needsOperationalData,
    refetchInterval: activeTab === 'operations' ? 5000 : 15000,
    staleTime: 5000,
  });
  const { data: statusData } = useOrdersByStatus({
    enabled: activeTab === 'operations',
    refetchInterval: 15000,
    staleTime: 10000,
  });
  const activeBranchId = useActiveBranchId();
  const { data: tables } = useQuery({
    queryKey: ['tables', activeBranchId],
    queryFn: () => get<Table[]>('/qr/tables', activeBranchId ? { branchId: activeBranchId } : undefined),
    enabled: needsTableData && !!activeBranchId,
    staleTime: activeTab === 'tables' ? 5000 : 30000,
  });
  const { data: liveTables } = useQuery({
    queryKey: ['live-tables', activeBranchId],
    queryFn: () => get<any[]>('/dashboard/live-tables', { branchId: activeBranchId }),
    enabled: activeTab === 'tables' && !!activeBranchId,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const s = stats?.data;
  const activeRequests = (requests?.data || []).filter((request) => request.status !== 'done');
  const recentOrders = s?.recentOrders || [];

  const operationalAlerts = useMemo(() => {
    const now = Date.now();
    const oldPending = recentOrders.filter((order) => {
      if (!['pending', 'confirmed'].includes(order.status)) return false;
      return now - new Date(order.createdAt).getTime() > 15 * 60 * 1000;
    });
    const overduePreparing = recentOrders.filter((order) => {
      if (order.status !== 'preparing') return false;
      return now - new Date(order.updatedAt).getTime() > 30 * 60 * 1000;
    });
    const waitingReady = recentOrders.filter((order) => {
      if (order.status !== 'ready') return false;
      return now - new Date(order.updatedAt).getTime() > 10 * 60 * 1000;
    });
    const unansweredRequests = activeRequests.filter((request) => now - new Date(request.createdAt).getTime() > 5 * 60 * 1000);
    const inactiveTables = (tables?.data || []).filter((table) => table.status !== 'active');
    const missingQr = (tables?.data || []).filter((table) => !table.qrCode);

    return [
      oldPending.length > 0 && {
        tone: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        title: t('admin.dashboardView.alerts.delayedPending', { count: oldPending.length }),
        detail: t('admin.dashboardView.alerts.kitchenAttention'),
        target: 'orders',
      },
      overduePreparing.length > 0 && {
        tone: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        title: t('admin.dashboardView.alerts.longPreparing', { count: overduePreparing.length }),
        detail: t('admin.dashboardView.alerts.prepHigh'),
        target: 'orders',
      },
      waitingReady.length > 0 && {
        tone: 'text-success-500 bg-success-500/10 border-success-500/20',
        title: t('admin.dashboardView.alerts.readyWaiting', { count: waitingReady.length }),
        detail: t('admin.dashboardView.alerts.serviceFollowUp'),
        target: 'orders',
      },
      activeRequests.length > 0 && {
        tone: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        title: t('admin.dashboardView.alerts.activeRequests', { count: activeRequests.length }),
        detail: t('admin.dashboardView.alerts.tablesNeedHelp'),
        target: 'orders',
      },
      unansweredRequests.length > 0 && {
        tone: 'text-danger-500 bg-danger-500/10 border-danger-500/20',
        title: t('admin.dashboardView.alerts.unansweredRequests', { count: unansweredRequests.length }),
        detail: t('admin.dashboardView.alerts.waitingFive'),
        target: 'orders',
      },
      missingQr.length > 0 && {
        tone: 'text-danger-500 bg-danger-500/10 border-danger-500/20',
        title: t('admin.dashboardView.alerts.missingQr', { count: missingQr.length }),
        detail: t('admin.dashboardView.alerts.regenerateQr'),
        target: 'qr',
      },
      inactiveTables.length > 0 && {
        tone: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        title: t('admin.dashboardView.alerts.inactiveTables', { count: inactiveTables.length }),
        detail: t('admin.dashboardView.alerts.checkAvailability'),
        target: 'qr',
      },
    ].filter(Boolean) as AlertItem[];
  }, [activeRequests, recentOrders, tables?.data, t]);

  const activityItems = useMemo(() => buildActivityFeed(recentOrders, requests?.data || [], t), [recentOrders, requests?.data, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  const cards = [
    { label: t('admin.totalOrders'), value: s?.totalOrders || 0, change: t('admin.dashboardView.todayCount', { count: s?.todayOrders || 0 }), icon: ClipboardList, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { label: t('admin.revenue'), value: `$${(s?.totalRevenue || 0).toFixed(2)}`, change: t('admin.dashboardView.todayRevenue', { amount: (s?.todayRevenue || 0).toFixed(2) }), icon: DollarSign, color: 'text-success-500', bg: 'bg-success-500/10' },
    { label: t('admin.activeTables'), value: `${s?.activeTables || 0}/${s?.totalTables || 0}`, change: t('admin.dashboardView.pendingCount', { count: s?.pendingOrders || 0 }), icon: UsersRound, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('admin.dashboardView.liveRequests'), value: activeRequests.length, change: t('admin.dashboardView.readyCount', { count: s?.readyOrders || 0 }), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle title={t('admin.dashboard')} />
        <PanelAccessButtons
          onOpenKitchen={() => navigate('/kitchen')}
          onOpenWaiter={() => navigate('/waiter')}
          t={t}
        />
      </div>

      <DashboardTabs activeTab={activeTab} onChange={setActiveTab} t={t} />

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => (
              <MetricCard key={card.label} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <QuickActions onSelectTab={onSelectTab} t={t} />
            <OperationalAlerts alerts={operationalAlerts} onSelectTab={onSelectTab} t={t} />
            <PopularItems ordersToday={s?.todayOrders || 0} products={s?.popularProducts || []} onOpenMenu={() => onSelectTab('menu')} t={t} />
          </div>
        </>
      )}

      {activeTab === 'operations' && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <StatusBreakdown statusData={statusData?.data || []} t={t} />
            <OperationalAlerts alerts={operationalAlerts} onSelectTab={onSelectTab} t={t} />
            <TodayFocus
              pendingOrders={s?.pendingOrders || 0}
              readyOrders={s?.readyOrders || 0}
              activeRequests={activeRequests.length}
              qrMissing={(tables?.data || []).filter((table) => !table.qrCode).length}
              t={t}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LiveActivityFeed items={activityItems} onOpenKitchen={() => navigate('/kitchen')} t={t} />
            <ActiveRequestsPanel requests={activeRequests} onOpenWaiter={() => navigate('/waiter')} t={t} />
          </div>
        </>
      )}

      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {(liveTables?.data || []).length > 0 ? (
            <LiveTableGrid tables={liveTables?.data || []} />
          ) : (
            <Panel title={t('admin.dashboardView.liveTables')} icon={<UsersRound className="w-4 h-4 text-blue-500" />}>
              <EmptyPanelText>{t('admin.dashboardView.empty.liveTables')}</EmptyPanelText>
            </Panel>
          )}
          <TableHealthPanel tables={tables?.data || []} t={t} />
        </div>
      )}
    </div>
  );
}

function DashboardTabs({ activeTab, onChange, t }: { activeTab: DashboardTab; onChange: (tab: DashboardTab) => void; t: Translation }) {
  const tabs: Array<{ id: DashboardTab; label: string; detail: string; icon: React.ElementType; tone: string }> = [
    {
      id: 'overview',
      label: t('admin.dashboardView.tabs.overview'),
      detail: t('admin.dashboardView.tabDetails.overview'),
      icon: TimerReset,
      tone: 'text-primary-500 bg-primary-500/10 border-primary-500/25',
    },
    {
      id: 'operations',
      label: t('admin.dashboardView.tabs.operations'),
      detail: t('admin.dashboardView.tabDetails.operations'),
      icon: ClipboardList,
      tone: 'text-orange-500 bg-orange-500/10 border-orange-500/25',
    },
    {
      id: 'tables',
      label: t('admin.dashboardView.tabs.tables'),
      detail: t('admin.dashboardView.tabDetails.tables'),
      icon: UsersRound,
      tone: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`group flex min-h-[92px] items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
              selected
                ? 'border-primary-500/50 bg-primary-500/10 shadow-sm'
                : 'border-border bg-surface-elevated hover:-translate-y-0.5 hover:border-primary-500/30 hover:bg-surface'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${selected ? tab.tone : 'border-border bg-surface text-foreground-muted'}`}>
              <tab.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{tab.label}</p>
              <p className="mt-1 text-xs text-foreground-muted line-clamp-2">{tab.detail}</p>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${selected ? 'text-primary-500' : 'text-foreground-muted group-hover:translate-x-0.5'}`} />
          </button>
        );
      })}
    </div>
  );
}

function PanelAccessButtons({
  onOpenKitchen,
  onOpenWaiter,
  t,
}: {
  onOpenKitchen: () => void;
  onOpenWaiter: () => void;
  t: Translation;
}) {
  const links = [
    {
      label: t('admin.dashboardView.openKitchen'),
      icon: ChefHat,
      onClick: onOpenKitchen,
      className: 'border-orange-500/25 bg-orange-500/10 text-orange-600 hover:border-orange-500/45 hover:bg-orange-500/15',
    },
    {
      label: t('admin.dashboardView.openWaiter'),
      icon: ConciergeBell,
      onClick: onOpenWaiter,
      className: 'border-blue-500/25 bg-blue-500/10 text-blue-600 hover:border-blue-500/45 hover:bg-blue-500/15',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <button
          key={link.label}
          onClick={link.onClick}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${link.className}`}
        >
          <link.icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{link.label}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      ))}
    </div>
  );
}

function StatusBreakdown({ statusData, t }: { statusData: Array<{ status: string; count: number }>; t: Translation }) {
  const total = statusData.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...statusData.map((item) => item.count));

  return (
    <Panel title={t('admin.dashboardView.ordersByStatus')} icon={<TimerReset className="w-4 h-4 text-primary-500" />}>
      <div className="space-y-3">
        {statusData.length === 0 ? (
          <EmptyPanelText>{t('admin.dashboardView.empty.orderData')}</EmptyPanelText>
        ) : (
          statusData.map((item) => (
            <div key={item.status}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="capitalize text-foreground-muted">{t(`order.status.${item.status}`)}</span>
                <span className="font-semibold">
                  {item.count}
                  <span className="ml-1 text-xs font-normal text-foreground-muted">
                    {total > 0 ? `${Math.round((item.count / total) * 100)}%` : '0%'}
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-foreground-muted/10 overflow-hidden">
                <div className={statusColors[item.status] || 'bg-primary-500'} style={{ width: `${(item.count / max) * 100}%`, height: '100%' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function OperationalAlerts({ alerts, onSelectTab, t }: { alerts: AlertItem[]; onSelectTab: (tab: AdminTab) => void; t: Translation }) {
  return (
    <Panel title={t('admin.dashboardView.needsAttention')} icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}>
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-success-500/20 bg-success-500/10 p-3">
            <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t('admin.dashboardView.steady')}</p>
              <p className="text-xs text-foreground-muted">{t('admin.dashboardView.noAlerts')}</p>
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <button key={alert.title} onClick={() => onSelectTab(alert.target)} className={`w-full rounded-xl border p-3 text-left ${alert.tone}`}>
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold">{alert.title}</span>
                  <span className="block text-xs opacity-80">{alert.detail}</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" />
              </span>
            </button>
          ))
        )}
      </div>
    </Panel>
  );
}

function QuickActions({ onSelectTab, t }: { onSelectTab: (tab: AdminTab) => void; t: Translation }) {
  const actions = [
    { label: t('admin.dashboardView.quickActions.reviewOrders'), detail: t('admin.dashboardView.quickActions.openOrderQueue'), icon: ClipboardList, target: 'orders' as AdminTab },
    { label: t('admin.dashboardView.quickActions.manageMenu'), detail: t('admin.dashboardView.quickActions.productsCategories'), icon: ShoppingBag, target: 'menu' as AdminTab },
    { label: t('admin.categories.title'), detail: t('admin.dashboardView.quickActions.manageCategories'), icon: Tags, target: 'categories' as AdminTab },
    { label: t('admin.dashboardView.quickActions.checkQr'), detail: t('admin.dashboardView.quickActions.tablesQr'), icon: QrCode, target: 'qr' as AdminTab },
    { label: t('admin.dashboardView.quickActions.staffAccess'), detail: t('admin.dashboardView.quickActions.usersRoles'), icon: Users, target: 'staff' as AdminTab },
    { label: t('admin.dashboardView.quickActions.openAnalytics'), detail: t('admin.dashboardView.quickActions.statusRevenue'), icon: TimerReset, target: 'analytics' as AdminTab },
    { label: t('admin.dashboardView.quickActions.branchProfile'), detail: t('admin.dashboardView.quickActions.restaurantBranch'), icon: UsersRound, target: 'profile' as AdminTab },
    { label: t('admin.settings'), detail: t('admin.dashboardView.quickActions.branchDetails'), icon: Settings, target: 'settings' as AdminTab },
  ];

  return (
    <Panel title={t('admin.dashboardView.quickActions.title')} icon={<Plus className="w-4 h-4 text-primary-500" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelectTab(action.target)}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
              <action.icon className="w-4 h-4 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{action.label}</p>
              <p className="text-xs text-foreground-muted truncate">{action.detail}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0" />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function LiveActivityFeed({ items, onOpenKitchen, t }: { items: ActivityItem[]; onOpenKitchen: () => void; t: Translation }) {
  return (
    <Panel
      title={t('admin.dashboardView.liveActivity')}
      icon={<MessageSquareText className="w-4 h-4 text-blue-500" />}
      action={<PanelLinkButton onClick={onOpenKitchen} label={t('admin.dashboardView.openKitchen')} />}
    >
      <div className="space-y-2">
        {items.length === 0 ? (
          <EmptyPanelText>{t('admin.dashboardView.empty.liveActivity')}</EmptyPanelText>
        ) : (
          items.slice(0, 7).map((item) => (
            <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.dotClassName}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <span className="text-xs text-foreground-muted shrink-0">{timeAgo(item.time, t)}</span>
                </div>
                <p className="text-xs text-foreground-muted truncate">{item.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function TodayFocus({
  pendingOrders,
  readyOrders,
  activeRequests,
  qrMissing,
  t,
}: {
  pendingOrders: number;
  readyOrders: number;
  activeRequests: number;
  qrMissing: number;
  t: Translation;
}) {
  const focusItems = [
    { label: t('admin.dashboardView.focus.pendingOrders'), value: pendingOrders, tone: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: t('admin.dashboardView.focus.readyToServe'), value: readyOrders, tone: 'text-success-500', bg: 'bg-success-500/10' },
    { label: t('admin.dashboardView.focus.waiterRequests'), value: activeRequests, tone: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('admin.dashboardView.focus.missingQr'), value: qrMissing, tone: 'text-danger-500', bg: 'bg-danger-500/10' },
  ];

  return (
    <Panel title={t('admin.dashboardView.todayFocus')} icon={<Clock className="w-4 h-4 text-orange-500" />}>
      <div className="grid grid-cols-2 gap-2">
        {focusItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface p-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.bg}`}>
              <span className={`text-sm font-bold ${item.tone}`}>{item.value}</span>
            </div>
            <p className="text-xs text-foreground-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TableHealthPanel({ tables, t }: { tables: Table[]; t: Translation }) {
  const totalTables = tables.length;
  const activeTables = tables.filter((table) => table.status === 'active').length;
  const inactiveTables = totalTables - activeTables;
  const missingQr = tables.filter((table) => !table.qrCode).length;
  const items = [
    { label: t('admin.tables'), value: totalTables, tone: 'text-primary-500', bg: 'bg-primary-500/10' },
    { label: t('admin.activeTables'), value: activeTables, tone: 'text-success-500', bg: 'bg-success-500/10' },
    { label: t('admin.profileView.inactiveTables'), value: inactiveTables, tone: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('admin.dashboardView.focus.missingQr'), value: missingQr, tone: 'text-danger-500', bg: 'bg-danger-500/10' },
  ];

  return (
    <Panel title={t('admin.dashboardView.tabs.tables')} icon={<UsersRound className="w-4 h-4 text-blue-500" />}>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface p-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.bg}`}>
              <span className={`text-sm font-bold ${item.tone}`}>{item.value}</span>
            </div>
            <p className="text-xs text-foreground-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ActiveRequestsPanel({ requests, onOpenWaiter, t }: { requests: WaiterRequest[]; onOpenWaiter: () => void; t: Translation }) {
  return (
    <Panel
      title={t('admin.dashboardView.activeRequests')}
      icon={<MessageSquareText className="w-4 h-4 text-orange-500" />}
      action={<PanelLinkButton onClick={onOpenWaiter} label={t('admin.dashboardView.openWaiter')} />}
    >
      <div className="space-y-3">
        {requests.length === 0 ? (
          <EmptyPanelText>{t('admin.dashboardView.empty.activeRequests')}</EmptyPanelText>
        ) : (
          requests.slice(0, 8).map((request) => (
            <div key={request.id} className="p-3 bg-surface rounded-xl border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm capitalize">{t(`waiterPanel.requestTypes.${request.type}`)}</p>
                  <p className="text-xs text-foreground-muted">
                    {t('admin.dashboardView.tableTime', { table: request.table?.number || '?', time: timeAgo(request.createdAt, t) })}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold capitalize ${requestStatusClassName(request.status)}`}>
                  {t(`order.status.${request.status}`)}
                </span>
              </div>
              {request.message && <p className="mt-2 text-xs text-foreground-muted line-clamp-2">{request.message}</p>}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function PopularItems({
  products,
  ordersToday,
  onOpenMenu,
  t,
}: {
  products: Array<{ id: string; name: string; category?: Pick<Category, 'name' | 'nameAz' | 'nameEn' | 'nameRu' | 'nameTr'>; orderCount: number }>;
  ordersToday: number;
  onOpenMenu: () => void;
  t: Translation;
}) {
  return (
    <Panel
      title={t('admin.dashboardView.popularItems')}
      icon={<PackageCheck className="w-4 h-4 text-success-500" />}
      action={<PanelLinkButton onClick={onOpenMenu} label={t('admin.dashboardView.openMenu')} />}
    >
      <div className="space-y-3">
        {products.length === 0 ? (
          <EmptyPanelText>{t('admin.dashboardView.empty.popularItems')}</EmptyPanelText>
        ) : (
          products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-500">{index + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-foreground-muted truncate">{getLocalizedName(product.category) || t('admin.dashboardView.uncategorized')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{product.orderCount || '-'}</p>
                <p className="text-xs text-foreground-muted">{t('admin.dashboardView.todayCountShort', { count: ordersToday })}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function Panel({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="font-semibold truncate">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function PanelLinkButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary-500 hover:bg-primary-500/10">
      {label}
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );
}

function EmptyPanelText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground-muted py-4 text-center">{children}</p>;
}

function buildActivityFeed(orders: Order[], requests: WaiterRequest[], t: Translation): ActivityItem[] {
  const orderItems = orders.flatMap((order) => [
    {
      id: `order-created-${order.id}`,
      title: t('admin.dashboardView.activity.orderTitle', { orderNumber: order.orderNumber }),
      detail: t('admin.dashboardView.activity.orderPlaced', { table: order.table?.number || '?', total: order.total?.toFixed(2) }),
      time: order.createdAt,
      dotClassName: 'bg-primary-500',
    },
    {
      id: `order-status-${order.id}`,
      title: t('admin.dashboardView.activity.orderStatus', { orderNumber: order.orderNumber, status: t(`order.status.${order.status}`) }),
      detail: t('admin.dashboardView.activity.lastUpdated', { time: timeAgo(order.updatedAt, t) }),
      time: order.updatedAt,
      dotClassName: statusColors[order.status] || 'bg-primary-500',
    },
  ]);

  const requestItems = requests.map((request) => ({
    id: `request-${request.id}`,
    title: t('admin.dashboardView.activity.waiterRequest', { type: t(`waiterPanel.requestTypes.${request.type}`) }),
    detail: t('admin.dashboardView.activity.requestDetail', { table: request.table?.number || '?', status: t(`order.status.${request.status}`) }),
    time: request.createdAt,
    dotClassName: request.status === 'done' ? 'bg-success-500' : 'bg-orange-500',
  }));

  return [...orderItems, ...requestItems].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function requestStatusClassName(status: string) {
  if (status === 'pending') return 'bg-yellow-500/10 text-yellow-500';
  if (status === 'accepted') return 'bg-blue-500/10 text-blue-500';
  if (status === 'done') return 'bg-success-500/10 text-success-500';
  if (status === 'rejected') return 'bg-danger-500/10 text-danger-500';
  return 'bg-primary-500/10 text-primary-500';
}

export function ComparisonWidget({ data }: { data: { week: any; month: any } }) {
  const fmt = (n: number) => `${n.toFixed(2)} ₼`;
  const rows: Array<{ label: string; key: 'week' | 'month'; period: string }> = [
    { label: 'Bu həftə', key: 'week', period: 'keçən həftə' },
    { label: 'Bu ay', key: 'month', period: 'keçən ay' },
  ];

  return (
    <Panel title="Müqayisəli Analiz" icon={<TrendingUp className="w-4 h-4 text-primary-500" />}>
      <div className="space-y-3">
        {rows.map(({ label, key, period }) => {
          const d = data[key];
          const revUp = d.revenuePct >= 0;
          const ordUp = d.ordersPct >= 0;
          return (
            <div key={key} className="rounded-xl border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-foreground-muted mb-2">{label}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-foreground-muted mb-0.5">Gəlir</p>
                  <p className="text-base font-bold">{fmt(d.current.revenue)}</p>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${revUp ? 'text-success-500' : 'text-danger-500'}`}>
                    {revUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(d.revenuePct)}%
                    <span className="text-foreground-muted font-normal ml-1 text-[10px]">{period}</span>
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-foreground-muted mb-0.5">Sifariş</p>
                  <p className="text-base font-bold">{d.current.orders}</p>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${ordUp ? 'text-success-500' : 'text-danger-500'}`}>
                    {ordUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(d.ordersPct)}%
                    <span className="text-foreground-muted font-normal ml-1 text-[10px]">{period}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function LiveTableGrid({ tables }: { tables: Array<{ id: string; number: number; liveStatus: string; activeRevenue: number }> }) {
  const statusCfg: Record<string, { label: string; cls: string }> = {
    free:     { label: 'Boş',    cls: 'bg-surface border-border text-foreground-muted' },
    occupied: { label: 'Dolu',   cls: 'bg-orange-500/15 border-orange-500/40 text-orange-600' },
    payment:  { label: 'Ödəniş', cls: 'bg-success-500/15 border-success-500/40 text-success-600' },
  };

  const free     = tables.filter(t => t.liveStatus === 'free').length;
  const occupied = tables.filter(t => t.liveStatus === 'occupied').length;
  const payment  = tables.filter(t => t.liveStatus === 'payment').length;

  return (
    <Panel
      title="Canlı Masa Xəritəsi"
      icon={<UsersRound className="w-4 h-4 text-blue-500" />}
      action={
        <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <span className="text-orange-500 font-semibold">{occupied} dolu</span>
          <span>·</span>
          <span className="text-success-500 font-semibold">{payment} ödəniş</span>
          <span>·</span>
          <span>{free} boş</span>
        </div>
      }
    >
      <div className="grid grid-cols-5 gap-1.5">
        {tables.map(t => {
          const cfg = statusCfg[t.liveStatus] ?? statusCfg.free;
          return (
            <div key={t.id} className={`rounded-xl border p-2 text-center transition-colors ${cfg.cls}`}>
              <p className="text-sm font-bold leading-tight">{t.number}</p>
              <p className="text-[10px] leading-tight mt-0.5">{cfg.label}</p>
              {t.activeRevenue > 0 && (
                <p className="text-[10px] font-semibold leading-tight mt-0.5">{t.activeRevenue.toFixed(0)}₼</p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function timeAgo(value: string, t: Translation) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return t('admin.dashboardView.time.justNow');
  if (minutes < 60) return t('admin.dashboardView.time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('admin.dashboardView.time.hoursAgo', { count: hours });
  return t('admin.dashboardView.time.daysAgo', { count: Math.floor(hours / 24) });
}
