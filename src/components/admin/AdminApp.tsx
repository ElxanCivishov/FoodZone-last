import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useOrders } from '@/hooks/useDashboard';
import { useSocketContext } from '@/services/socket';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/utils/constants';

export function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { isConnected } = useSocketContext();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Orders' },
    { id: 'menu', label: 'Menu' },
    { id: 'qr', label: 'QR Codes' },
    { id: 'staff', label: 'Staff' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="flex h-screen">
        <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
          <div className="p-6 border-b border-dark-700">
            <h1 className="text-xl font-bold text-primary-400">FoodZone Admin</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-dark-400">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-primary-500/20 text-primary-400' : 'text-dark-300 hover:bg-dark-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-dark-700">
            <button onClick={handleLogout} className="w-full px-4 py-2 text-red-400 hover:bg-dark-700 rounded-lg">
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'menu' && <MenuView />}
          {activeTab === 'qr' && <QRView />}
          {activeTab === 'staff' && <StaffView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function DashboardView() {
  const { data, isLoading } = useDashboardStats();
  const stats = data?.data || {};

  if (isLoading) return <div className="text-dark-400">Loading dashboard...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={stats.totalOrders || 0} change="+12%" color="text-primary-400" />
        <StatCard label="Revenue" value={`$${(stats.totalRevenue || 0).toFixed(2)}`} change="+8%" color="text-green-400" />
        <StatCard label="Active Tables" value={`${stats.activeTables || 0}/${stats.totalTables || 0}`} change="-2" color="text-blue-400" />
        <StatCard label="Avg. Order Time" value={`${stats.avgOrderTime || 0} min`} change="-3 min" color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {(stats.recentOrders || []).slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-sm text-dark-400">Table {order.table?.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-lg font-semibold mb-4">Popular Items</h3>
          <div className="space-y-3">
            {(stats.popularProducts || []).map((item: any, i: number) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
                <span className="text-primary-400 font-bold w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-dark-400">{item.category?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, color }: any) {
  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`text-sm ${color}`}>{change}</p>
    </div>
  );
}

function OrdersView() {
  const { data, isLoading } = useOrders({ limit: 50 });
  const orders = data?.data || [];

  if (isLoading) return <div className="text-dark-400">Loading orders...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Orders</h2>
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-700/50">
            <tr>
              <th className="text-left p-4 text-dark-400 font-medium">Order #</th>
              <th className="text-left p-4 text-dark-400 font-medium">Table</th>
              <th className="text-left p-4 text-dark-400 font-medium">Status</th>
              <th className="text-left p-4 text-dark-400 font-medium">Total</th>
              <th className="text-left p-4 text-dark-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-t border-dark-700">
                <td className="p-4">#{order.orderNumber}</td>
                <td className="p-4">Table {order.table?.number}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="p-4">${order.total.toFixed(2)}</td>
                <td className="p-4 text-dark-400">{new Date(order.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenuView() {
  return <div className="text-dark-400">Menu management interface - use Prisma Studio or API</div>;
}
function QRView() {
  return <div className="text-dark-400">QR generation interface - integrate with backend /api/qr</div>;
}
function StaffView() {
  return <div className="text-dark-400">Staff management - use /api/auth/register endpoint</div>;
}
function SettingsView() {
  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="space-y-4 bg-dark-800 p-6 rounded-xl border border-dark-700">
        <div>
          <label className="block text-sm text-dark-400 mb-1">Restaurant Name</label>
          <input type="text" defaultValue="FoodZone" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm text-dark-400 mb-1">Service Fee (%)</label>
          <input type="number" defaultValue={5} className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2" />
        </div>
      </div>
    </div>
  );
}
