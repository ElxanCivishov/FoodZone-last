# Sprint 1 — Animasiyalar & Design Overhaul

**Məqsəd:** Bütün frontend-i (müştəri + admin + mətbəx + ofisiant) müasir animasiyalar, glassmorphism effektlər və premium UI ilə yeniləmək.  
**Texnologiya:** `framer-motion` (artıq var), `tailwindcss` (artıq var), yeni CSS token-lar, yeni keyframe-lər.  
**Yeni paket tələbi:** `react-countup` (dashboard counter animasiyaları üçün)

---

## Paket Qurulması

```bash
# Kök direktoriyadan:
npm install react-countup
```

---

## Cari Vəziyyət (oxu, dəyişdirmə)

- `tailwind.config.js` — yalnız 2 sadə animation var (`fade-in`, `slide-up`)
- `src/index.css` — CSS custom properties var, lakin glass/glow token yoxdur
- `src/App.tsx` — `CustomerFlow` heç bir `AnimatePresence` olmadan birbaşa `<ScreenComponent />` render edir
- `src/components/common/BottomNav.tsx` — sadə `transition-colors`, heç bir active indicator yoxdur
- `src/components/customer/WelcomeScreen.tsx` — statik, animasiya yoxdur
- `src/components/customer/HomeScreen.tsx` — məhsul kartları düz render olur, stagger yoxdur
- `src/components/admin/components/Sidebar.tsx` — collapse var amma animasiya keçidi kəskindir

---

## Tapşırıqlar

### ✅ 1. `tailwind.config.js` — Design System Genişlənməsi

**Fayl:** `tailwind.config.js`  
**Dəyişiklik:** Mövcud 2 animation-a əlavə olaraq yeni keyframe-lər və token-lar əlavə et.

```js
// tailwind.config.js — tam yenilənmiş fayl
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          inverse: 'hsl(var(--surface-inverse) / <alpha-value>)',
          elevated: 'hsl(var(--surface-elevated) / <alpha-value>)',
          glass: 'hsl(var(--surface-glass) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground) / <alpha-value>)',
          muted: 'hsl(var(--foreground-muted) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        primary: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
          300: '#fdba74', 400: '#fb923c', 500: '#f97316',
          600: '#ea580c', 700: '#c2410c', 800: '#9a3412',
          900: '#7c2d12', 950: '#431407',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
        danger:  { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        // Mövcud
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        // Yenilər
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16,1,0.3,1)',
        'spring-in':  'springIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-scale': 'fadeScale 0.25s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s linear infinite',
        'bounce-in':  'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'float':      'float 3s ease-in-out infinite',
        'draw':       'draw 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        springIn:  { '0%': { transform: 'scale(0.88)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        fadeScale: { '0%': { transform: 'scale(0.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' },
          '50%':     { boxShadow: '0 0 0 12px rgba(249,115,22,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.3)',  opacity: '0' },
          '60%':  { transform: 'scale(1.05)', opacity: '1' },
          '80%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        draw: {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(249,115,22,0.25)',
        'glow':    '0 0 24px rgba(249,115,22,0.35)',
        'glow-lg': '0 0 48px rgba(249,115,22,0.4)',
        'card':    '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.14)',
        'glass':   '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
};
```

---

### ✅ 2. `src/index.css` — Glass Token-lar + Utility Siniflər

