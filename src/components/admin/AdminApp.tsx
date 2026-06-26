import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { MobileHeader } from './components/MobileHeader';
import { Sidebar } from './components/Sidebar';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { useAdminRealtime } from './hooks/useAdminRealtime';
import { AnalyticsView } from './views/AnalyticsView';
import { CategoriesView } from './views/CategoriesView';
import { CashierView } from './views/CashierView';
import { CustomersView } from './views/CustomersView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { MenuView } from './views/MenuView';
import { OrdersView } from './views/OrdersView';
import { PromoView } from './views/PromoView';
import { QRView } from './views/QRView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { StaffView } from './views/StaffView';
import { MultiBranchView } from './views/MultiBranchView';
import { NotificationsView } from './views/NotificationsView';
import { ReservationView } from './views/ReservationView';

export type AdminTab =
  | 'dashboard' | 'menu' | 'categories' | 'orders' | 'qr' | 'staff'
  | 'analytics' | 'settings' | 'inventory' | 'cashier'
  | 'customers' | 'promo' | 'reports' | 'branches' | 'notifications' | 'reservations';

export function AdminApp() {
  const navigate = useNavigate();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const { resolvedTheme } = useThemeStore();
  const isConnected = useAdminRealtime();

  const selectTab = (tab: AdminTab) => {
    navigate(`/admin/${tab}`);
  };

  return (
    <div className={cn('min-h-screen bg-surface text-foreground', resolvedTheme === 'dark' ? 'dark' : '')}>
      <div className="flex min-h-screen">
        <Sidebar />

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <NotificationToastContainer />

        <div className="relative flex-1 min-w-0 flex flex-col">
          <MobileHeader
            sidebarOpen={sidebarOpen}
            isConnected={isConnected}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[65px] z-10 h-8 bg-gradient-to-b from-black/[0.04] to-transparent dark:from-black/20"
          />

          <main className="relative flex-1 p-4 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardView onSelectTab={selectTab} />} />
                <Route path="menu" element={<MenuView />} />
                <Route path="categories" element={<CategoriesView />} />
                <Route path="orders" element={<OrdersView />} />
                <Route path="qr" element={<QRView />} />
                <Route path="staff" element={<StaffView />} />
                <Route path="analytics" element={<AnalyticsView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="inventory" element={<InventoryView />} />
                <Route path="cashier" element={<CashierView />} />
                <Route path="customers" element={<CustomersView />} />
                <Route path="promo" element={<PromoView />} />
                <Route path="reports" element={<ReportsView />} />
                <Route path="branches" element={<MultiBranchView />} />
                <Route path="notifications" element={<NotificationsView />} />
                <Route path="reservations" element={<ReservationView />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
