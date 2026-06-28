# customer-app

Müştəri tərəfli mobil tətbiq. Ana FoodZonee layihəsindən **ayrıca** Vite/React proyektidir.  
Hazırda **mock data** istifadə edir — backend API bağlantısı yoxdur.

---

## Texnologiyalar

|           |                                      |
| --------- | ------------------------------------ |
| Framework | React + TypeScript                   |
| Build     | Vite                                 |
| State     | Zustand (`src/store/index.ts`)       |
| Animasiya | Framer Motion                        |
| UI        | Tailwind CSS + Lucide React ikonları |
| i18n      | Öz sadə hook-u (`useT`)              |

---

## Qovluq Strukturu

```
customer-app/
  src/
    App.tsx                  ← ScreenRouter + overlay komponentlər
    main.tsx

    screens/                 ← hər ekran bir fayl
      SplashScreen.tsx
      HomeScreen.tsx         ← əsas ekran
      SearchScreen.tsx
      ProductDetail.tsx      ← overlay modal
      CartDrawer.tsx         ← yan drawer
      CheckoutScreen.tsx
      OrderSuccessScreen.tsx
      OrderTracking.tsx
      OrderHistory.tsx
      OrderDetailScreen.tsx
      ProfileScreen.tsx
      EditProfileScreen.tsx
      FavoritesScreen.tsx
      AddressesScreen.tsx
      PaymentsScreen.tsx
      CouponsScreen.tsx
      SettingsScreen.tsx
      HelpScreen.tsx
      ReviewsScreen.tsx
      GalleryScreen.tsx
      InfoScreen.tsx
      WaiterRequestsScreen.tsx
      SupportRequestsScreen.tsx
      LoginScreen.tsx

    components/
      BottomNav.tsx          ← alt tab bar (home/search/orders/profile)
      BottomModals.tsx       ← wifi, dil, rəy, dark mode modalları
      FloatingCart.tsx       ← üzən səbət düyməsi
      WaiterCallFAB.tsx      ← ofisiant çağırma düyməsi
      Toast.tsx              ← bildiriş popup-u
      MapPickerModal.tsx     ← ünvan xəritə seçimi
      PhoneInput.tsx         ← telefon nömrəsi input-u

    store/
      index.ts               ← bütün store-lar bir faylda

    data/
      menuData.ts            ← mock məhsul və kateqoriya datası
      restaurantData.ts      ← mock restoran siyahısı
      restaurantInfo.ts      ← hazırkı restoran məlumatları

    types/
      index.ts               ← bütün TypeScript tipləri

    i18n/
      translations.ts        ← 4 dil (az/en/ru/tr) bir faylda

    hooks/
      useT.ts                ← tərcümə hook-u
      use-mobile.ts          ← mobil ekran yoxlaması

    utils/
      index.ts               ← ümumi yardımçı funksiyalar
      loyalty.ts             ← loyallıq xalı hesablamaları

    lib/
      utils.ts               ← cn() class birləşdirici
```

---

## Ekran Axışı

```
SplashScreen (2.8s)
  └─► HomeScreen             ← default ekran
        ├─► ProductDetail    ← overlay modal (URL dəyişmir)
        ├─► CartDrawer       ← sağdan açılan drawer
        ├─► SearchScreen
        ├─► CheckoutScreen
        │     └─► OrderSuccessScreen
        │           └─► OrderTracking
        ├─► OrderHistory → OrderDetailScreen
        └─► ProfileScreen → EditProfileScreen
                          → FavoritesScreen
                          → AddressesScreen
                          → PaymentsScreen
                          → CouponsScreen
                          → SettingsScreen
                          → HelpScreen / ReviewsScreen / GalleryScreen / InfoScreen
                          → WaiterRequestsScreen
                          → SupportRequestsScreen
```

Ekranlar arası keçid: `useUIStore().setScreen('screenName')` — **URL dəyişmir**.

---

## Navigasiya Məntiqi (`App.tsx`)