**Fayl:** `src/index.css`  
**Dəyişiklik:** Mövcud token-lara `--surface-glass` əlavə et, `.glass-card`, `.gradient-text`, `.skeleton` utility sinifləri əlavə et.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --surface: 0 0% 100%;
    --surface-inverse: 220 13% 15%;
    --surface-elevated: 0 0% 98%;
    --surface-glass: 0 0% 100%;
    --foreground: 220 13% 15%;
    --foreground-muted: 220 9% 46%;
    --border: 220 13% 91%;
    --primary: 24 95% 53%;
  }

  .dark {
    --surface: 220 13% 11%;
    --surface-inverse: 0 0% 100%;
    --surface-elevated: 220 13% 15%;
    --surface-glass: 220 13% 18%;
    --foreground: 0 0% 100%;
    --foreground-muted: 220 9% 60%;
    --border: 220 13% 25%;
    --primary: 24 95% 53%;
  }

  body {
    @apply bg-surface text-foreground antialiased transition-colors duration-300;
    -webkit-tap-highlight-color: transparent;
    font-feature-settings: 'cv11', 'ss01';
  }

  * { @apply border-border; }

  ::-webkit-scrollbar        { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track  { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb  { @apply rounded-full bg-foreground-muted/30; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-foreground-muted/50; }
}

@layer components {
  /* ── Glass Card ─────────────────────────────────── */
  .glass-card {
    @apply rounded-2xl border border-white/10 backdrop-blur-md;
    background: hsl(var(--surface-glass) / 0.7);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .dark .glass-card {
    background: hsl(var(--surface-glass) / 0.5);
    border-color: rgba(255,255,255,0.06);
  }

  /* ── Gradient Text ──────────────────────────────── */
  .gradient-text {
    @apply bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent;
  }

  /* ── Shimmer Skeleton ───────────────────────────── */
  .skeleton {
    @apply rounded-xl overflow-hidden relative;
    background: linear-gradient(
      90deg,
      hsl(var(--surface-elevated)) 0%,
      hsl(var(--border)) 50%,
      hsl(var(--surface-elevated)) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s linear infinite;
  }

  /* ── Pressable Button ───────────────────────────── */
  .btn-press {
    @apply transition-all duration-150 active:scale-[0.96] active:brightness-95;
  }

  /* ── Primary Button ─────────────────────────────── */
  .btn-primary {
    @apply btn-press bg-primary-500 text-white rounded-2xl font-semibold
           hover:bg-primary-600 shadow-glow-sm hover:shadow-glow
           transition-all duration-200;
  }

  /* ── Card hover lift ────────────────────────────── */
  .card-lift {
    @apply transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover;
  }
}

@layer utilities {
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 16px); }
  .safe-top    { padding-top: env(safe-area-inset-top, 0px); }

  /* scrollable container — hide scrollbar ama fəaliyyət qalsın */
  .scroll-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scroll-hide::-webkit-scrollbar { display: none; }
}
```

---

### ✅ 3. `src/App.tsx` — Screen keçişlərində `AnimatePresence`

**Fayl:** `src/App.tsx`  
**Dəyişiklik:** `CustomerFlow` funksiyasında `ScreenComponent`-i `AnimatePresence` + `motion.div` ilə əvəz et.

**Mövcud kod (dəyişdirilməlidir):**
```tsx
<main className={cn("max-w-lg mx-auto relative", showNav && "pb-20")}>
  <ScreenComponent />
</main>
```

**Yeni kod:**
```tsx
import { AnimatePresence, motion } from 'framer-motion';

// CustomerFlow funksiyasının içinə əlavə et:
const screenVariants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: { type: 'spring', stiffness: 380, damping: 30 } },
  exit:    { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.18 } },
};

// JSX hissəsi:
<main className={cn("max-w-lg mx-auto relative", showNav && "pb-20")}>
  <AnimatePresence mode="wait">
    <motion.div
      key={currentScreen}
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <ScreenComponent />
    </motion.div>
  </AnimatePresence>
</main>
```

---

### ✅ 4. `src/components/common/BottomNav.tsx` — Active Indicator Animasiyası

**Fayl:** `src/components/common/BottomNav.tsx`  
**Dəyişiklik:** Active tab-da sliding pill indicator + icon spring animasiyası.

```tsx
import { motion } from 'framer-motion';
import { Home, ClipboardList, Gift, MapPin } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const navItems = [
  { id: 'home',          label: 'home.menu',        icon: Home },
  { id: 'my-orders',     label: 'order.trackTitle',  icon: ClipboardList },
  { id: 'rewards',       label: 'rewards.title',     icon: Gift },
  { id: 'order-tracking',label: 'order.tracking',   icon: MapPin },
];

