import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, QrCode, Users, Settings, BarChart3, LogOut, Menu, X } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'qr', label: 'QR Codes', icon: QrCode },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900 text-white flex">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center"><UtensilsCrossed size={24} className="text-white" /></div>
            <div><h1 className="text-lg font-bold">FoodZone</h1><p className="text-dark-400 text-xs">Admin Panel</p></div>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:bg-dark-700 hover:text-white'}`}>
                  <Icon size={20} /><span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={20} /><span className="font-medium">Logout</span></button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
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
  );
}

function DashboardView() {
  const stats = [
    { label: 'Total Orders', value: '1,234', change: '+12%', color: 'text-primary-400' },
    { label: 'Revenue', value: '$12,345', change: '+8%', color: 'text-green-400' },
    { label: 'Active Tables', value: '8/12', change: '-2', color: 'text-blue-400' },
    { label: 'Avg. Order Time', value: '18 min', change: '-3 min', color: 'text-orange-400' },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel p-6">
            <p className="text-dark-400 text-sm mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <span className={`text-sm font-medium ${stat.color}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
                <div><p className="text-white text-sm font-medium">Order #{10000 + i}</p><p className="text-dark-400 text-xs">Table {i + 1}</p></div>
                <span className="text-primary-400 font-medium">${(20 + i * 5).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-4">Popular Items</h3>
          <div className="space-y-3">
            {['Pepperoni Pizza', 'Double Cheese Burger', 'Caesar Salad', 'Chocolate Cake', 'Iced Coffee'].map((item, i) => (
              <div key={item} className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">{i + 1}</span>
                  <p className="text-white text-sm">{item}</p>
                </div>
                <span className="text-dark-400 text-sm">{120 - i * 15} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Menu Management</h2>
        <button className="btn-primary">Add Item</button>
      </div>
      <div className="glass-panel p-6"><p className="text-dark-400 text-center py-12">Menu management interface coming soon...</p></div>
    </div>
  );
}

function OrdersView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Orders</h2>
      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left text-dark-400 text-sm font-medium p-4">Order #</th>
              <th className="text-left text-dark-400 text-sm font-medium p-4">Table</th>
              <th className="text-left text-dark-400 text-sm font-medium p-4">Status</th>
              <th className="text-left text-dark-400 text-sm font-medium p-4">Total</th>
              <th className="text-left text-dark-400 text-sm font-medium p-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-dark-700/50 last:border-0">
                <td className="p-4 text-white text-sm">#{10000 + i}</td>
                <td className="p-4 text-dark-300 text-sm">Table {i + 1}</td>
                <td className="p-4"><span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Served</span></td>
                <td className="p-4 text-white text-sm font-medium">${(25 + i * 3).toFixed(2)}</td>
                <td className="p-4 text-dark-400 text-sm">{i * 5} min ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QRView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">QR Codes</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="glass-panel p-4 text-center">
            <div className="aspect-square bg-white rounded-xl mb-3 flex items-center justify-center">
              <QrCode size={64} className="text-dark-900" />
            </div>
            <p className="text-white font-medium">Table {i + 1}</p>
            <button className="text-primary-400 text-sm mt-2 hover:text-primary-300">Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Staff Management</h2>
      <div className="glass-panel p-6"><p className="text-dark-400 text-center py-12">Staff management interface coming soon...</p></div>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 h-80 flex items-center justify-center"><p className="text-dark-400">Revenue Chart</p></div>
        <div className="glass-panel p-6 h-80 flex items-center justify-center"><p className="text-dark-400">Orders Chart</p></div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
      <div className="glass-panel p-6 space-y-6">
        <div><label className="text-white font-medium block mb-2">Restaurant Name</label><input type="text" defaultValue="FoodZone" className="input-field" /></div>
        <div><label className="text-white font-medium block mb-2">Service Fee (%)</label><input type="number" defaultValue="5" className="input-field" /></div>
        <div>
          <label className="text-white font-medium block mb-2">Currency</label>
          <select className="input-field">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AZN">AZN (₼)</option>
          </select>
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
