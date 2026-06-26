# Sprint 7 — PWA + Multi-Branch + Polish

**Məqsəd:** Tətbiqi Progressive Web App-a çevirmək, Multi-branch Super Admin paneli, son cilalamalar.  
**Ön şərt:** Sprint 1 tamamlanmış, ideally Sprint 2-6 da hazırdır.

---

## Cari Vəziyyət

**Mövcud olan:**
- Vite build sistemi (PWA plugin dəstəkləyir)
- `MultiBranchView.tsx` — artıq mövcuddur (super_admin üçün)
- Socket.io real-time — artıq mövcuddur
- Dark/light theme — artıq mövcuddur

**Mövcud olmayan:**
- `manifest.json` — PWA meta
- Service Worker — offline cache + push notification
- "Ana ekrana əlavə et" prompt
- Multi-branch dashboard (canlı statistika kartları)
- Push notification (yeni sifariş, stok xəbərdarlığı)
- Performance: lazy loading, virtual list, image optimization

---

## Paket Qurulması

```bash
# PWA plugin (Vite):
npm install vite-plugin-pwa workbox-window

# Virtual list (uzun siyahılar üçün):
npm install @tanstack/react-virtual
```

---

## Tapşırıq 1 — `vite.config.ts` — PWA Plugin

**Fayl:** `vite.config.ts`  
**Dəyişiklik:** `VitePWA` plugin-i əlavə et.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name:             'FoodZone',
        short_name:       'FoodZone',
        description:      'Restoran QR Menyu & Sifariş Sistemi',
        theme_color:      '#f97316',
        background_color: '#0f0f12',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        scope:            '/',
        lang:             'az',
        icons: [
          { src: '/icons/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache strategiyaları:
        runtimeCaching: [
          {
            // Menyu şəkilləri — cache first
            urlPattern: /^https?:\/\/.*\/uploads\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName:        'images-cache',
              expiration:       { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 gün
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API — network first, fallback cache
            urlPattern: /^https?:\/\/.*\/api\/branches\/.*/i,
            handler:    'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5 dəq
            },
          },
        ],
        // Offline fallback səhifəsi:
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
```

**`public/` qovluğuna icon-lar əlavə et:**
```
public/
  icons/
    icon-192.png  (192×192 — PWA üçün əsas)
    icon-512.png  (512×512 — splash screen)
  favicon.ico
  apple-touch-icon.png (180×180)
```

---

## Tapşırıq 2 — "Ana Ekrana Əlavə Et" Prompt

**Yeni fayl:** `src/hooks/usePWAInstall.ts`

```typescript
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall]         = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    // Artıq quraşdırılıbsa:
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return { canInstall, isInstalled, promptInstall };
}
```

**Komponent — `WelcomeScreen.tsx`-ə əlavə et:**

```tsx
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download } from 'lucide-react';

// WelcomeScreen içinə:
const { canInstall, promptInstall } = usePWAInstall();

{canInstall && (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={promptInstall}
    className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary-500/40 rounded-2xl text-sm text-primary-500 hover:bg-primary-500/5 transition-colors"
  >
    <Download className="w-4 h-4" />
    Tətbiqi qur (Offline istifadə üçün)
  </motion.button>
)}
```

---

## Tapşırıq 3 — Web Push Notification (Server)

**Paket:**
```bash
cd server && npm install web-push
npm install --save-dev @types/web-push
```

**`server/.env`-ə əlavə et:**
```env
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:admin@yourrestaurant.az

# VAPID key-ləri generate etmək:
# node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys())"
```

**Yeni fayl:** `server/src/lib/webPush.ts`

```typescript
import webpush from 'web-push';
import { prisma } from './prisma';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUser(userId: string, payload: { title: string; body: string; data?: any }) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ).catch(() =>
        prisma.pushSubscription.delete({ where: { id: sub.id } }) // Köhnə subscription-ı sil
      )
    )
  );
}

export async function sendPushToBranch(branchId: string, payload: { title: string; body: string; data?: any }) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { branchId } });

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      )
    )
  );
}
```

**Prisma schema — `PushSubscription` modeli əlavə et:**

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String?
  branchId  String?
  endpoint  String
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([branchId])
}
```

---

## Tapşırıq 4 — Multi-Branch Dashboard (Super Admin)

**Fayl:** `src/components/admin/views/MultiBranchView.tsx`  
**Dəyişiklik:** Mövcud görünüşü canlı statistikalar ilə yenilə.

