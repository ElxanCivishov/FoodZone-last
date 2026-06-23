import {
  Apple,
  Beef,
  Beer,
  Candy,
  CakeSlice,
  Carrot,
  ChefHat,
  Cherry,
  Cookie,
  Coffee,
  Croissant,
  CupSoda,
  Drumstick,
  EggFried,
  Fish,
  GlassWater,
  Ham,
  IceCreamBowl,
  IceCreamCone,
  Martini,
  Milk,
  Salad,
  Soup,
  Sprout,
  Leaf,
  Pizza,
  Sandwich,
  Tags,
  Vegan,
  Wheat,
  Utensils,
  Wine,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const categoryIconMap = {
  apple: Apple,
  beef: Beef,
  beer: Beer,
  candy: Candy,
  carrot: Carrot,
  cherry: Cherry,
  cookie: Cookie,
  croissant: Croissant,
  'cup-soda': CupSoda,
  cupsoda: CupSoda,
  drink: CupSoda,
  drinks: CupSoda,
  soda: CupSoda,
  'drumstick': Drumstick,
  chicken: Drumstick,
  'egg-fried': EggFried,
  egg: EggFried,
  fish: Fish,
  'glass-water': GlassWater,
  water: GlassWater,
  ham: Ham,
  icecream: IceCreamCone,
  'ice-cream': IceCreamCone,
  'ice-cream-bowl': IceCreamBowl,
  martini: Martini,
  cocktail: Martini,
  milk: Milk,
  salad: Salad,
  soup: Soup,
  sprout: Sprout,
  utensils: Utensils,
  leaf: Leaf,
  'chef-hat': ChefHat,
  chefhat: ChefHat,
  sandwich: Sandwich,
  pizza: Pizza,
  cake: CakeSlice,
  dessert: CakeSlice,
  coffee: Coffee,
  shrimp: Fish,
  seafood: Fish,
  vegan: Vegan,
  wheat: Wheat,
  wine: Wine,
} as const;

interface CategoryIconProps {
  value?: string;
  className?: string;
  iconClassName?: string;
}

export function CategoryIcon({ value, className, iconClassName }: CategoryIconProps) {
  const parsed = parseCategoryIcon(value);

  return (
    <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500', className)}>
      {parsed.type === 'lucide' && <parsed.Icon className={cn('h-4 w-4', iconClassName)} />}
      {parsed.type === 'image' && <img src={parsed.src} alt="" className="h-full w-full rounded-lg object-cover" />}
      {parsed.type === 'text' && <span className="max-w-6 truncate text-center text-base leading-none">{parsed.text}</span>}
      {parsed.type === 'fallback' && <Tags className={cn('h-4 w-4', iconClassName)} />}
    </span>
  );
}

function parseCategoryIcon(value?: string) {
  const icon = value?.trim();
  if (!icon) return { type: 'fallback' as const };

  const mappedIcon = categoryIconMap[icon.toLowerCase() as keyof typeof categoryIconMap];
  if (mappedIcon) return { type: 'lucide' as const, Icon: mappedIcon };

  if (/^(https?:\/\/|\/|data:image\/)/i.test(icon)) {
    return { type: 'image' as const, src: icon };
  }

  return { type: 'text' as const, text: icon };
}
