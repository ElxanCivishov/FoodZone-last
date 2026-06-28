import type { Screen } from "@/types";
import {
  Award,
  Bell,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  MapPin,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Star,
  Tag,
} from "lucide-react";
import type React from "react";

export { SPRING } from "@/utils/motion";

export const MOCK_XP = 240; // TODO: fetch from Customer API

export const STATS = [
  { icon: Package, label: "Sifariş", value: "12" },
  { icon: Star, label: "Rəy", value: "8" },
  { icon: Award, label: "Xal", value: "240" },
];

export type MenuItem = {
  icon: React.ElementType;
  label: string;
  screen?: Screen;
  badge?: string;
};

export const GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Fəaliyyət",
    items: [
      { icon: Receipt, label: "Sifariş Tarixçəsi", screen: "orderHistory" },
      { icon: Heart, label: "Seçilmişlər", screen: "favorites" },
      { icon: Bell, label: "Ofisiant Müraciətləri", screen: "waiterRequests" },
    ],
  },
  {
    title: "Hesab",
    items: [
      { icon: CreditCard, label: "Ödəniş üsulları", screen: "payments" },
      { icon: Tag, label: "Kuponlarım", screen: "coupons" },
      { icon: MapPin, label: "Ünvanlarım", screen: "addresses" },
    ],
  },
  {
    title: "Rəy və Dəstək",
    items: [
      { icon: Star, label: "Rəylərim", screen: "reviews" },
      { icon: MessageSquare, label: "Dəstək Müraciətləri", screen: "supportRequests" },
      { icon: HelpCircle, label: "Dəstək", screen: "help" },
    ],
  },
  {
    title: "Tənzimləmələr",
    items: [
      { icon: Globe, label: "Dil seçimi", badge: "AZ" },
      { icon: Settings, label: "Tənzimləmələr", screen: "settings" },
    ],
  },
];