export function BottomNav() {
  const currentScreen = useUIStore((s) => s.currentScreen);
  const setScreen     = useUIStore((s) => s.setScreen);
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50">
      <div className="mx-auto max-w-lg">
        {/* Glass bar */}
        <div className="glass-card rounded-none border-x-0 border-b-0 border-t border-border/50 h-16 flex items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id as any)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 btn-press"
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary-500/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-primary-500 stroke-[2.5]' : 'text-foreground-muted',
                    )}
                  />
                </motion.div>

                <span className={cn(
                  'text-[10px] font-medium transition-colors duration-200 relative',
                  isActive ? 'text-primary-500' : 'text-foreground-muted',
                )}>
                  {t(item.label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

---

### ✅ 5. `src/components/customer/WelcomeScreen.tsx` — Staggered Giriş Animasiyası

**Fayl:** `src/components/customer/WelcomeScreen.tsx`  
**Dəyişiklik:** Logo, mətn, düymələr ardıcıl (stagger) gəlsin.

```tsx
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { ArrowRight, Utensils, Globe } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

export function WelcomeScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((s) => s.setScreen);
  const session   = useSessionStore((s) => s.session);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Arxa fon gradient blob */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500 blur-[80px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-400 blur-[80px]"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm space-y-8 text-center relative z-10"
      >
        {/* Logo */}
        <motion.div variants={item}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mx-auto shadow-glow"
          >
            <Utensils className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>

        {/* Başlıq */}
        <motion.div variants={item} className="space-y-2">
          <h1 className="text-3xl font-bold">{t('welcome.title')}</h1>
          <p className="text-xl gradient-text font-semibold">{t('welcome.subtitle')}</p>
          <div className="text-foreground-muted">
            {session?.restaurantName && (
              <span className="block font-semibold text-foreground">{session.restaurantName}</span>
            )}
            {session?.branchName && (
              <span className="block text-sm">{session.branchName} — {t('waiter.table')} {session.tableNumber}</span>
            )}
          </div>
        </motion.div>

        {/* Düymələr */}
        <motion.div variants={item} className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('home')}
            className="w-full flex items-center justify-center gap-2 py-4 btn-primary text-lg rounded-2xl"
          >
            {t('welcome.start')}
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('language')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-2xl hover:border-primary-500 transition-colors text-sm btn-press"
          >
            <Globe className="w-4 h-4" />
            {t('welcome.changeLang')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

---

### ✅ 6. `src/components/customer/HomeScreen.tsx` — Stagger Product Cards

**Fayl:** `src/components/customer/HomeScreen.tsx`  
**Dəyişiklik:** Məhsul kartlarına `staggerChildren` + `whileHover lift`, kateqoriya sırasına scroll-snap.

**Əsas dəyişikliklər (hissə-hissə tətbiq et):**

```tsx
import { motion } from 'framer-motion';

// Kart animasiya variant-ları — faylın yuxarısına əlavə et
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 350, damping: 28 } },
};

const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

// Məhsul grid-ini əvəz et:
<motion.div
  variants={listVariants}
  initial="hidden"
  animate="show"
  className="grid grid-cols-2 gap-3 p-4"
>
  {filteredProducts.map((product: any) => (
    <motion.div
      key={product.id}
      variants={cardVariants}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => handleProductClick(product)}
      className="bg-surface-elevated rounded-2xl overflow-hidden border border-border cursor-pointer card-lift"
    >
      {/* ... mövcud kart məzmunu ... */}
    </motion.div>
  ))}
</motion.div>

