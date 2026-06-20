import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BarChart3, CheckCircle2, ClipboardList, Clock, DollarSign, Edit, LayoutDashboard,
  LogOut, Menu, Plus, QrCode, RefreshCw, Settings, Trash2, Utensils, Users,
  UsersRound, Wifi, XCircle
} from 'lucide-react';
import { useDashboardStats, useOrders, useOrdersByStatus, useWaiterRequests } from '@/hooks/useDashboard';
import { useStaff } from '@/hooks/useStaff';
import { useSocketContext } from '@/services/socket';
import { useUIStore } from '@/stores/uiStore';
import { useThemeStore } from '@/stores/themeStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { del, get, patch, post } from '@/services/api';
import { Branch, Category, OrderStatus, Product, Table } from '@/types';
import { cn } from '@/utils/cn';

const tabs = [
  { id: 'dashboard', label: 'admin.dashboard', icon: LayoutDashboard },
  { id: 'menu', label: 'admin.menu', icon: Utensils },
  { id: 'orders', label: 'admin.orders', icon: ClipboardList },
  { id: 'qr', label: 'admin.qrCodes', icon: QrCode },
  { id: 'staff', label: 'admin.staff', icon: Users },
  { id: 'analytics', label: 'admin.analytics', icon: BarChart3 },
  { id: 'settings', label: 'admin.settings', icon: Settings },
];

const nextStatuses: Record<string, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
};

function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => get<Branch[]>('/branches'),
  });
}

function useActiveBranchId() {
  const { data } = useBranches();
  return data?.data?.[0]?.id || '';
}

function useAdminRealtime() {
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    socket.emit('room:join', { room: 'admin', role: 'admin' });

    const refreshOps = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'by-status'] });
    };
    const refreshMenu = () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    const refreshQr = () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    socket.on('kitchen:new:order', refreshOps);
    socket.on('order:status:changed', refreshOps);
    socket.on('waiter:new:request', refreshOps);
    socket.on('waiter:request:accepted', refreshOps);
    socket.on('waiter:request:completed', refreshOps);
    socket.on('menu:changed', refreshMenu);
    socket.on('qr:changed', refreshQr);

    return () => {
      socket.off('kitchen:new:order', refreshOps);
      socket.off('order:status:changed', refreshOps);
      socket.off('waiter:new:request', refreshOps);
      socket.off('waiter:request:accepted', refreshOps);
      socket.off('waiter:request:completed', refreshOps);
      socket.off('menu:changed', refreshMenu);
      socket.off('qr:changed', refreshQr);
      socket.emit('room:leave', { room: 'admin' });
    };
  }, [socket, queryClient]);

  return isConnected;
}

export function AdminApp() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const { resolvedTheme } = useThemeStore();
  const isConnected = useAdminRealtime();

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className={cn('min-h-screen bg-surface text-foreground', resolvedTheme === 'dark' ? 'dark' : '')}>
      <div className="lg:hidden sticky top-0 z-40 bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold">FoodZone Admin</h1>
        <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
      </div>

      <div className="flex min-h-screen">
        <aside className={cn(
          'fixed lg:sticky top-0 left-0 z-30 h-screen w-64 bg-surface-elevated border-r border-border transform transition-transform lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl">FoodZone</h2>
              <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
            </div>
            <div className={cn(
              'mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
              isConnected ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'
            )}>
              <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success-500' : 'bg-danger-500')} />
              {isConnected ? 'Live' : 'Reconnecting'}
            </div>
          </div>
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    activeTab === tab.id ? 'bg-primary-500/10 text-primary-500' : 'text-foreground-muted hover:text-foreground hover:bg-foreground-muted/5'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {t(tab.label)}
                </button>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-danger-500 hover:bg-danger-500/5 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'menu' && <MenuView />}
            {activeTab === 'orders' && <OrdersView />}
            {activeTab === 'qr' && <QRView />}
            {activeTab === 'staff' && <StaffView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      {action}
    </div>
  );
}

