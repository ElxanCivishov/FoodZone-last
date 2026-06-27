# Menyu + Axtarış Birləşik Ekranı — Plan

## Konsepsiya

`SearchScreen` → `MenuScreen` kimi yenidən formalaşır.  
İki rejim var, animasiya ilə bir-birinə keçir:

```
┌─ Rejim A: Menyu (default) ──────────────────┐
│  [🔍 Axtar...]                               │  ← focus olmamış
│  [Setlər][Çaylar][Yeməklər][İçkilər][...]   │  ← Səv.1 tabs
│  [Qəlyan seti][Çay seti][Combo][Yemək seti] │  ← Səv.2 (şərtli)
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │      │  │      │  │      │              │  ← Məhsul grid
│  └──────┘  └──────┘  └──────┘              │
└──────────────────────────────────────────────┘

           ↕ focus / blur + text

┌─ Rejim B: Axtarış (aktiv) ──────────────────┐
│  [🔍 dragon roll  ✕]  [Ləğv et]             │  ← focus + clear + cancel
│                                              │
│  Nəticələr / Son axtarışlar / Boş vəziyyət │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Rejim Keçidi Məntiqi

```
input.onFocus()          → isSearchMode = true
input.onChange(text)     → isSearchMode = true
✕ düyməsi (clear)        → query = ''  →  isSearchMode = false  → Menyu rejiminə qayıt
"Ləğv et" düyməsi        → query = ''  →  isSearchMode = false  → input.blur()
```

---

## HomeScreen → MenuScreen Keçidi

HomeScreen-dəki hər bölmənin "Hamısına bax" düyməsi:

```
"Populyar → Hamısına bax"   → MenuScreen açılır, aktiv qrup = null (hamısı)
"Set Menyular → Hamısına bax" → MenuScreen açılır, aktiv qrup = 'sets'
```

Store-da yeni sahə:
```ts
menuInitialGroup: string | null   // hangi qrupu seçili açsın
setMenuInitialGroup(id: string | null): void
```

HomeScreen-dəki düymə:
```tsx
onClick={() => {
  setMenuInitialGroup('sets');   // və ya null
  setActiveTab('search');        // 'search' → MenuScreen
}}
```

`MenuScreen` mount olduqda `menuInitialGroup`-u oxuyub aktiv tab kimi set edir, sonra `null`-a sıfırlayır.

---

## BottomNav Dəyişikliyi

`search` tab-ının görünüşü dəyişir, daxili key eyni qalır:

```
Əvvəl:  [🔍 Axtar]
Sonra:  [☰ Menyu]   (LayoutGrid ikonu)
```

Yalnız `BottomNav.tsx`-də ikon və label dəyişir — `store`, `types`, `NavTab` toxunulmur.

---

## Fayl Dəyişiklikləri

| Fayl | Dəyişiklik |
|------|------------|
| `src/screens/SearchScreen.tsx` | Tam yenilənir → `MenuScreen` funksionallığı |
| `src/components/BottomNav.tsx` | `search` tab: ikon + label dəyişir |
| `src/store/index.ts` | `menuInitialGroup` state + `setMenuInitialGroup` əlavəsi |
| `src/screens/HomeScreen.tsx` | "Hamısına bax" düymələri store-a yazıb `setActiveTab('search')` çağırır |
| `src/data/menuData.ts` | İki səviyyəli kateqoriya strukturu |
| `src/types/index.ts` | `CategoryGroup`, `SubCategory` tipləri |

---

## MenuScreen Daxili Struktur

```
MenuScreen
  ├── SearchBar
  │     ├── Rejim A: sadə placeholder, onClick → isSearchMode=true
  │     └── Rejim B: focused, text, ✕ clear, "Ləğv et"
  │
  ├── [isSearchMode = false] → MenuView
  │     ├── Level1Tabs       ← qrup tabları (Setlər, Çaylar...)
  │     ├── Level2Tabs       ← alt kateqoriyalar (şərtli render)
  │     └── ProductGrid      ← filter olunmuş məhsullar
  │
  └── [isSearchMode = true] → SearchView
        ├── query boşdursa  → Son axtarışlar + Kateqoriya chipləri
        ├── nəticə varsa    → ProductGrid (axtarış nəticələri)
        └── nəticə yoxdursa → Boş vəziyyət
```

---

## İki Səviyyəli Kateqoriya Strukturu

```ts
const MENU_GROUPS = [
  { id: 'all',       label: 'Hamısı',      icon: 'LayoutGrid', hasSubs: false },
  { id: 'sets',      label: 'Setlər',      icon: 'Package',    hasSubs: true  },
  { id: 'teas',      label: 'Çaylar',      icon: 'Coffee',     hasSubs: true  },
  { id: 'food',      label: 'Yeməklər',    icon: 'UtensilsCrossed', hasSubs: false },
  { id: 'drinks',    label: 'İçkilər',     icon: 'GlassWater', hasSubs: true  },
  { id: 'breakfast', label: 'Səhər yeməyi',icon: 'Sunrise',    hasSubs: false },
];

const MENU_SUBS: Record<string, { id: string; label: string }[]> = {
  sets: [
    { id: 'hookah-set', label: 'Qəlyan seti'  },
    { id: 'tea-set',    label: 'Çay seti'     },
    { id: 'combo',      label: 'Combo menyu'  },
    { id: 'food-set',   label: 'Yemək seti'   },
  ],
  teas: [
    { id: 'herbal',  label: 'Bitki çayı'  },
    { id: 'fruit',   label: 'Meyvə çayı'  },
    { id: 'green',   label: 'Yaşıl çay'   },
    { id: 'black',   label: 'Qara çay'    },
  ],
  drinks: [
    { id: 'cold',    label: 'Soyuq içki'  },
    { id: 'water',   label: 'Su'           },
    { id: 'juice',   label: 'Şirə'         },
  ],
};
```

---

## Filtr Məntiqi

```ts
// Səviyyə 1 seçildi, Səviyyə 2 yoxdur
activeGroup = 'food', activeSub = null
→ products.filter(p => p.groupId === 'food')

// Səviyyə 2 seçildi
activeGroup = 'sets', activeSub = 'combo'
→ products.filter(p => p.subcategoryId === 'combo')

// "Hamısı"
activeGroup = 'all'
→ bütün products
```

---

## Animasiya

Rejim keçidi: `AnimatePresence` + `motion.div` ilə smooth fade/slide.

```tsx
<AnimatePresence mode="wait">
  {isSearchMode
    ? <SearchView key="search" />
    : <MenuView   key="menu"   />
  }
</AnimatePresence>
```

---

## İcra Sırası

| # | Tapşırıq |
|---|----------|
| 1 | `types/index.ts` — `CategoryGroup`, `SubCategory` tipləri; `Product`-a `groupId`, `subcategoryId` |
| 2 | `menuData.ts` — `MENU_GROUPS`, `MENU_SUBS`, məhsullara `groupId`/`subcategoryId` əlavə et |
| 3 | `store/index.ts` — `menuInitialGroup` + `setMenuInitialGroup` |
| 4 | `SearchScreen.tsx` — tam yenilə: iki rejim, iki səviyyəli tabs, filtr məntiqi |
| 5 | `BottomNav.tsx` — `search` tab: `LayoutGrid` ikonu + "Menyu" labeli |
| 6 | `HomeScreen.tsx` — "Hamısına bax" düymələri qrupu set edib `MenuScreen`-ə keçir |
