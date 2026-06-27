export type Screen =
  | 'splash'
  | 'home'
  | 'restaurantDetail'
  | 'search'
  | 'orders'
  | 'orderHistory'
  | 'orderDetail'
  | 'profile'
  | 'tracking'
  | 'checkout'
  | 'favorites'
  | 'addresses'
  | 'payments'
  | 'coupons'
  | 'settings'
  | 'help'
  | 'reviews'
  | 'gallery'
  | 'info'
  | 'orderSuccess'
  | 'waiterRequests'
  | 'supportRequests'
  | 'editProfile'
  | 'login'
  | 'register'
  | 'admin';

export type WaiterRequestType = 'call' | 'bill' | 'water' | 'napkin' | 'clean' | 'other';
export type WaiterRequestStatus = 'pending' | 'accepted' | 'resolved';

export interface WaiterRequest {
  id: string;
  type: WaiterRequestType;
  status: WaiterRequestStatus;
  note?: string;
  tableNumber: number;
  createdAt: string;
}

export type NavTab = 'home' | 'search' | 'orders' | 'profile';

export type Category = 'all' | 'sushi' | 'ramen' | 'sashimi' | 'rolls' | 'desserts' | 'drinks';

export type RestaurantCategory = 'all' | 'sushi' | 'fastfood' | 'pizza' | 'dessert' | 'drinks';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type ModalType = 'wifi' | 'language' | 'hours' | 'colorMode' | 'feedback' | 'waiterCall' | null;

export type Language = 'az' | 'en' | 'ru' | 'tr';

export interface Restaurant {
  id: number;
  name: string;
  desc: string;
  rating: number;
  reviewCount: number;
  time: string;
  delivery: number;
  min: number;
  image: string;
  category: RestaurantCategory;
  tags: string[];
  badge?: string;
  phone?: string;
  address?: string;
  wifi?: string;
  hours?: { day: string; time: string }[];
}

export interface RestaurantMenuItem {
  id: number;
  restaurantId: number;
  name: string;
  desc: string;
  price: number;
  image: string;
  rating: number;
  badge?: string;
  category?: string;
}

export interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: Category;
  badge?: string;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: SizeOption;
  selectedExtras: ExtraOption[];
  unitPrice: number;
}

export interface SizeOption {
  id: string;
  label: string;
  priceModifier: number;
}

export interface ExtraOption {
  id: string;
  label: string;
  price: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  tableNumber: number;
  createdAt: string;
  estimatedTime: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AdminStats {
  dailyOrders: number;
  dailyRevenue: number;
  rating: number;
  avgPrepTime: number;
}
