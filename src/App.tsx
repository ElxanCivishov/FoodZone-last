import { useUIStore } from './stores/uiStore';
import { useSocketContext } from './services/socket';
import { QRScanScreen } from './components/customer/QRScanScreen';
import { LanguageScreen } from './components/customer/LanguageScreen';
import { WelcomeScreen } from './components/customer/WelcomeScreen';
import { HomeScreen } from './components/customer/HomeScreen';
import { ProductDetailScreen } from './components/customer/ProductDetailScreen';
import { CartScreen } from './components/customer/CartScreen';
import { CheckoutScreen } from './components/customer/CheckoutScreen';
import { OrderSuccessScreen } from './components/customer/OrderSuccessScreen';
import { OrderTrackingScreen } from './components/customer/OrderTrackingScreen';
import { CallWaiterScreen } from './components/customer/CallWaiterScreen';
import { WifiConnectScreen } from './components/customer/WifiConnectScreen';
import { RewardsScreen } from './components/customer/RewardsScreen';
import { MyOrdersScreen } from './components/customer/MyOrdersScreen';
import { AdminApp } from './components/admin/AdminApp';
import { KitchenPanel } from './components/kitchen/KitchenPanel';
import { WaiterPanel } from './components/waiter-panel/WaiterPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

const screenComponents = {
  'qr-scan': QRScanScreen,
  'language': LanguageScreen,
  'welcome': WelcomeScreen,
  'home': HomeScreen,
  'product-detail': ProductDetailScreen,
  'cart': CartScreen,
  'checkout': CheckoutScreen,
  'order-success': OrderSuccessScreen,
  'order-tracking': OrderTrackingScreen,
  'call-waiter': CallWaiterScreen,
  'wifi-connect': WifiConnectScreen,
  'rewards': RewardsScreen,
  'my-orders': MyOrdersScreen,
};

const screenVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const screensWithNav = ['home', 'my-orders', 'rewards', 'order-tracking'];

function App() {
  const currentScreen = useUIStore((state) => state.currentScreen);
  const isLoading = useUIStore((state) => state.isLoading);
  const { isConnected } = useSocketContext();

  const path = window.location.pathname;
  const isAdmin = path.startsWith('/admin');
  const isKitchen = path.startsWith('/kitchen');
  const isWaiter = path.startsWith('/waiter');

  if (isAdmin) return <AdminApp />;
  if (isKitchen) return <KitchenPanel />;
  if (isWaiter) return <WaiterPanel />;

  const ScreenComponent = screenComponents[currentScreen] || QRScanScreen;
  const showNav = screensWithNav.includes(currentScreen);

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>Connecting to server...</span>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          <ScreenComponent />
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav />}
      {isLoading && (
        <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function BottomNav() {
  const currentScreen = useUIStore((state) => state.currentScreen);
  const setScreen = useUIStore((state) => state.setScreen);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'my-orders', label: 'Orders' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'order-tracking', label: 'Track' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800/90 backdrop-blur-xl border-t border-dark-700/50 px-6 py-3 z-40">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentScreen === item.id ? 'text-primary-400' : 'text-dark-400'
            }`}
          >
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default App;
