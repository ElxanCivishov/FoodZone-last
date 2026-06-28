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
  color: string;
  bg: string;
  icon: React.ElementType;
  step: number;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfigEntry> = {
  payment_pending: {
    color: "text-warning",
    bg: "bg-warning/10",
    icon: CreditCard,
    step: 0,
  },
  new: {
    color: "text-info",
    bg: "bg-info/10",
    icon: Package,
    step: 1,
  },
  preparing: {
    color: "text-warning",
    bg: "bg-warning/10",
    icon: Clock,
    step: 2,
  },
  ready: {
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 3,
  },
  served: {
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 4,
  },
  on_the_way: {
    color: "text-primary",
    bg: "bg-primary/10",
    icon: Truck,
    step: 4,
  },
  delivered: {
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 5,
  },
  completed: {
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 5,
  },
  cancelled: {
    color: "text-coral",
    bg: "bg-coral/10",
    icon: XCircle,
    step: 0,
  },
};

export interface TimelineStep {
  status: OrderStatus;
  icon: typeof CheckCircle2;
}

export const STEPS_BY_TYPE: Record<OrderType, TimelineStep[]> = {
  dine_in: [
    { status: "new", icon: CheckCircle2 },
    { status: "preparing", icon: Flame },
    { status: "ready", icon: Package },
    { status: "served", icon: Utensils },
    { status: "completed", icon: Star },
  ],
  take_away: [
    { status: "new", icon: CheckCircle2 },
    { status: "preparing", icon: Flame },
    { status: "ready", icon: Package },
    { status: "completed", icon: Star },
  ],
  delivery: [
    { status: "new", icon: CheckCircle2 },
    { status: "preparing", icon: Flame },
    { status: "ready", icon: Package },
    { status: "on_the_way", icon: Truck },
    { status: "delivered", icon: CheckCircle2 },
  ],
};

export const CANCEL_REASONS = [
  "changedMind",
  "wrongOrder",
  "tooLong",
  "personal",
  "other",
] as const;