function DashboardView() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: requests } = useWaiterRequests();
  const s = stats?.data;
  const pendingRequests = (requests?.data || []).filter((r) => r.status !== 'done').length;

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size={32} /></div>;

  const cards = [
    { label: t('admin.totalOrders'), value: s?.totalOrders || 0, change: `+${s?.todayOrders || 0} today`, icon: ClipboardList, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { label: t('admin.revenue'), value: `$${(s?.totalRevenue || 0).toFixed(2)}`, change: `+$${(s?.todayRevenue || 0).toFixed(2)} today`, icon: DollarSign, color: 'text-success-500', bg: 'bg-success-500/10' },
    { label: t('admin.activeTables'), value: `${s?.activeTables || 0}/${s?.totalTables || 0}`, change: `${s?.pendingOrders || 0} pending`, icon: UsersRound, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Live Requests', value: pendingRequests, change: `${s?.readyOrders || 0} ready orders`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.dashboard')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 bg-surface-elevated border border-border rounded-2xl">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                <Icon className={cn('w-5 h-5', card.color)} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-foreground-muted mt-1">{card.label}</p>
              <p className="text-xs font-medium mt-1 text-foreground-muted">{card.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentOrders orders={s?.recentOrders || []} />
        <div className="bg-surface-elevated border border-border rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Popular Items</h3>
          <div className="space-y-3">
            {(s?.popularProducts || []).map((product, i) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-500">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-foreground-muted truncate">{product.category?.name}</p>
                </div>
                <span className="text-xs font-medium text-foreground-muted">{product.orderCount || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentOrders({ orders }: { orders: any[] }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-2xl p-4">
      <h3 className="font-semibold mb-4">Recent Orders</h3>
      <div className="space-y-3">
        {orders.slice(0, 8).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
            <div>
              <p className="font-medium text-sm">#{order.orderNumber}</p>
              <p className="text-xs text-foreground-muted">Table {order.table?.number || '?'}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">${order.total?.toFixed(2)}</span>
              <StatusPill status={order.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuView() {
  const { t } = useTranslation();
  const branchId = useActiveBranchId();
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => get<Category[]>(`/branches/${branchId}/categories`),
    enabled: !!branchId,
  });
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', branchId],
    queryFn: () => get<Product[]>(`/branches/${branchId}/products`),
    enabled: !!branchId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => post<Product>(`/branches/${branchId}/products`, data),
    onSuccess: () => { refresh(); toast.success('Product added'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => patch<Product>(`/branches/products/${id}`, data),
    onSuccess: () => { refresh(); toast.success('Product updated'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/branches/products/${id}`),
    onSuccess: () => { refresh(); toast.success('Product deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const addProduct = () => {
    const categoryId = categories?.data?.[0]?.id;
    if (!categoryId) return toast.error('Create a category first');
    const name = window.prompt('Product name');
    if (!name) return;
    const price = Number(window.prompt('Price', '10'));
    if (!Number.isFinite(price)) return toast.error('Invalid price');
    createMutation.mutate({ categoryId, name, price, isPopular: false });
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('admin.menu')}
        action={<button onClick={addProduct} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4" />{t('admin.add')}</button>}
      />
      <DataTable loading={isLoading} colSpan={6}>
        <thead className="bg-foreground-muted/5">
          <tr>
            <Th>{t('admin.name')}</Th><Th>{t('admin.category')}</Th><Th>{t('admin.price')}</Th><Th>{t('admin.status')}</Th><Th>Popular</Th><Th right>{t('admin.actions')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(products?.data || []).map((product) => (
            <tr key={product.id} className="hover:bg-foreground-muted/5">
              <Td className="font-medium">{product.name}</Td>
              <Td muted>{product.category?.name}</Td>
              <Td>${product.price.toFixed(2)}</Td>
              <Td><StatusPill status={product.status} /></Td>
              <Td>{product.isPopular ? <CheckCircle2 className="w-4 h-4 text-success-500" /> : <XCircle className="w-4 h-4 text-foreground-muted" />}</Td>
              <Td right>
                <IconButton title="Rename" onClick={() => {
                  const name = window.prompt('Product name', product.name);
                  if (name) updateMutation.mutate({ id: product.id, data: { name, nameAz: name, nameEn: name, nameRu: name, nameTr: name } });
                }}><Edit className="w-4 h-4" /></IconButton>
                <IconButton title="Toggle status" onClick={() => updateMutation.mutate({ id: product.id, data: { status: product.status === 'active' ? 'inactive' : 'active' } })}><RefreshCw className="w-4 h-4" /></IconButton>
                <IconButton danger title="Delete" onClick={() => window.confirm('Delete product?') && deleteMutation.mutate(product.id)}><Trash2 className="w-4 h-4" /></IconButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function OrdersView() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useOrders({ limit: 100 });
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) => patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Order updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.orders')} />
      <DataTable loading={isLoading} colSpan={6}>
        <thead className="bg-foreground-muted/5">
          <tr><Th>Order #</Th><Th>Table</Th><Th>Status</Th><Th>Total</Th><Th>Time</Th><Th right>Actions</Th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(orders?.data || []).map((order: any) => (
            <tr key={order.id} className="hover:bg-foreground-muted/5">
              <Td className="font-medium">#{order.orderNumber}</Td>
              <Td muted>Table {order.table?.number || '?'}</Td>
              <Td><StatusPill status={order.status} /></Td>
              <Td className="font-medium">${order.total?.toFixed(2)}</Td>
              <Td muted>{new Date(order.createdAt).toLocaleTimeString()}</Td>
              <Td right>
                {(nextStatuses[order.status] || []).map((status) => (
                  <button key={status} onClick={() => updateMutation.mutate({ orderId: order.id, status })} className="ml-2 px-2.5 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium capitalize">
                    {status}
                  </button>
                ))}
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function QRView() {
  const { t } = useTranslation();
  const branchId = useActiveBranchId();
  const queryClient = useQueryClient();
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => get<Table[]>('/qr/tables', branchId ? { branchId } : undefined),
    enabled: !!branchId,
  });
  const generateMutation = useMutation({
    mutationFn: (id: string) => post(`/qr/tables/${id}/generate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); toast.success('QR generated'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/qr/tables/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); toast.success('Table updated'); },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.qrCodes')} />
      {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(tables?.data || []).map((table) => (
            <div key={table.id} className="p-4 bg-surface-elevated border border-border rounded-2xl">
              <div className="aspect-square bg-white rounded-xl mb-3 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-black" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Table {table.number}</p>
                  <p className="text-xs text-foreground-muted">{table.qrCode ? 'QR ready' : 'Needs QR'}</p>
                </div>
                <StatusPill status={table.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => generateMutation.mutate(table.id)} className="py-2 bg-primary-500 text-white rounded-xl text-xs font-medium">Generate</button>
                <button onClick={() => updateMutation.mutate({ id: table.id, status: table.status === 'active' ? 'inactive' : 'active' })} className="py-2 bg-foreground-muted/10 rounded-xl text-xs font-medium">Toggle</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffView() {
  const { t } = useTranslation();
  const { data: staff, isLoading } = useStaff();
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: any) => post('/staff', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff added'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => patch(`/staff/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff updated'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/staff/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const addStaff = () => {
    const name = window.prompt('Name');
    const email = name ? window.prompt('Email') : '';
    const password = email ? window.prompt('Password', 'password123') : '';
    const role = password ? window.prompt('Role: admin, manager, kitchen, waiter', 'waiter') : '';
    if (name && email && password && role) createMutation.mutate({ name, email, password, role });
  };

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.staff')} action={<button onClick={addStaff} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4" />{t('admin.add')}</button>} />
      <DataTable loading={isLoading} colSpan={5}>
        <thead className="bg-foreground-muted/5">
          <tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th right>Actions</Th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(staff?.data || []).map((member: any) => (
            <tr key={member.id} className="hover:bg-foreground-muted/5">
              <Td className="font-medium">{member.name}</Td><Td muted>{member.email}</Td><Td><StatusPill status={member.role} /></Td><Td><StatusPill status={member.status} /></Td>
              <Td right>
                <IconButton title="Toggle status" onClick={() => updateMutation.mutate({ id: member.id, data: { status: member.status === 'active' ? 'inactive' : 'active' } })}><RefreshCw className="w-4 h-4" /></IconButton>
                <IconButton danger title="Delete" onClick={() => window.confirm('Delete user?') && deleteMutation.mutate(member.id)}><Trash2 className="w-4 h-4" /></IconButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function AnalyticsView() {
  const { data: stats } = useDashboardStats();
  const { data: statusData } = useOrdersByStatus();
  const max = Math.max(1, ...(statusData?.data || []).map((s) => s.count));
  return (
    <div className="space-y-6">
      <SectionTitle title="Analytics" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-elevated border border-border rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {(statusData?.data || []).map((item) => (
              <div key={item.status}>
                <div className="flex justify-between text-sm mb-1"><span className="capitalize">{item.status}</span><span>{item.count}</span></div>
                <div className="h-2 rounded-full bg-foreground-muted/10 overflow-hidden"><div className="h-full bg-primary-500" style={{ width: `${(item.count / max) * 100}%` }} /></div>
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

function SettingsView() {
  const { t } = useTranslation();
  const { data: branches } = useBranches();
  const branch = branches?.data?.[0];
  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.settings')} />
      <div className="max-w-xl p-4 bg-surface-elevated border border-border rounded-2xl space-y-4">
        <ReadonlyField label={t('admin.restaurantName')} value={branch?.restaurant?.name || 'FoodZone'} />
        <ReadonlyField label="Branch" value={branch?.name || '-'} />
        <ReadonlyField label="Wi-Fi" value={branch?.wifiName || '-'} icon={<Wifi className="w-4 h-4" />} />
        <ReadonlyField label={t('admin.currency')} value="USD ($)" />
      </div>
    </div>
  );
}

function DataTable({ children, loading, colSpan }: { children: React.ReactNode; loading?: boolean; colSpan: number }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-2xl overflow-auto">
      <table className="w-full text-sm min-w-[760px]">
        {loading ? <tbody><tr><td colSpan={colSpan} className="px-4 py-8 text-center"><LoadingSpinner /></td></tr></tbody> : children}
      </table>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn('px-4 py-3 font-medium', right ? 'text-right' : 'text-left')}>{children}</th>;
}

function Td({ children, right, muted, className }: { children: React.ReactNode; right?: boolean; muted?: boolean; className?: string }) {
  return <td className={cn('px-4 py-3', right && 'text-right', muted && 'text-foreground-muted', className)}>{children}</td>;
}

function IconButton({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button title={title} onClick={onClick} className={cn('p-1.5 rounded-lg inline-flex ml-1', danger ? 'text-danger-500 hover:bg-danger-500/10' : 'text-foreground-muted hover:bg-foreground-muted/5')}>
      {children}
    </button>
  );
}

function StatusPill({ status }: { status?: string }) {
  const palette = useMemo(() => {
    if (status === 'active' || status === 'served' || status === 'ready') return 'bg-success-500/10 text-success-500';
    if (status === 'pending' || status === 'preparing') return 'bg-yellow-500/10 text-yellow-500';
    if (status === 'inactive' || status === 'cancelled') return 'bg-danger-500/10 text-danger-500';
    return 'bg-primary-500/10 text-primary-500';
  }, [status]);
  return <span className={cn('inline-flex px-2 py-1 text-xs rounded-full font-medium capitalize', palette)}>{status || '-'}</span>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="p-3 bg-surface border border-border rounded-xl"><p className="text-xs text-foreground-muted">{label}</p><p className="text-xl font-bold mt-1">{value}</p></div>;
}

function ReadonlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      <span className="w-full px-3 py-2 bg-surface border border-border rounded-xl flex items-center gap-2 text-sm">{icon}{value}</span>
    </label>
  );
}