// Kateqoriya sırasını yenilə:
<div className="flex gap-2 px-4 overflow-x-auto scroll-hide pb-1">
  {categories?.data?.map((cat: any, i: number) => (
    <motion.button
      key={cat.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
      className={cn(
        'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
        selectedCategory === cat.id
          ? 'bg-primary-500 text-white shadow-glow-sm'
          : 'bg-surface-elevated border border-border text-foreground-muted hover:border-primary-500',
      )}
    >
      {getLocalizedName(cat)}
    </motion.button>
  ))}
</div>

// Cart düyməsinə pulse animasiyası (item sayı dəyişdikdə):
<motion.button
  onClick={() => setScreen('cart')}
  className="relative p-2 rounded-xl bg-surface-elevated border border-border btn-press"
  whileTap={{ scale: 0.9 }}
>
  <ShoppingBag className="w-5 h-5" />
  <AnimatePresence>
    {itemCount > 0 && (
      <motion.span
        key={itemCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
      >
        {itemCount}
      </motion.span>
    )}
  </AnimatePresence>
</motion.button>
```

---

### ✅ 7. `src/components/customer/OrderSuccessScreen.tsx` — Confetti + Checkmark

**Fayl:** `src/components/customer/OrderSuccessScreen.tsx`  
**Dəyişiklik:** SVG checkmark draw animasiyası + confetti particle burst.

```tsx
import { motion } from 'framer-motion';

// SVG checkmark — draw animasiyası
function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      className="w-24 h-24 bg-success-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.4)]"
    >
      <svg viewBox="0 0 40 40" className="w-12 h-12">
        <motion.path
          d="M8 20 L16 28 L32 12"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
}

// Confetti particles
function Confetti() {
  const colors = ['#f97316', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899'];
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 200 + 100),
    rotate: Math.random() * 720 - 360,
    size: Math.random() * 8 + 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.2, delay: 0.3 + Math.random() * 0.3, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
```

---

### ✅ 8. `src/components/admin/components/Sidebar.tsx` — Smooth Collapse

**Fayl:** `src/components/admin/components/Sidebar.tsx`  
**Dəyişiklik:** Sidebar genişliyi `motion.aside` ilə animasiyalı dəyişsin, label-lar `AnimatePresence` ilə fade olsun.

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// aside → motion.aside
<motion.aside
  animate={{ width: collapsed ? 80 : 288 }}
  transition={{ type: 'spring', stiffness: 280, damping: 30 }}
  className={cn(
    'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border/60 bg-surface-elevated/95 shadow-2xl shadow-black/20 backdrop-blur-md lg:sticky lg:z-40 lg:-mr-px',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  )}
>

// Nav item label-larını AnimatePresence ilə əhatə et:
<AnimatePresence>
  {!collapsed && (
    <motion.span
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="truncate text-sm font-medium"
    >
      {t(item.label)}
    </motion.span>
  )}
</AnimatePresence>
```

---

### ✅ 9. `src/components/admin/components/MetricCard.tsx` — Counter Animasiyası

**Fayl:** `src/components/admin/components/MetricCard.tsx`  
**Dəyişiklik:** Rəqəm dəyərini `react-countup` ilə animasiyalı göstər, karta hover lift əlavə et.

```tsx
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

// Kartı motion.div ilə əhatə et:
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
  whileHover={{ y: -2, transition: { duration: 0.15 } }}
  className="... card-lift"
>
  {/* Rəqəm dəyəri */}
  <CountUp
    end={numericValue}
    duration={1.5}
    separator=","
    decimals={hasDecimals ? 2 : 0}
    suffix={suffix}
    prefix={prefix}
  />
```

---

### ✅ 10. `src/components/kitchen/KanbanColumn.tsx` — Urgency Pulse Border

**Fayl:** `src/components/kitchen/KanbanColumn.tsx`  
**Dəyişiklik:** Gecikən sifarişlərə (urgent) pulsating rəngli border əlavə et.

```tsx
import { motion } from 'framer-motion';

// Order kart wrapper-ı:
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.95, y: 10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: -10 }}
  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
  className={cn(
    'relative rounded-2xl border-2 transition-colors',
    order.priority === 'urgent'  && 'border-danger-500 animate-pulse-glow',
    order.priority === 'high'    && 'border-yellow-400',
    order.priority === 'normal'  && 'border-border',
  )}
>
```

---

## Quraşdırma Qaydası

Tapşırıqları bu ardıcıllıqla tətbiq et (hər biri öncəkindən asılıdır):

1. `npm install react-countup` — paket qur
2. `tailwind.config.js` — token-lar əlavə et
3. `src/index.css` — glass utility sinifləri əlavə et
4. `src/App.tsx` — `AnimatePresence` əlavə et
5. `src/components/common/BottomNav.tsx` — active indicator
6. `src/components/customer/WelcomeScreen.tsx` — stagger animasiya
7. `src/components/customer/HomeScreen.tsx` — product card stagger
8. `src/components/customer/OrderSuccessScreen.tsx` — checkmark + confetti
9. `src/components/admin/components/Sidebar.tsx` — smooth collapse
10. `src/components/admin/components/MetricCard.tsx` — countup
11. `src/components/kitchen/KanbanColumn.tsx` — urgency pulse

---

## Tamamlanma Vəziyyəti

- [x] `npm install react-countup`
- [x] `tailwind.config.js` yeniləndi
- [x] `src/index.css` yeniləndi
- [x] `src/App.tsx` — AnimatePresence əlavə edildi
- [x] `BottomNav.tsx` — active indicator animasiyası
- [x] `WelcomeScreen.tsx` — stagger + floating logo + blob
- [x] `HomeScreen.tsx` — stagger cards + animated cart badge
- [x] `OrderSuccessScreen.tsx` — SVG checkmark draw + confetti
- [x] `Sidebar.tsx` — motion.aside smooth collapse
- [x] `MetricCard.tsx` — react-countup inteqrasiyası
- [x] `KanbanColumn.tsx` — urgency pulse border

---

## Növbəti Sprint

Bütün yuxarıdakılar tamamlandıqdan sonra **SPRINT_2_PAYMENTS.md** faylına keç.  
Sprint 2: Payriff + M10 Azerbaijan payment inteqrasiyası.

---

## Qeydlər (Gələcək Session Üçün)

- `framer-motion` artıq quraşdırılıb (`package.json`-da var), əlavə quraşdırma lazım deyil
- `@` alias `src/` qovluğuna işarə edir (`vite.config.ts`-da konfiqurasiya edilib)
- Müştəri axını screen-based-dir (URL yoxdur) — `uiStore.currentScreen` idarə edir
- Admin panel `/admin/:tab` URL-based routing istifadə edir
- `cn()` utility — `src/utils/cn.ts`-dədir (clsx + tailwind-merge)
- `glass-card` sinifini `.dark` rejiminizdə test etməyi unutma
