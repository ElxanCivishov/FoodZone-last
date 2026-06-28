import type { MenuItem } from "@/types";
import {
  Coffee,
  GlassWater,
  LayoutGrid,
  Package,
  Sunrise,
  UtensilsCrossed,
} from "lucide-react";

export const GROUP_ICONS: Record<
  string,
  React.FC<{ size?: number; className?: string }>
> = {
  LayoutGrid,
  Package,
  Coffee,
  UtensilsCrossed,
  GlassWater,
  Sunrise,
};

export const RECENT_TAGS = [
  "Qəlyan seti",
  "Nanə çayı",
  "Plov",
  "Combo",
  "Alma şirəsi",
];

export interface ProductSection {
  id: string;
  label: string;
  icon?: string;
  items: MenuItem[];
}