```tsx
// Hər filial üçün real-time kart:
function BranchCard({ branch }) {
  const { data: stats, isLoading } = useQuery({
    queryKey:    ['branch-stats', branch.id],
    queryFn:     () => api.get(`/dashboard/stats?branchId=${branch.id}`).then(r => r.data.data),
    refetchInterval: 30000,
  });

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="bg-surface-elevated rounded-2xl border border-border p-5 card-lift"
    >
      {/* Branch header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">{branch.name}</h3>
          <p className="text-xs text-foreground-muted">{branch.address}</p>
        </div>
        <span className={cn(
          'text-xs font-semibold px-2 py-1 rounded-full',
          stats?.activeShift ? 'bg-success-500/15 text-success-600' : 'bg-foreground-muted/15 text-foreground-muted',
        )}>
          {stats?.activeShift ? '● Aktiv smena' : '○ Smena yoxdur'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl p-3">
          <p className="text-xs text-foreground-muted">Bugünkü gəlir</p>
          <p className="text-lg font-bold mt-0.5">{(stats?.todayRevenue ?? 0).toFixed(2)} ₼</p>
        </div>
        <div className="bg-surface rounded-xl p-3">
          <p className="text-xs text-foreground-muted">Bugünkü sifariş</p>
          <p className="text-lg font-bold mt-0.5">{stats?.todayOrders ?? 0}</p>
        </div>
        <div className="bg-surface rounded-xl p-3">
          <p className="text-xs text-foreground-muted">Aktiv sifarişlər</p>
          <p className="text-lg font-bold mt-0.5 text-orange-500">{stats?.pendingOrders ?? 0}</p>
        </div>
        <div className="bg-surface rounded-xl p-3">
          <p className="text-xs text-foreground-muted">Masa doluluğu</p>
          <p className="text-lg font-bold mt-0.5">
            {stats?.activeTables ?? 0}/{stats?.totalTables ?? 0}
          </p>
        </div>
      </div>

      {/* Stok xəbərdarlıqları */}
      {stats?.stockAlerts?.lowStock > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-500/10 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {stats.stockAlerts.lowStock} məhsul az stokdadır
        </div>
      )}
    </motion.div>
  );
}
```

---

## Tapşırıq 5 — Performance: Lazy Loading

**Fayl:** `src/App.tsx`  
**Dəyişiklik:** Ağır admin komponentlərini `React.lazy` ilə yüklə.

```typescript
import { Suspense, lazy } from 'react';

// Admin view-ları lazy import et:
const AdminApp       = lazy(() => import('./components/admin/AdminApp').then(m => ({ default: m.AdminApp })));
const KitchenPanel   = lazy(() => import('./components/kitchen/KitchenPanel').then(m => ({ default: m.KitchenPanel })));
const WaiterPanel    = lazy(() => import('./components/waiter-panel/WaiterPanel').then(m => ({ default: m.WaiterPanel })));

// Hər lazy component-i Suspense ilə əhatə et:
<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size={40} /></div>}>
  <AdminApp />
</Suspense>
```

---

## Tapşırıq 6 — Performance: Virtual List (Uzun Siyahılar)

**Fayl:** `src/components/admin/views/OrdersView.tsx`  
**Dəyişiklik:** Çoxlu sifariş varsa `@tanstack/react-virtual` istifadə et.

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// OrdersView içinə:
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count:         orders.length,
  getScrollElement: () => parentRef.current,
  estimateSize:  () => 100, // hər sıranın təxmini hündürlüyü (px)
  overscan:      5,
});

