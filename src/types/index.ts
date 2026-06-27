export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ─── YENİ TIPLƏR ──────────────────────────────────────────────────────────────

export interface StaffShift {
  id: string;
  userId: string;
  user?: { id: string; name: string; role: string };
  branchId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'scheduled' | 'present' | 'absent' | 'completed';
  notes?: string;
  createdAt: string;
  performance?: StaffPerformance;
}

export interface StaffPerformance {
  id: string;
  userId: string;
  user?: { id: string; name: string; role: string };
  branchId: string;
  staffShiftId: string;
  ordersServed: number;
  avgServiceTime?: number;
  tips: number;
  rating?: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; role: string };
  ordersServed: number;
  tips: number;
  avgRating?: number;
  avgServiceTime?: number;
  shiftsWorked: number;
}

export interface CashDrawer {
  id: string;
  branchId: string;
  openedAt: string;
  closedAt?: string;
  openedById: string;
  openedBy?: { id: string; name: string };
  closedById?: string;
  closedBy?: { id: string; name: string };
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  totalCash?: number;
  totalCard?: number;
  totalOnline?: number;
  totalTips?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; nameAz: string; unit?: string };
  branchId: string;
  type: 'purchase' | 'sale' | 'waste' | 'adjustment' | 'return';
  quantity: number;
  unitCost?: number;
  note?: string;
  createdById?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  branchId: string;
  openedById: string;
  openedBy?: { id: string; name: string };
  closedById?: string;
  closedBy?: { id: string; name: string };
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  openingCash: number;
  totalCash?: number;
  totalCard?: number;
  totalOnline?: number;
  totalRevenue?: number;
  totalTips?: number;
  totalDiscount?: number;
  cashDifference?: number;
  totalOrders?: number;
  cancelledOrders?: number;
  avgPrepTime?: number;
  topProducts?: { productId: string; name: string; count: number; revenue: number }[];
  hourlyBreakdown?: Record<string, number>;
  notes?: string;
}

export interface PromoCode {
  id: string;
  branchId: string;
  code: string;
  description?: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive';
  customerId?: string | null;
  customer?: { id: string; name: string; phone?: string } | null;
  applicableItems: string[];
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  daysOfWeek: number[];
  createdAt: string;
  isExpired?: boolean;
  isMaxed?: boolean;
}

export interface PromoStats {
  totalDiscountGiven: number;
  totalOrdersWithPromo: number;
  monthDiscountGiven: number;
  monthOrdersWithPromo: number;
  activeCount: number;
  expiredCount: number;
  topCodes: { id: string; code: string; type: string; value: number; usedCount: number; description?: string }[];
}

export interface Customer {
  id: string;
  branchId: string;
  name: string;
  phone?: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  points: number;
  notes?: string;
  tags: string[];
  birthDate?: string;
  createdAt: string;
  lastVisit?: string;
  orders?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
}

