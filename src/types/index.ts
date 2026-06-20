export interface Restaurant {
  id: string; name: string; slug: string; logo?: string; description?: string;
  status: 'active' | 'inactive'; createdAt: string; updatedAt: string;
}

export interface Branch {
  id: string; restaurantId: string; name: string; address?: string; phone?: string;
  wifiName?: string; wifiPassword?: string; status: 'active' | 'inactive'; createdAt: string;
}

export interface Table {
  id: string; branchId: string; number: string; qrCode: string;
  status: 'active' | 'inactive' | 'occupied'; capacity?: number; createdAt: string;
}

export interface Category {
  id: string; branchId: string; name: string; nameAz: string; nameEn: string;
  nameRu: string; nameTr: string; icon?: string; sortOrder: number;
  status: 'active' | 'inactive'; createdAt: string;
}

export interface Product {
  id: string; categoryId: string; name: string; nameAz: string; nameEn: string;
  nameRu: string; nameTr: string; description?: string; descriptionAz?: string;
  descriptionEn?: string; descriptionRu?: string; descriptionTr?: string;
  price: number; image?: string; sortOrder: number; status: 'active' | 'inactive';
  isPopular: boolean; hasExtras: boolean; hasSizes: boolean;
  sizes?: ProductSize[]; extras?: ProductExtra[]; createdAt: string;
}

export interface ProductSize {
  id: string; productId: string; name: string; nameAz: string; nameEn: string;
  priceModifier: number; isDefault: boolean;
}

export interface ProductExtra {
  id: string; productId: string; name: string; nameAz: string; nameEn: string; price: number;
}

export interface CartItem {
  id: string; productId: string; product: Product; quantity: number;
  selectedSize?: ProductSize; selectedExtras: ProductExtra[]; specialNote?: string;
  unitPrice: number; totalPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface Order {
  id: string; orderNumber: string; tableId: string; table?: Table; branchId: string;
  items: OrderItem[]; subtotal: number; serviceFee: number; discount: number;
  discountCode?: string; total: number; status: OrderStatus;
  paymentMethod: 'cash' | 'card' | 'online'; paymentStatus: 'pending' | 'paid' | 'failed';
  specialRequest?: string; estimatedTime?: number; createdAt: string; updatedAt: string;
}

export interface OrderItem {
  id: string; orderId: string; productId: string; product?: Product; quantity: number;
  selectedSizeId?: string; unitPrice: number; totalPrice: number; specialNote?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface OrderStatusUpdate {
  orderId: string; status: OrderStatus; timestamp: string; message?: string;
  estimatedTime?: number; itemId?: string;
}

export interface WaiterRequest {
  id: string; tableId: string; table?: Table;
  type: 'call' | 'water' | 'napkin' | 'bill' | 'clean' | 'other';
  status: 'pending' | 'accepted' | 'done'; message?: string; createdAt: string;
}

export interface QRScanResult {
  restaurantId: string; branchId: string; tableId: string; tableNumber: string;
  branchName: string; restaurantName: string; language?: string;
  valid: boolean; expired?: boolean; message?: string;
}

export interface SessionData {
  restaurantId: string; branchId: string; tableId: string; tableNumber: string;
  language: string; customerName?: string; sessionId: string;
}

export type AppScreen =
  | 'qr-scan' | 'language' | 'welcome' | 'home' | 'category' | 'product-detail'
  | 'cart' | 'checkout' | 'order-success' | 'order-tracking' | 'my-orders'
  | 'wifi-connect' | 'call-waiter' | 'rewards';

export interface KitchenOrder {
  id: string; orderNumber: string; tableId: string; tableNumber: string;
  items: KitchenOrderItem[]; status: OrderStatus; priority: 'normal' | 'high' | 'urgent';
  specialRequest?: string; estimatedTime: number; createdAt: string;
  startedAt?: string; readyAt?: string;
}

export interface KitchenOrderItem {
  id: string; productId: string; productName: string; quantity: number;
  selectedSize?: string; selectedExtras: string[]; specialNote?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface WaiterOrder {
  id: string; orderNumber: string; tableId: string; tableNumber: string;
  items: { productName: string; quantity: number; selectedSize?: string; selectedExtras: string[] }[];
  total: number; paymentMethod: string; status: OrderStatus;
  specialRequest?: string; readyAt?: string; createdAt: string;
}

export interface WaiterRequestItem {
  id: string; tableId: string; tableNumber: string; type: string;
  status: 'pending' | 'accepted' | 'done'; message?: string; createdAt: string;
}

export interface DashboardStats {
  totalOrders: number; totalRevenue: number; activeTables: number;
  averageOrderTime: number; todayOrders: number; todayRevenue: number;
}

export interface StaffMember {
  id: string; name: string; email: string;
  role: 'admin' | 'manager' | 'kitchen' | 'waiter';
  status: 'active' | 'inactive'; lastActive?: string;
}