return (
  <div ref={parentRef} className="overflow-auto max-h-[calc(100vh-200px)]">
    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {virtualizer.getVirtualItems().map((vItem) => {
        const order = orders[vItem.index];
        return (
          <div
            key={order.id}
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     '100%',
              transform: `translateY(${vItem.start}px)`,
            }}
          >
            <OrderRow order={order} />
          </div>
        );
      })}
    </div>
  </div>
);
```

---

## Tapşırıq 7 — Offline Banner

**Fayl:** `src/App.tsx`  
**Dəyişiklik:** İnternet bağlantısı kəsildiyi zaman banner göstər.

```tsx
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online  = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online',  online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-danger-500 text-white text-center text-xs py-2 font-medium flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5" />
      İnternet bağlantısı yoxdur — oflayn rejimdə işləyirsiniz
    </motion.div>
  );
}
```

---

## Tapşırıq 8 — Image Lazy Loading

**Fayl:** `src/components/customer/HomeScreen.tsx` (məhsul şəkilləri)  
**Dəyişiklik:** Şəkilləri `loading="lazy"` + blur placeholder ilə göstər.

```tsx
function LazyProductImage({ src, alt }: { src?: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden bg-surface-elevated aspect-square">
      {/* Skeleton placeholder */}
      {!loaded && <div className="absolute inset-0 skeleton" />}

      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}

      {!src && loaded === false && (
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🍽</div>
      )}
    </div>
  );
}
```

---

## Tapşırıq 9 — Final Polish

### Error Boundary Yenilənməsi

**Fayl:** `src/components/common/ErrorBoundary.tsx`  
**Dəyişiklik:** Gücləndirilmiş xəta ekranı.

```tsx
// Mövcud ErrorBoundary render metodunda:
return (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold mb-2">Xəta baş verdi</h2>
      <p className="text-foreground-muted text-sm mb-6">Tətbiq gözlənilməz bir xətayla qarşılaşdı</p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary px-6 py-3 rounded-2xl font-semibold"
      >
        Yenidən cəhd et
      </button>
    </motion.div>
  </div>
);
```

### Loading Spinner Animasiyası

**Fayl:** `src/components/common/LoadingSpinner.tsx`  
**Dəyişiklik:** Daha cəlbedici spinner.

```tsx
export function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ width: size, height: size }}
      className="rounded-full border-[3px] border-border border-t-primary-500"
    />
  );
}

// Skeleton komponent (shimmer):
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}
```

---

## Tamamlanma Vəziyyəti

### PWA
- [ ] `npm install vite-plugin-pwa workbox-window` işə salındı
- [ ] `vite.config.ts` — VitePWA plugin əlavə edildi
- [ ] `public/icons/` — PWA icon-ları əlavə edildi (192x192, 512x512 minimum)
- [ ] `usePWAInstall.ts` hook yaradıldı
- [ ] `WelcomeScreen.tsx` — "Ana ekrana əlavə et" düyməsi

### Push Notification
- [ ] `cd server && npm install web-push` işə salındı
- [ ] VAPID key-ləri generate edildi + `.env`-ə əlavə edildi
- [ ] `PushSubscription` modeli Prisma schema-ya əlavə edildi + migrate
- [ ] `server/src/lib/webPush.ts` yaradıldı

### Multi-Branch
- [ ] `MultiBranchView.tsx` — real-time kart grid yeniləndi

### Performance
- [ ] `App.tsx` — `React.lazy` + `Suspense` (AdminApp, KitchenPanel, WaiterPanel)
- [ ] `OrdersView.tsx` — `@tanstack/react-virtual` virtualizer
- [ ] `HomeScreen.tsx` — `LazyProductImage` komponenti

### Polish
- [ ] `OfflineBanner` komponenti `App.tsx`-ə əlavə edildi
- [ ] `ErrorBoundary.tsx` — gücləndirilmiş xəta ekranı
- [ ] `LoadingSpinner.tsx` — framer-motion ilə yeniləndi
- [ ] `Skeleton` komponenti genişləndirildi

---

## Bütün Sprint-lərin Xülasəsi

| Sprint | Fayl sayı | Əsas çıxış |
|--------|-----------|------------|
| Sprint 1 | ~11 fayl | Animasiyalar, design system |
| Sprint 2 | ~10 fayl | Payriff + M10 ödəniş |
| Sprint 3 | ~5 fayl  | Müştəri + mətbəx çeki |
| Sprint 4 | ~8 fayl  | Xammal, resept, inventar sayımı |
| Sprint 5 | ~6 fayl  | Excel export, müqayisəli hesabat |
| Sprint 6 | ~9 fayl  | Rezervasiya UI, loyalty, KDS, feedback |
| Sprint 7 | ~10 fayl | PWA, push notification, performance |

---

## Son Qeydlər

- Bütün sprint faylları `SPRINT_N_NAME.md` formatında saxlanıb
- Hər fayl öz dependency-lərini, mövcud vəziyyəti, tam kod snippetlərini ehtiva edir
- Checklist-lər (`- [ ]`) hər sprint-in başında işarələnib tamamlanma izlənilə bilər
- Yeni session-da: sprint faylını oxu → checklist-i yoxla → işdən davam et