`ScreenRouter` komponenti `useUIStore.currentScreen` dəyərinə görə ekranı render edir:

```tsx
switch (currentScreen) {
  case "home":
    return <HomeScreen />;
  case "checkout":
    return <CheckoutScreen />;
  // ...
}
```

`ProductDetail`, `CartDrawer`, `BottomModals`, `WaiterCallFAB`, `FloatingCart`, `Toast`, `BottomNav`
bütün ekranların üstündə **həmişə** render olunur (overlay layer).

---

## Store-lar (`src/store/index.ts`)

### `useUIStore`

| State              | Tip               | Məqsəd                                 |
| ------------------ | ----------------- | -------------------------------------- |
| `currentScreen`    | `Screen`          | Aktiv ekran                            |
| `previousScreen`   | `Screen \| null`  | Geri üçün                              |
| `activeTab`        | `NavTab`          | Alt nav aktiv tab                      |
| `selectedProduct`  | `Product \| null` | ProductDetail-ə ötürülən məhsul        |
| `productModalOpen` | `boolean`         | ProductDetail açıq/qapalı              |
| `cartDrawerOpen`   | `boolean`         | CartDrawer açıq/qapalı                 |
| `language`         | `az/en/ru/tr`     | Aktiv dil                              |
| `isDark`           | `boolean`         | Dark mode                              |
| `isQRSession`      | `boolean`         | QR ilə giriş (default: `true`)         |
| `tableNumber`      | `number`          | Masa nömrəsi (default: `12`, mock)     |
| `isLoggedIn`       | `boolean`         | Müştəri daxil olub                     |
| `activeModal`      | `ModalType`       | Açıq modal (wifi/language/feedback...) |

### `useCartStore`

| Metod                     | Məqsəd                               |
| ------------------------- | ------------------------------------ |
| `addItem(item)`           | Eyni məhsul+ölçü varsa miqdarı artır |
| `removeItem(productId)`   | Məhsulu sil                          |
| `updateQuantity(id, qty)` | qty ≤ 0 olsa sil                     |
| `getSubtotal()`           | Ara cəm                              |
| `getServiceFee()`         | Xidmət haqqı (subtotal × 10%)        |
| `getTotal()`              | Ümumi cəm                            |
| `getItemCount()`          | Səbətdəki ümumi miqdar               |

### `useOrderStore`

Sifarişlər tarixi + cari sifariş saxlanılır.

### `useWaiterRequestStore`

Ofisiant çağırma sorğuları (masa nömrəsi ilə).

### `useSupportRequestStore`

Dəstək sorğuları (mövzu + mesaj).

---

## Mock Data (`src/data/`)

**`menuData.ts`** — statik, backend-dən gəlmir:

- `popularProducts` — 6 məhsul
- `newArrivals` — 4 məhsul
- `setMenus` — 4 set menyu
- `allProducts` — hamısı birlikdə
- `categories` — 7 kateqoriya (all/sushi/ramen/sashimi/rolls/desserts/drinks)
- `sizeOptions` — 3 ölçü (4pc/8pc/12pc)
- `extraOptions` — 3 əlavə (wasabi/ginger/soy)
- `TABLE_NUMBER = 12` — hard-coded

---

## i18n

`src/i18n/translations.ts` — 4 dil bir faylda.  
`src/hooks/useT.ts` — `const t = useT(); t('key')` istifadəsi.  
Aktiv dil: `useUIStore().language`, `localStorage` açarı: `fz_lang`.

---

## Hazırda Olmayan / Ediləcəklər

|                    |                                         |
| ------------------ | --------------------------------------- |
| Backend bağlantısı | Mock data real API ilə əvəzlənəcək      |
| QR skan            | `tableNumber` URL params-dan oxunacaq   |
| `branchId`         | Session-a əlavə ediləcək                |
| Sifariş göndərmə   | `POST /api/orders` çağırılacaq          |
| Ofisiant sorğusu   | `POST /api/waiter-requests` çağırılacaq |

---

## Başlatma

```bash
cd customer-app
npm install
npm run dev
```