export interface CustomerFeedback {
  id: string;
  branchId: string;
  customerId?: string;
  customer?: { id: string; name: string; phone?: string };
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CustomerFavorite {
  id: string;
  name: string;
  nameAz?: string;
  image?: string;
  price: number;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerStats {
  total: number;
  vipCount: number;
  totalSpent: number;
  avgSpend: number;
  totalPoints: number;
  birthdayToday: number;
}

export interface TableReservation {
  id: string;
  branchId: string;
  tableId?: string;
  table?: { id: string; number: string; capacity?: number; section?: string };
  customerId?: string;
  customer?: { id: string; name: string; phone?: string; totalOrders: number; totalSpent: number; points: number; tags: string[] };
  customerName: string;
  phone: string;
  partySize: number;
  dateTime: string;
  duration: number;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  branchId?: string;
  userId?: string;
  type: 'low_stock' | 'shift_end' | 'new_order' | 'payment_received' | 'reservation' | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: { id: string; name: string; role: string };
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export interface RevenueBreakdown {
  date: string;
  revenue: number;
  orders: number;
}

export interface HourlyBreakdown {
  hour: number;
  orders: number;
  revenue: number;
}

export interface StockSummary {
  total: number;
  outOfStock: number;
  lowStock: number;
  healthy: number;
}

export interface ShiftReport {
  shift: Shift;
  orders: Order[];
}

export interface RangeReport {
  period: { from: string; to: string };
  summary: {
    totalOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalCash: number;
    totalCard: number;
    totalOnline: number;
    totalDiscount: number;
    avgOrderValue: number;
  };
  topProducts: { productId: string; name: string; count: number; revenue: number }[];
  dailyBreakdown: Record<string, { orders: number; revenue: number }>;
  shifts: Shift[];
}

export interface Branch {
  id: string;
  restaurantId: string;
  restaurant?: Restaurant;
  name: string;
  address?: string;
  phone?: string;
  wifiName?: string;
  wifiPassword?: string;
  status: 'active' | 'inactive';
  tables?: Table[];
  categories?: Category[];
  createdAt: string;
}

export interface Table {
  id: string;
  branchId: string;
  number: string;
  qrCode: string;
  status: 'active' | 'inactive' | 'occupied';
  capacity?: number;
  section?: string;
  shape?: 'square' | 'round' | 'rectangle';
  posX?: number;
  posY?: number;
  mergedWith?: string;
  createdAt: string;
}

export interface TableStats {
  tableId: string;
  number: string;
  section?: string;
  status: string;
  capacity?: number;
  mergedWith?: string;
  totalOrders: number;
  avgDurationMin: number;
  avgRevenue: number;
}

export interface Category {
  id: string;
  branchId: string;
  name: string;
  nameAz: string;
  nameEn: string;
  nameRu: string;
  nameTr: string;
  icon?: string;
  sortOrder: number;
  status: 'active' | 'inactive';
  products?: Product[];
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  nameAz: string;
  nameEn: string;
  nameRu: string;
  nameTr: string;
  description?: string;
  descriptionAz?: string;
  descriptionEn?: string;
  descriptionRu?: string;
  descriptionTr?: string;
  price: number;
  image?: string;
  sortOrder: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  isPopular: boolean;
  hasExtras: boolean;
  hasSizes: boolean;
  stockEnabled: boolean;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  unit?: string;
  calories?: number;
  allergens?: string[];
  prepTime?: number;
  sizes?: ProductSize[];
  extras?: ProductExtra[];
  category?: Category;
  createdAt: string;
  stockStatus?: 'ok' | 'low' | 'out';
}

export interface ProductSize {
  id: string;
  productId: string;
  name: string;
  nameAz: string;
  nameEn: string;
  priceModifier: number;
  isDefault: boolean;
}

export interface ProductExtra {
  id: string;
  productId: string;
  name: string;
  nameAz: string;
  nameEn: string;
  price: number;
}


export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderFulfillmentType = 'delivery' | 'takeaway' | 'dine_in';
export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  orderNumber: string;
  receiptNumber?: string;
  tableId?: string | null;
  table?: Table | null;
  branchId: string;
  fulfillmentType: OrderFulfillmentType;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryNote?: string | null;
  pickupTime?: string | null;
  customerId?: string;
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'points'>;
  cashDrawerId?: string;
  promoCodeId?: string;
  promoCode?: Pick<PromoCode, 'id' | 'code' | 'type' | 'value'>;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  discountCode?: string;
  promoDiscount: number;
  tip: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  paidById?: string;
  paidBy?: Pick<StaffMember, 'id' | 'name'>;
  specialRequest?: string;
  estimatedTime?: number;
  preparationStartedAt?: string;
  preparationCompletedAt?: string;
  preparationDuration?: number;
  delayMinutes?: number;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledById?: string;
  cancelledBy?: Pick<StaffMember, 'id' | 'name' | 'email' | 'role'>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  selectedSizeId?: string;
  unitPrice: number;
  totalPrice: number;
  specialNote?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  extras?: OrderItemExtra[];
}

export interface OrderItemExtra {
  id: string;
  orderItemId: string;
  extraId: string;
  name: string;
  price: number;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  message?: string;
  estimatedTime?: number;
  itemId?: string;
}

export interface WaiterRequest {
  id: string;
  tableId: string;
  table?: Table;
  type: 'call' | 'water' | 'napkin' | 'bill' | 'clean' | 'other';
  status: 'pending' | 'accepted' | 'done' | 'rejected';
  message?: string;
  createdAt: string;
  acceptedById?: string;
  acceptedAt?: string;
  acceptedBy?: { id: string; name: string };
  rejectedById?: string;
  rejectedAt?: string;
  rejectedBy?: { id: string; name: string };
  rejectionNote?: string;
}


export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableNumber: string;
  fulfillmentType?: OrderFulfillmentType;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryNote?: string | null;
  pickupTime?: string | null;
  items: KitchenOrderItem[];
  status: OrderStatus;
  priority: 'normal' | 'high' | 'urgent';
  specialRequest?: string;
  estimatedTime: number;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
}

export interface KitchenOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  selectedSize?: string;
  selectedExtras: string[];
  specialNote?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface WaiterOrder {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableNumber: string;
  fulfillmentType?: OrderFulfillmentType;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  pickupTime?: string | null;
  items: { productName: string; quantity: number; selectedSize?: string; selectedExtras: string[] }[];
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  specialRequest?: string;
  readyAt?: string;
  createdAt: string;
}

export interface WaiterRequestItem {
  id: string;
  tableId: string;
  tableNumber: string;
  type: string;
  status: 'pending' | 'accepted' | 'done' | 'rejected';
  message?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeTables: number;
  totalTables: number;
  avgOrderTime: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  readyOrders: number;
  popularProducts: PopularProduct[];
  recentOrders: Order[];
  paymentBreakdown: { cash: number; card: number; online: number };
  todayPaymentBreakdown: { cash: number; card: number; online: number };
  stockAlerts: { lowStock: number; outOfStock: number };
  activeShift?: Shift | null;
  unreadNotifications: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  nameAz: string;
  nameEn: string;
  nameRu?: string;
  nameTr?: string;
  category?: Pick<Category, 'name' | 'nameAz' | 'nameEn' | 'nameRu' | 'nameTr'>;
  orderCount: number;
  revenue?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'kitchen' | 'waiter';
  status: 'active' | 'inactive';
  lastActive?: string;
}

export interface BranchStat {
  branchId: string;
  branchName: string;
  restaurantName: string;
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  activeOrders: number;
  occupiedTables: number;
  totalTables: number;
  tableOccupancyPct: number;
  lowStockAlerts: number;
  shiftOpen: boolean;
  shiftOpenedAt?: string;
}

export interface BranchSettings {
  branchId: string;
  isCustomized: boolean;
  defaultPrepTime?: number;
  urgencyWarnMin?: number;
  urgencyDangerMin?: number;
  kitchenAutoPrint?: boolean;
  kitchenSoundOn?: boolean;
  waiterSoundOn?: boolean;
  serviceFeePercent?: number;
  currency?: string;
  timezone?: string;
  taxPercent?: number;
  receiptFooter?: string;
}

export interface Reward {
  id: string;
  title: string;
  titleAz: string;
  titleEn: string;
  description: string;
  descriptionAz: string;
  descriptionEn: string;
  pointsRequired: number;
  discountPercent?: number;
  discountAmount?: number;
  status: 'active' | 'inactive';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
