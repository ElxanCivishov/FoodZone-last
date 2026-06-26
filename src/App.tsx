import { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useSocketContext } from "@/services/socket";
import { BottomNav } from "@/components/common/BottomNav";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { QRScanScreen } from "@/components/customer/QRScanScreen";
import { LanguageScreen } from "@/components/customer/LanguageScreen";
import { WelcomeScreen } from "@/components/customer/WelcomeScreen";
import { HomeScreen } from "@/components/customer/HomeScreen";
import { ProductDetailScreen } from "@/components/customer/ProductDetailScreen";
import { CartScreen } from "@/components/customer/CartScreen";
import { CheckoutScreen } from "@/components/customer/CheckoutScreen";
import { OrderSuccessScreen } from "@/components/customer/OrderSuccessScreen";
import { OrderTrackingScreen } from "@/components/customer/OrderTrackingScreen";
import { MyOrdersScreen } from "@/components/customer/MyOrdersScreen";
import { CallWaiterScreen } from "@/components/customer/CallWaiterScreen";
import { WifiConnectScreen } from "@/components/customer/WifiConnectScreen";
import { RewardsScreen } from "@/components/customer/RewardsScreen";
import { FeedbackScreen } from "@/components/customer/FeedbackScreen";
import { cn } from "@/utils/cn";

// Heavy staff panels — lazy loaded to keep initial bundle small
const AdminApp     = lazy(() => import("@/components/admin/AdminApp").then(m => ({ default: m.AdminApp })));
const KitchenPanel = lazy(() => import("@/components/kitchen/KitchenPanel").then(m => ({ default: m.KitchenPanel })));
const WaiterPanel  = lazy(() => import("@/components/waiter-panel/WaiterPanel").then(m => ({ default: m.WaiterPanel })));

function StaffFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  );
}

// ─── Offline banner ───────────────────────────────────────────────────────────
function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online  = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online",  online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online",  online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      exit={{ y: -40 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-center text-xs py-2 font-medium flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5" />
      İnternet bağlantısı yoxdur — oflayn rejimdə işləyirsiniz
    </motion.div>
  );
}

// ─── Customer screen map ──────────────────────────────────────────────────────
const customerScreens: Record<string, React.FC> = {
  "qr-scan": QRScanScreen,
  language: LanguageScreen,
  welcome: WelcomeScreen,
  home: HomeScreen,
  "product-detail": ProductDetailScreen,
  cart: CartScreen,
  checkout: CheckoutScreen,
  "order-success": OrderSuccessScreen,
  "order-tracking": OrderTrackingScreen,
  "my-orders": MyOrdersScreen,
  "call-waiter": CallWaiterScreen,
  "wifi-connect": WifiConnectScreen,
  rewards: RewardsScreen,
  feedback: FeedbackScreen,
};

const screensWithNav = ["home", "my-orders", "rewards", "order-tracking"];

const screenVariants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 30 },
  },
  exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.18 } },
};

// ─── Customer flow ────────────────────────────────────────────────────────────
function CustomerFlow() {
  const { i18n } = useTranslation();
  const currentScreen = useUIStore((state) => state.currentScreen);
  const isLoading = useUIStore((state) => state.isLoading);
  const { isConnected } = useSocketContext();
  const { resolvedTheme } = useThemeStore();

  useEffect(() => {
    const savedLang = localStorage.getItem("fz_language");
    if (savedLang) i18n.changeLanguage(savedLang);
  }, [i18n]);

  const ScreenComponent = customerScreens[currentScreen] || QRScanScreen;
  const showNav = screensWithNav.includes(currentScreen);

  return (
    <div
      className={cn(
        "min-h-screen bg-surface text-foreground",
        resolvedTheme === "dark" ? "dark" : "",
      )}
    >
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-black text-center text-xs py-1 font-medium">
          Connecting to server...
        </div>
      )}

      <main className={cn("max-w-lg mx-auto relative", showNav && "pb-20")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ScreenComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner size={40} />
        </div>
      )}

      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </div>
  );
}

// ─── Auth guard for staff panels ─────────────────────────────────────────────
interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

function AuthGuard({ children, roles }: AuthGuardProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

// ─── Staff panel wrapper ──────────────────────────────────────────────────────
function StaffPanel({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useThemeStore();
  return (
    <div
      className={cn(
        "min-h-screen bg-surface text-foreground",
        resolvedTheme === "dark" ? "dark" : "",
      )}
    >
      {children}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        {/* Customer QR flow */}
        <Route path="/" element={<CustomerFlow />} />

        {/* Staff auth */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Staff panels — lazy loaded */}
        <Route
          path="/admin/*"
          element={
            <AuthGuard roles={["admin", "manager"]}>
              <StaffPanel>
                <Suspense fallback={<StaffFallback />}>
                  <AdminApp />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />
        <Route
          path="/kitchen"
          element={
            <AuthGuard roles={["admin", "manager", "kitchen"]}>
              <StaffPanel>
                <Suspense fallback={<StaffFallback />}>
                  <KitchenPanel />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />
        <Route
          path="/waiter"
          element={
            <AuthGuard roles={["admin", "manager", "waiter", "staff"]}>
              <StaffPanel>
                <Suspense fallback={<StaffFallback />}>
                  <WaiterPanel />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />
        <Route
          path="/waiter-panel"
          element={
            <AuthGuard roles={["admin", "manager", "waiter", "staff"]}>
              <StaffPanel>
                <Suspense fallback={<StaffFallback />}>
                  <WaiterPanel />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
