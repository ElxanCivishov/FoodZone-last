# Menu Strukturu — Plan

## Problem

Çox sayda müxtəlif kateqoriya var:
- **Setlər**: Qəlyan seti, Çay seti, Combo menyu, Yemək seti
- **Çaylar**: Bitki çayı, Yaşıl çay, Qara çay, Meyvə çayı, və s. (hər birinin detalları)
- **Yeməklər**: Əsas yeməklər
- **Sular / İçkilər**: Soyuq içkilər, Sular, Şirələr
- **Səhər yeməyi**: Breakfast menyu

Bir sıra horizontal tab-a sığmaz, idarə etmək çətinləşər.

---

## Həll: İki Səviyyəli Kateqoriya Sistemi

### Səviyyə 1 — Əsas qruplar (horizontal tab)

```
[Hamısı] [Setlər] [Çaylar] [Yeməklər] [İçkilər] [Səhər yeməyi]
```

### Səviyyə 2 — Alt kateqoriyalar (yalnız seçilmiş qrupda görünür)

```
"Setlər" seçildikdə:
  → [Qəlyan seti] [Çay seti] [Combo menyu] [Yemək seti]

"Çaylar" seçildikdə:
  → [Bitki çayı] [Yaşıl çay] [Qara çay] [Meyvə çayı] [...]

"İçkilər" seçildikdə:
  → [Soyuq içkilər] [Sular] [Şirələr] [Enerjili içkilər]

"Yeməklər" seçildikdə:
  → alt tab yoxdur, birbaşa məhsullar göstərilir

"Səhər yeməyi" seçildikdə:
  → alt tab yoxdur, birbaşa məhsullar göstərilir
```

---

## HomeScreen UI

```
┌────────────────────────────────────────────┐
│  Header (ünvan, cart, dark mode, wifi)     │
│  Search bar                                │
├────────────────────────────────────────────┤
│  Promo banner (carousel)                   │
├────────────────────────────────────────────┤
│  [Hamısı][Setlər][Çaylar][Yemək][İçki]... │  ← Səviyyə 1
├────────────────────────────────────────────┤
│  (yalnız "Setlər" kimi alt kateqoriya      │
│   olanlar seçildikdə görünür)              │
│  [Qəlyan seti][Çay seti][Combo][Yemək s.] │  ← Səviyyə 2
├────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐                 │
│  │  şəkil  │  │  şəkil  │                 │
│  │  Ad     │  │  Ad     │                 │  ← Məhsul grid
│  │  5.50₼  │  │  6.00₼  │                 │
│  └─────────┘  └─────────┘                 │
└────────────────────────────────────────────┘
```

---

## Çaylar üçün Xüsusi Detal

Çayların hər birinin detalları var (dəmləmə üsulu, ingredientlər, faydaları).  
`ProductDetail` modalında əlavə sahələr göstərilir:

```
┌──────────────────────────────┐
│  [Çay şəkli]                 │
│  Alma-Tarçın Çayı            │
│  "Ürəyinizi isidən qarışıq"  │
│  ─────────────────────────   │
│  🌿 Tərkib: alma, tarçın...  │
│  ⏱  Dəmləmə: 5 dəq / 90°C  │
│  💚 Fayda: həzm, immunitet   │
│  ─────────────────────────   │
│  [−] 1 [+]   Səbətə → 3₼    │
└──────────────────────────────┘
```

`Product` tipinə əlavə sahələr:
```ts
brewTemp?: string;    // "90°C"
brewTime?: string;    // "5 dəq"
ingredients?: string; // "alma, tarçın, zəncəfil"
benefits?: string;    // "həzm sistemi, immunitet"
```

---

## Data Strukturu

```ts
// Səviyyə 1 — əsas qrup
interface CategoryGroup {
  id: string;           // 'sets' | 'teas' | 'food' | 'drinks' | 'breakfast'
  label: string;        // "Setlər"
  icon: string;         // lucide icon adı
  hasSubcategories: boolean;
}

// Səviyyə 2 — alt kateqoriya
interface SubCategory {
  id: string;           // 'hookah-set' | 'tea-set' | 'combo' | 'food-set'
  groupId: string;      // parent group
  label: string;        // "Qəlyan seti"
  icon?: string;
}

// Məhsul — mövcud Product tipinə əlavələr
interface Product {
  // mövcud sahələr...
  subcategoryId: string;    // hansı alt kateqoriyaya aid
  brewTemp?: string;        // çaylar üçün
  brewTime?: string;        // çaylar üçün
  ingredients?: string;     // çaylar üçün
  benefits?: string;        // çaylar üçün
}
```

---

## Kateqoriya Xəritəsi

| Qrup (Səv.1) | Alt kateqoriya (Səv.2) | Məhsul nümunələri |
|---|---|---|
| Setlər | Qəlyan seti | Standart set, Premium set, VIP set |
| Setlər | Çay seti | İkiəlli çay dəsti, Ailə çay dəsti |
| Setlər | Combo menyu | Burger+fri+içki, Pizza+salat |
| Setlər | Yemək seti | Günün yeməyi, Ailə seti |
| Çaylar | Bitki çayı | Nanə, Çobanyastığı, Papatya |
| Çaylar | Meyvə çayı | Alma-tarçın, Limon-zəncəfil |
| Çaylar | Yaşıl çay | Sencha, Jasmin yaşıl |
| Çaylar | Qara çay | Earl Grey, Türk çayı |
| Yeməklər | — | Kebab, Plov, Pizza... |
| İçkilər | Soyuq içkilər | Kola, Limonad, Şirə |
| İçkilər | Sular | Adi su, Qazvari su |
| Səhər yeməyi | — | Omlet, Yumurta, Çörək... |

---

## Fayllar (dəyişəcək)

| Fayl | Dəyişiklik |
|------|------------|
| `src/data/menuData.ts` | Yeni kateqoriya strukturu — qruplar + alt kateqoriyalar + məhsullar |
| `src/types/index.ts` | `CategoryGroup`, `SubCategory` tipləri; `Product`-a yeni sahələr |
| `src/screens/HomeScreen.tsx` | İki səviyyəli tab sistemi |
| `src/screens/ProductDetail.tsx` | Çay detalları (brewTemp, brewTime, ingredients, benefits) |

---

## İcra Addımları

| # | Tapşırıq |
|---|----------|
| 1 | `types/index.ts` — `CategoryGroup`, `SubCategory` tipləri əlavə et |
| 2 | `menuData.ts` — kateqoriya qrupları + alt kateqoriyalar + nümunə məhsullar yaz |
| 3 | `HomeScreen.tsx` — iki səviyyəli tab sistemi (Səv.1 → Səv.2 → məhsullar) |
| 4 | `ProductDetail.tsx` — çay detallarını göstər (şərtli render) |

---

## Alternativ: Ayrıca "Menyu" Ekranı

Əgər HomeScreen-i sadə (featured/popular) saxlamaq istəsən:

```
BottomNav: [🏠 Ev] [📋 Menyu] [📦 Sifarişlər] [👤 Profil]
```

- **Ev (HomeScreen)**: promo banner + populyar məhsullar + yeni gələnlər
- **Menyu (MenuScreen)**: tam iki səviyyəli kateqoriya sistemi

**Tövsiyə**: Çox kateqoriya varsa ayrıca `MenuScreen` daha səliqəlidir.  
Hazırda `search` tab-ı az istifadə olunursa `MenuScreen` ilə əvəzlənə bilər.
