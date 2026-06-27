import type { Product, SizeOption, ExtraOption, Category } from '@/types';

import salmonNigiriImg from '@/assets/images/salmon-nigiri.jpg';
import tunaNigiriImg from '@/assets/images/tuna-nigiri.jpg';
import dragonRollImg from '@/assets/images/dragon-roll.jpg';
import rainbowRollImg from '@/assets/images/rainbow-roll.jpg';
import misoRamenImg from '@/assets/images/miso-ramen.jpg';
import tonkotsuRamenImg from '@/assets/images/tonkotsu-ramen.jpg';
import wagyuNigiriImg from '@/assets/images/wagyu-nigiri.jpg';
import uniSashimiImg from '@/assets/images/uni-sashimi.jpg';
import matchaCheesecakeImg from '@/assets/images/matcha-cheesecake.jpg';
import sakeSetImg from '@/assets/images/sake-set.jpg';
import sushiSetImg from '@/assets/images/sushi-set.jpg';

export const popularProducts: Product[] = [
  {
    id: 1,
    name: 'Salmon Nigiri',
    desc: 'Təzə Norveç qızılbalığı',
    price: 12,
    rating: 4.8,
    reviews: 234,
    image: salmonNigiriImg,
    category: 'sushi',
    badge: 'Populyar',
  },
  {
    id: 2,
    name: 'Tuna Nigiri',
    desc: 'Mavi köpəkbalığı',
    price: 14,
    rating: 4.7,
    reviews: 189,
    image: tunaNigiriImg,
    category: 'sushi',
  },
  {
    id: 3,
    name: 'Dragon Roll',
    desc: 'Əjdaha rollu',
    price: 28,
    rating: 4.9,
    reviews: 312,
    image: dragonRollImg,
    category: 'rolls',
    badge: 'Ən çox satılan',
  },
  {
    id: 4,
    name: 'Rainbow Roll',
    desc: 'Rənkli roll',
    price: 32,
    rating: 4.6,
    reviews: 156,
    image: rainbowRollImg,
    category: 'rolls',
  },
  {
    id: 5,
    name: 'Miso Ramen',
    desc: 'Miso şorbası ilə',
    price: 18,
    rating: 4.5,
    reviews: 98,
    image: misoRamenImg,
    category: 'ramen',
  },
  {
    id: 6,
    name: 'Tonkotsu Ramen',
    desc: 'Donuz əti ilə',
    price: 22,
    rating: 4.8,
    reviews: 145,
    image: tonkotsuRamenImg,
    category: 'ramen',
  },
];

export const newArrivals: Product[] = [
  {
    id: 7,
    name: 'Wagyu Nigiri',
    desc: 'Yapon mal əti',
    price: 45,
    rating: 4.9,
    reviews: 67,
    image: wagyuNigiriImg,
    category: 'sushi',
    badge: 'Yeni',
  },
  {
    id: 8,
    name: 'Uni Sashimi',
    desc: 'Dəniz kirpisi',
    price: 38,
    rating: 4.7,
    reviews: 43,
    image: uniSashimiImg,
    category: 'sashimi',
    badge: 'Yeni',
  },
  {
    id: 9,
    name: 'Matcha Cheesecake',
    desc: 'Yapon yaşıl çay',
    price: 16,
    rating: 4.6,
    reviews: 89,
    image: matchaCheesecakeImg,
    category: 'desserts',
  },
  {
    id: 10,
    name: 'Sake Set',
    desc: 'Yapon sake dəsti',
    price: 55,
    rating: 4.8,
    reviews: 34,
    image: sakeSetImg,
    category: 'drinks',
  },
];

export const setMenus: Product[] = [
  {
    id: 11,
    name: 'Sushi Set A',
    desc: '12 sushi + miso şorbası',
    price: 48,
    rating: 4.7,
    reviews: 120,
    image: sushiSetImg,
    category: 'sushi',
    badge: 'Set',
  },
  {
    id: 12,
    name: 'Sushi Set B',
    desc: '18 sushi + salat + içki',
    price: 72,
    rating: 4.8,
    reviews: 95,
    image: salmonNigiriImg,
    category: 'sushi',
    badge: 'Set',
  },
  {
    id: 13,
    name: 'Ramen Combo',
    desc: 'Ramen + qyoza + içki',
    price: 28,
    rating: 4.5,
    reviews: 78,
    image: misoRamenImg,
    category: 'ramen',
    badge: 'Set',
  },
  {
    id: 14,
    name: 'Sashimi Deluxe',
    desc: 'Təzə sashimi seçimi',
    price: 65,
    rating: 4.9,
    reviews: 56,
    image: uniSashimiImg,
    category: 'sashimi',
    badge: 'Set',
  },
];

export const allProducts: Product[] = [
  ...popularProducts,
  ...newArrivals,
  ...setMenus,
];

export const categories: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: 'Hamısı', icon: 'LayoutGrid' },
  { id: 'sushi', label: 'Sushi', icon: 'Fish' },
  { id: 'ramen', label: 'Ramen', icon: 'Soup' },
  { id: 'sashimi', label: 'Sashimi', icon: 'FishSymbol' },
  { id: 'rolls', label: 'Roll', icon: 'Scroll' },
  { id: 'desserts', label: 'Desert', icon: 'IceCream' },
  { id: 'drinks', label: 'İçki', icon: 'Wine' },
];

export const sizeOptions: SizeOption[] = [
  { id: '4pc', label: '4 pieces', priceModifier: 0 },
  { id: '8pc', label: '8 pieces', priceModifier: 12 },
  { id: '12pc', label: '12 pieces', priceModifier: 18 },
];

export const extraOptions: ExtraOption[] = [
  { id: 'wasabi', label: 'Extra Wasabi', price: 2 },
  { id: 'ginger', label: 'Extra Ginger', price: 3 },
  { id: 'soy', label: 'Extra Soy Sauce', price: 1 },
];

export const TABLE_NUMBER = 12;
