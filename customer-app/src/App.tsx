import BottomModals from "@/components/BottomModals";
import BottomNav from "@/components/BottomNav";
import FloatingCart from "@/components/FloatingCart";
import Toast from "@/components/Toast";
import WaiterCallFAB from "@/components/WaiterCallFAB";
import WaiterRequestsScreen from "@/screens/WaiterRequestsScreen";
import SupportRequestsScreen from "@/screens/SupportRequestsScreen";
import AddressesScreen from "@/screens/AddressesScreen";
import AdminDashboard from "@/screens/AdminDashboard";
import CartDrawer from "@/screens/CartDrawer";
import CheckoutScreen from "@/screens/CheckoutScreen";
import CouponsScreen from "@/screens/CouponsScreen";
import FavoritesScreen from "@/screens/FavoritesScreen";
import GalleryScreen from "@/screens/GalleryScreen";
import HelpScreen from "@/screens/HelpScreen";
import HomeScreen from "@/screens/HomeScreen";
import InfoScreen from "@/screens/InfoScreen";
import LoginScreen from "@/screens/LoginScreen";
import OrderDetailScreen from "@/screens/OrderDetailScreen";
import OrderHistory from "@/screens/OrderHistory";
import OrderSuccessScreen from "@/screens/OrderSuccessScreen";
import OrderTracking from "@/screens/OrderTracking";
import PaymentsScreen from "@/screens/PaymentsScreen";
import ProductDetail from "@/screens/ProductDetail";
import ProfileScreen from "@/screens/ProfileScreen";
import ReviewsScreen from "@/screens/ReviewsScreen";
import SearchScreen from "@/screens/SearchScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import SplashScreen from "@/screens/SplashScreen";
import { useUIStore } from "@/store";
import { AnimatePresence } from "framer-motion";

function ScreenRouter() {
  const currentScreen = useUIStore((s) => s.currentScreen);
  switch (currentScreen) {
    case "splash":
      return <SplashScreen />;
    case "home":
      return <HomeScreen />;
    case "search":
      return <SearchScreen />;
    case "orders":
    case "orderHistory":
      return <OrderHistory />;
    case "orderDetail":
      return <OrderDetailScreen />;
    case "tracking":
      return <OrderTracking />;
    case "profile":
      return <ProfileScreen />;
    case "favorites":
      return <FavoritesScreen />;
    case "checkout":
      return <CheckoutScreen />;
    case "orderSuccess":
      return <OrderSuccessScreen />;
    case "addresses":
      return <AddressesScreen />;
    case "payments":
      return <PaymentsScreen />;
    case "coupons":
      return <CouponsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "help":
      return <HelpScreen />;
    case "reviews":
      return <ReviewsScreen />;
    case "gallery":
      return <GalleryScreen />;
    case "info":
      return <InfoScreen />;
    case "waiterRequests":
      return <WaiterRequestsScreen />;
    case "supportRequests":
      return <SupportRequestsScreen />;
    case "login":
    case "register":
      return <LoginScreen />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  const currentScreen = useUIStore((s) => s.currentScreen);
  const isSplash = currentScreen === "splash";
  const isFullscreen = [
    "tracking",
    "login",
    "register",
    "checkout",
    "orderSuccess",
  ].includes(currentScreen);

  return (
    <div className="min-h-screen w-full bg-[#e8edf2] flex items-center justify-center p-0 md:p-6">
      <div className="mobile-frame md:max-h-[932px]">
        {!isSplash && !isFullscreen && <div className="phone-notch" />}

        <div className="relative w-full h-full" id="app-root">
          <AnimatePresence mode="wait">
            <ScreenRouter key={currentScreen} />
          </AnimatePresence>

          <ProductDetail />
          <CartDrawer />
          <BottomModals />
          <WaiterCallFAB />
          <FloatingCart />
          <Toast />
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
