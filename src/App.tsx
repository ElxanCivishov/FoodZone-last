import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/services/socket';
import { useUIStore } from '@/stores/uiStore';
import { useSocketContext } from '@/services/socket';

import { AdminApp } from '@/components/admin/AdminApp';
import { KitchenPanel } from '@/components/kitchen/KitchenPanel';
import { WaiterPanel } from '@/components/waiter-panel/WaiterPanel';

import { QRScanScreen } from '@/components/customer/QRScanScreen';
import { LanguageScreen } from '@/components/customer/LanguageScreen';
import { WelcomeScreen } from '@/components/customer/WelcomeScreen';
import { HomeScreen } from '@/components/customer/HomeScreen';
import { ProductDetailScreen } from '@/components/customer/ProductDetailScreen';
import { CartScreen } from '@/components/customer/CartScreen';
import { CheckoutScreen } from '@/components/customer/CheckoutScreen';
import { OrderSuccessScreen } from '@/components/customer/OrderSuccessScreen';
import { OrderTrackingScreen } from '@/components/customer/OrderTrackingScreen';
import { MyOrdersScreen } from '@/components/customer/MyOrdersScreen';
import { CallWaiterScreen } from '@/components/customer/CallWaiterScreen';
import { WifiConnectScreen } from '@/components/customer/WifiConnectScreen';
import { RewardsScreen } from '@/components/customer/RewardsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </SocketProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/admin') return <AdminApp />;
  if (path === '/kitchen') return <KitchenPanel />;
  if (path === '/waiter') return <WaiterPanel />;

  return <CustomerApp />;
}

function CustomerApp() {
  const { currentScreen, isLoading, notifications } = useUIStore();
  const { isConnected } = useSocketContext();

  const screenComponents: Record<string, React.FC> = {
    'qr-scan': QRScanScreen,
    'language': LanguageScreen,
    'welcome': WelcomeScreen,
    'home': HomeScreen,
    'category': HomeScreen,
    'product-detail': ProductDetailScreen,
    'cart': CartScreen,
    'checkout': CheckoutScreen,
    'order-success': OrderSuccessScreen,
    'order-tracking': OrderTrackingScreen,
    'my-orders': MyOrdersScreen,
    'call-waiter': CallWaiterScreen,
    'wifi-connect': WifiConnectScreen,
    'rewards': RewardsScreen,
  };

  const ScreenComponent = screenComponents[currentScreen] || QRScanScreen;
  const showNav = ['home', 'my-orders', 'order-tracking', 'call-waiter', 'rewards'].includes(currentScreen);

  return (
    <div className="relative">
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-black text-center py-1 text-sm z-50">
          Connecting to server...
        </div>
      )}

      <ScreenComponent />

      {showNav && <BottomNav />}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((n) => (
          <div key={n.id} className={`px-4 py-2 rounded-lg text-sm text-white shadow-lg ${
            n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomNav() {
  const currentScreen = useUIStore((s) => s.currentScreen);
  const setScreen = useUIStore((s) => s.setScreen);

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'my-orders', label: 'Orders', icon: '📋' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'call-waiter', label: 'Waiter', icon: '🔔' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 px-4 py-2 flex justify-around z-40">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setScreen(item.id as any)}
          className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg ${
            currentScreen === item.id ? 'text-primary-400' : 'text-dark-400'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default App;
