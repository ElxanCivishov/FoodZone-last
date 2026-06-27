export type Screen =
  | "splash"
  | "home"
  | "restaurantDetail"
  | "search"
  | "orders"
  | "orderHistory"
  | "orderDetail"
  | "profile"
  | "tracking"
  | "checkout"
  | "payment"
  | "favorites"
  | "addresses"
  | "payments"
  | "coupons"
  | "settings"
  | "help"
  | "reviews"
  | "gallery"
  | "info"
  | "orderSuccess"
  | "waiterRequests"
  | "supportRequests"
  | "editProfile"
  | "login"
  | "register"
  | "admin";

export type WaiterRequestType =
  | "call"
  | "bill"
  | "water"
  | "napkin"
  | "clean"
  | "other";
export type WaiterRequestStatus = "pending" | "accepted" | "resolved";

export interface WaiterRequest {
  id: string;
  type: WaiterRequestType;
  status: WaiterRequestStatus;
  note?: string;
  tableNumber: number;
  createdAt: string;
}

export type NavTab = "home" | "search" | "orders" | "profile";

export type Category =
  | "all"
  | "sushi"
  | "ramen"
  | "sashimi"
  | "rolls"
  | "desserts"
  | "drinks";

export type RestaurantCategory =
  | "all"
  | "sushi"
  | "fastfood"
  | "pizza"
  | "dessert"
  | "drinks";

export type OrderStatus =
  | "payment_pending"
  | "new"
  | "preparing"
  | "ready"
  | "served"
  | "on_the_way"
  | "delivered"
  | "completed"
  | "cancelled";

export type OrderType = "dine_in" | "take_away" | "delivery";
export type PaymentMethod = "cash" | "card";
export type PaymentStatus = "pending" | "paid";

export type ModalType =
  | "wifi"
  | "language"
  | "hours"
  | "colorMode"
  | "feedback"
  | "waiterCall"
  | null;

export type Language = "az" | "en" | "ru" | "tr";

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
  originalPrice?: number;
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
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  tableNumber: number;
  deliveryAddress?: string;
  createdAt: string;
  createdAtMs: number;
  estimatedTime: number;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  hasSubs: boolean;
}

export interface MenuSub {
  id: string;
  groupId: string;
  label: string;
}

export interface MenuItem {
  id: number;
  groupId: string;
  subcategoryId?: string;
  name: string;
  desc: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  category?: Category;
  // Tea-specific
  brewTemp?: string;
  brewTime?: string;
  ingredients?: string;
  benefits?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface AdminStats {
  dailyOrders: number;
  dailyRevenue: number;
  rating: number;
  avgPrepTime: number;
}
