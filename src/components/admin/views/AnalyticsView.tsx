import type { ReactNode } from 'react';
import { useDashboardStats, useOrdersByStatus } from '@/hooks/useDashboard';
import { SectionTitle } from '../components/SectionTitle';

export function AnalyticsView() {
  const { data: stats } = useDashboardStats();
  const { data: statusData } = useOrdersByStatus();
  const max = Math.max(1, ...(statusData?.data || []).map((status) => status.count));

  return (
    <div className="space-y-6">
      <SectionTitle title="Analytics" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-elevated border border-border rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {(statusData?.data || []).map((item) => (
              <div key={item.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{item.status}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-foreground-muted/10 overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: `${(item.count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface-elevated border border-border rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Today</h3>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Orders" value={stats?.data?.todayOrders || 0} />
            <Metric label="Revenue" value={`$${(stats?.data?.todayRevenue || 0).toFixed(2)}`} />
            <Metric label="Pending" value={stats?.data?.pendingOrders || 0} />
            <Metric label="Ready" value={stats?.data?.readyOrders || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="p-3 bg-surface border border-border rounded-xl">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
