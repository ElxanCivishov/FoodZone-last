import {
  CheckCircle2,
  Clock,
  CreditCard,
  Flame,
  Package,
  Star,
  Truck,
  Utensils,
  XCircle,
} from "lucide-react";
import type { OrderStatus, OrderType } from "@/types";

export { SPRING } from "@/utils/motion";

export interface StatusConfigEntry {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  step: number;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfigEntry> = {
  payment_pending: {
    label: "Ödəniş gözlənilir",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: CreditCard,
    step: 0,
  },
  new: {
    label: "Qəbul edildi",
    color: "text-info",
    bg: "bg-info/10",
    icon: Package,
    step: 1,
  },
  preparing: {
    label: "Hazırlanır",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: Clock,
    step: 2,
  },
  ready: {
    label: "Hazırdır",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 3,
  },
  served: {
    label: "Təqdim edildi",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 4,
  },
  on_the_way: {
    label: "Yoldadır",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: Truck,
    step: 4,
  },
  delivered: {
    label: "Çatdırıldı",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 5,
  },
  completed: {
    label: "Tamamlandı",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 5,
  },
  cancelled: {
    label: "Ləğv edildi",
    color: "text-coral",
    bg: "bg-coral/10",
    icon: XCircle,
    step: 0,
  },
};

export interface TimelineStep {
  status: OrderStatus;
  title: string;
  subtitle: string;
  icon: typeof CheckCircle2;
}

export const STEPS_BY_TYPE: Record<OrderType, TimelineStep[]> = {
  dine_in: [
    {
      status: "new",
      title: "Qəbul edildi",
      subtitle: "Sifarişiniz sistemə daxil oldu",
      icon: CheckCircle2,
    },
    {
      status: "preparing",
      title: "Hazırlanır",
      subtitle: "Aşpazımız işə başladı",
      icon: Flame,
    },
    {
      status: "ready",
      title: "Hazırdır",
      subtitle: "Sifarişiniz hazırlanıb",
      icon: Package,
    },
    {
      status: "served",
      title: "Xidmət edildi",
      subtitle: "Masanıza gətirildi",
      icon: Utensils,
    },
    {
      status: "completed",
      title: "Tamamlandı",
      subtitle: "Nuş olsun!",
      icon: Star,
    },
  ],
  take_away: [
    {
      status: "new",
      title: "Qəbul edildi",
      subtitle: "Sifarişiniz sistemə daxil oldu",
      icon: CheckCircle2,
    },
    {
      status: "preparing",
      title: "Hazırlanır",
      subtitle: "Aşpazımız işə başladı",
      icon: Flame,
    },
    {
      status: "ready",
      title: "Hazırdır",
      subtitle: "Götürməyə hazırdır",
      icon: Package,
    },
    {
      status: "completed",
      title: "Tamamlandı",
      subtitle: "Nuş olsun!",
      icon: Star,
    },
  ],
  delivery: [
    {
      status: "new",
      title: "Qəbul edildi",
      subtitle: "Sifarişiniz sistemə daxil oldu",
      icon: CheckCircle2,
    },
    {
      status: "preparing",
      title: "Hazırlanır",
      subtitle: "Aşpazımız işə başladı",
      icon: Flame,
    },
    {
      status: "ready",
      title: "Hazırdır",
      subtitle: "Kuryerimiz sifarişinizi təhvil alır",
      icon: Package,
    },
    {
      status: "on_the_way",
      title: "Yoldadır",
      subtitle: "Kuryerimiz sizə doğru gəlir",
      icon: Truck,
    },
    {
      status: "delivered",
      title: "Çatdırıldı",
      subtitle: "Nuş olsun!",
      icon: CheckCircle2,
    },
  ],
};

export const CANCEL_REASONS = [
  "Fikir dəyişdim",
  "Yanlış sifariş verdim",
  "Çox gözləmək istəmirəm",
  "Şəxsi səbəb",
  "Digər",
];
