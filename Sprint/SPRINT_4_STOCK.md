# Sprint 4 — Stok İdarəetməsi (Advanced)

**Məqsəd:** Xammal (RawMaterial) sistemi, Resept (Recipe) modeli, avtomatik stok azalması və stok analitikası əlavə etmək.  
**Ön şərt:** Sprint 1 tamamlanmış olmalıdır.

---

## Cari Vəziyyət

**Mövcud olan:**
- `Product.stockEnabled`, `stockQuantity`, `lowStockThreshold` — məhsul səviyyəsində stok
- `StockMovement` modeli — manual hərəkətlər (purchase/sale/waste/adjustment/return)
- `server/src/routes/inventory.ts` — products + movements API
- `src/components/admin/views/InventoryView.tsx` — mövcud UI

**Mövcud olmayan:**
- `RawMaterial` (xammal) modeli — un, yağ, ət kimi ayrı material bazası
- `Recipe` / `Ingredient` modeli — məhsulun xammal tarkibi
- Sifariş konfirmasiyasında avtomatik stok azalması
- Stok trend qrafiyi
- Inventar sayım sessiyası

---

## Paket Qurulması

```bash
# Yeni paket lazım deyil
```

---

## Tapşırıq 1 — Prisma Schema: Xammal Modelləri

**Fayl:** `server/prisma/schema.prisma`  
**Dəyişiklik:** Mövcud modellərə yeni modelləri əlavə et.

```prisma
// ── Xammal ──────────────────────────────────────────────────────────────────
model RawMaterial {
  id             String         @id @default(cuid())
  branchId       String
  name           String
  nameAz         String
  nameEn         String         @default("")
  unit           String         // kg, litr, ədəd, qr, ml
  currentStock   Float          @default(0)
  minStock       Float          @default(0)   // Minimum xəbərdarlıq həddi
  costPerUnit    Float?
  category       String?        // Ət, Süd məhsulları, Tərəvəz, Quru ərzaq...
  status         String         @default("active")
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  branch         Branch         @relation(fields: [branchId], references: [id])
  ingredients    Ingredient[]
  rawMovements   RawMovement[]

  @@index([branchId])
  @@index([branchId, status])
}

// ── Resept ──────────────────────────────────────────────────────────────────
model Recipe {
  id          String       @id @default(cuid())
  productId   String       @unique
  yield       Float        @default(1)   // Neçə porsiya çıxır
  note        String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  product     Product      @relation(fields: [productId], references: [id])
  ingredients Ingredient[]
}

// ── Resept Tərkibi ───────────────────────────────────────────────────────────
model Ingredient {
  id              String      @id @default(cuid())
  recipeId        String
  rawMaterialId   String
  quantity        Float       // 1 porsiya üçün lazım olan miqdar
  unit            String      // Ölçü vahidi (reseptdəki)
  recipe          Recipe      @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  rawMaterial     RawMaterial @relation(fields: [rawMaterialId], references: [id])

  @@index([recipeId])
  @@index([rawMaterialId])
}

// ── Xammal Hərəkəti ──────────────────────────────────────────────────────────
model RawMovement {
  id              String      @id @default(cuid())
  rawMaterialId   String
  branchId        String
  type            String      // purchase | consumption | waste | adjustment | stocktake
  quantity        Float       // + giriş, - çıxış
  unitCost        Float?
  note            String?
  orderId         String?     // Sifarişdən avtomatik düşmə zamanı
  createdById     String?
  createdAt       DateTime    @default(now())
  rawMaterial     RawMaterial @relation(fields: [rawMaterialId], references: [id])

  @@index([rawMaterialId, createdAt])
  @@index([branchId, createdAt])
  @@index([type])
}

// ── İnventar Sayım Sessiyası ─────────────────────────────────────────────────
model Stocktake {
  id          String         @id @default(cuid())
  branchId    String
  status      String         @default("open")  // open | completed
  note        String?
  openedById  String?
  closedById  String?
  openedAt    DateTime       @default(now())
  closedAt    DateTime?
  items       StocktakeItem[]
  branch      Branch         @relation(fields: [branchId], references: [id])

  @@index([branchId, status])
}

model StocktakeItem {
  id            String    @id @default(cuid())
  stocktakeId   String
  rawMaterialId String
  expected      Float     // Sistem hesabı
  actual        Float?    // Fiziki sayım
  difference    Float?    // actual - expected
  stocktake     Stocktake @relation(fields: [stocktakeId], references: [id])

  @@index([stocktakeId])
}
```

**`Branch` modelinə əlavə et:**
```prisma
rawMaterials  RawMaterial[]
stocktakes    Stocktake[]
```

**`Product` modelinə əlavə et:**
```prisma
recipe   Recipe?
```

**Migration:**
```bash
cd server && npm run db:migrate
# Migration adı: add_raw_material_recipe_system
```

---

## Tapşırıq 2 — Xammal API

**Yeni fayl:** `server/src/routes/rawMaterials.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { notify } from '../lib/notify';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Siyahı
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, filter, category } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId, status: 'active' };
    if (category) where.category = category;

    const materials = await prisma.rawMaterial.findMany({
      where,
      include: { _count: { select: { ingredients: true } } },
      orderBy: [{ category: 'asc' }, { nameAz: 'asc' }],
    });

    const withStatus = materials.map(m => ({
      ...m,
      stockStatus: m.currentStock <= 0 ? 'out' : m.currentStock <= m.minStock ? 'low' : 'ok',
    }));

    const result = filter === 'low'
      ? withStatus.filter(m => m.stockStatus === 'low' || m.stockStatus === 'out')
      : withStatus;

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Yarat
router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const material = await prisma.rawMaterial.create({ data: req.body });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
});

// Yenilə
router.patch('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const material = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
});

// Sil
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.rawMaterial.update({ where: { id: req.params.id }, data: { status: 'inactive' } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Stok əlavə et / çıx
router.post('/:id/movement', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { type, quantity, unitCost, note, createdById } = req.body;
    const material = await prisma.rawMaterial.findUnique({ where: { id: req.params.id } });
    if (!material) return res.status(404).json({ success: false, message: 'Tapılmadı' });

    const delta = type === 'purchase' || type === 'adjustment' ? Math.abs(quantity) : -Math.abs(quantity);
    const newStock = material.currentStock + delta;

    await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id: req.params.id },
        data:  { currentStock: newStock, ...(unitCost ? { costPerUnit: unitCost } : {}) },
      }),
      prisma.rawMovement.create({
        data: { rawMaterialId: req.params.id, branchId: material.branchId, type, quantity: delta, unitCost, note, createdById },
      }),
    ]);

    // Low stock xəbərdarlığı
    if (newStock <= material.minStock && newStock > 0) {
      await notify({
        io:       (req as any).io,
        branchId: material.branchId,
        type:     'low_stock',
        title:    'Stok azalır',
        message:  `${material.nameAz} — ${newStock.toFixed(2)} ${material.unit} qaldı`,
        data:     { rawMaterialId: material.id },
      }).catch(() => {});
    }

    res.json({ success: true, data: { newStock } });
  } catch (err) { next(err); }
});

// Hərəkət tarixi
router.get('/:id/movements', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { page = '1', limit = '30' } = req.query;
    const movements = await prisma.rawMovement.findMany({
      where: { rawMaterialId: req.params.id },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    res.json({ success: true, data: movements });
  } catch (err) { next(err); }
});

export { router as rawMaterialRoutes };
```

---

## Tapşırıq 3 — Resept API

**Yeni fayl:** `server/src/routes/recipes.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Məhsulun reseptini al
router.get('/product/:productId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where:   { productId: req.params.productId },
      include: { ingredients: { include: { rawMaterial: true } } },
    });
    res.json({ success: true, data: recipe });
  } catch (err) { next(err); }
});

// Resept yarat / yenilə (upsert)
router.put('/product/:productId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { yield: yieldAmount, note, ingredients } = req.body;

    const recipe = await prisma.recipe.upsert({
      where:  { productId: req.params.productId },
      update: { yield: yieldAmount, note },
      create: { productId: req.params.productId, yield: yieldAmount, note },
    });

    // Mövcud ingredient-ləri sil, yenilərini əlavə et
    await prisma.ingredient.deleteMany({ where: { recipeId: recipe.id } });

    if (ingredients?.length) {
      await prisma.ingredient.createMany({
        data: ingredients.map((ing: any) => ({
          recipeId:       recipe.id,
          rawMaterialId:  ing.rawMaterialId,
          quantity:       ing.quantity,
          unit:           ing.unit,
        })),
      });
    }

    const updated = await prisma.recipe.findUnique({
      where:   { id: recipe.id },
      include: { ingredients: { include: { rawMaterial: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export { router as recipeRoutes };
```

---

## Tapşırıq 4 — Avtomatik Stok Azalması

**Fayl:** `server/src/routes/orders.ts`  
**Dəyişiklik:** Sifariş `confirmed` statusuna keçəndə stokları avtomatik azalt.

```typescript
// orders.ts-in içindəki PATCH /:id/status handler-ına əlavə et:

// Sifariş confirmed olduqda stokları azalt
async function deductStockForOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: { items: { include: { product: { include: { recipe: { include: { ingredients: true } } } } } } },
    });
    if (!order) return;

    for (const item of order.items) {
      const recipe = item.product.recipe;

      // 1. Məhsulun öz stoku (stockEnabled varsa):
      if (item.product.stockEnabled && item.product.stockQuantity !== null) {
        await prisma.product.update({
          where: { id: item.productId },
          data:  { stockQuantity: { decrement: item.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            branchId:  order.branchId,
            type:      'sale',
            quantity:  -item.quantity,
            note:      `Sifariş #${order.orderNumber}`,
          },
        });
      }

      // 2. Resept varsa xammalları azalt:
      if (recipe) {
        for (const ing of recipe.ingredients) {
          const consumeQty = ing.quantity * item.quantity / recipe.yield;
          const material = await prisma.rawMaterial.update({
            where: { id: ing.rawMaterialId },
            data:  { currentStock: { decrement: consumeQty } },
          });
          await prisma.rawMovement.create({
            data: {
              rawMaterialId: ing.rawMaterialId,
              branchId:      order.branchId,
              type:          'consumption',
              quantity:      -consumeQty,
              orderId:       orderId,
              note:          `Sifariş #${order.orderNumber}`,
            },
          });

          // Low stock xəbərdarlığı
          if (material.currentStock <= material.minStock) {
            await notify({
              io:       (req as any).io,   // req əlçatandırsa
              branchId: order.branchId,
              type:     'low_stock',
              title:    'Stok azalır',
              message:  `${material.nameAz}: ${material.currentStock.toFixed(2)} ${material.unit}`,
              data:     { rawMaterialId: material.id },
            }).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.error('[Stock deduction error]', err);
  }
}

// Status dəyişimi handler-ında (confirmed zamanı):
if (newStatus === 'confirmed') {
  deductStockForOrder(req.params.id).catch(() => {});
}
```

---

## Tapşırıq 5 — İnventar Sayım API

**Fayl:** `server/src/routes/inventory.ts`  
**Dəyişiklik:** Mövcud inventory.ts faylına sayım endpoint-ləri əlavə et.

```typescript
// Mövcud inventory.ts-in sonuna əlavə et:

// ── Sayım Sessiyası ──────────────────────────────────────────────────────────

// Yeni sayım başlat
router.post('/stocktake', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, openedById } = req.body;

    // Mövcud açıq sayım varsa qapat
    await prisma.stocktake.updateMany({
      where: { branchId, status: 'open' },
      data:  { status: 'cancelled' },
    });

    const materials = await prisma.rawMaterial.findMany({
      where: { branchId, status: 'active' },
    });

    const stocktake = await prisma.stocktake.create({
      data: {
        branchId, openedById,
        items: {
          create: materials.map(m => ({
            rawMaterialId: m.id,
            expected:      m.currentStock,
          })),
        },
      },
      include: { items: { include: { stocktake: false } } },
    });

    res.json({ success: true, data: stocktake });
  } catch (err) { next(err); }
});

// Sayım item yenilə (actual miqdar daxil et)
router.patch('/stocktake/:id/items/:itemId', authenticate, async (req, res, next) => {
  try {
    const { actual } = req.body;
    const item = await prisma.stocktakeItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ success: false, message: 'Item tapılmadı' });

    const updated = await prisma.stocktakeItem.update({
      where: { id: req.params.itemId },
      data:  { actual, difference: actual - item.expected },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// Sayımı tamamla (stokları düzəlt)
router.post('/stocktake/:id/complete', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { closedById } = req.body;
    const stocktake = await prisma.stocktake.findUnique({
      where:   { id: req.params.id },
      include: { items: { include: { stocktake: false } } },
    });
    if (!stocktake) return res.status(404).json({ success: false, message: 'Sayım tapılmadı' });

    const adjustments = stocktake.items.filter(i => i.actual !== null && i.actual !== i.expected);

    await prisma.$transaction([
      // Fərqləri düzəlt
      ...adjustments.map(item =>
        prisma.rawMaterial.update({
          where: { id: item.rawMaterialId },
          data:  { currentStock: item.actual! },
        })
      ),
      // Hərəkətləri qeyd et
      ...adjustments.map(item =>
        prisma.rawMovement.create({
          data: {
            rawMaterialId: item.rawMaterialId,
            branchId:      stocktake.branchId,
            type:          'stocktake',
            quantity:      item.difference!,
            note:          `Sayım düzəlişi #${stocktake.id.slice(-6)}`,
          },
        })
      ),
      // Sayımı qapat
      prisma.stocktake.update({
        where: { id: req.params.id },
        data:  { status: 'completed', closedById, closedAt: new Date() },
      }),
    ]);

    res.json({ success: true, message: `${adjustments.length} material düzəldildi` });
  } catch (err) { next(err); }
});
```

---

## Tapşırıq 6 — Route-ları `index.ts`-ə qoş

**Fayl:** `server/src/index.ts`

```typescript
import { rawMaterialRoutes } from './routes/rawMaterials';
import { recipeRoutes } from './routes/recipes';

app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/recipes', recipeRoutes);
```

---

## Tapşırıq 7 — Frontend: `InventoryView.tsx` Genişlənməsi

**Fayl:** `src/components/admin/views/InventoryView.tsx`  
**Dəyişiklik:** Mövcud məhsul stok görünüşünə yanında "Xammal" tab-ı əlavə et.

```tsx
// Tabs:
type InvTab = 'products' | 'raw-materials' | 'recipes' | 'stocktake';

const tabs: { id: InvTab; label: string }[] = [
  { id: 'products',      label: 'Məhsul Stoku' },
  { id: 'raw-materials', label: 'Xammal' },
  { id: 'recipes',       label: 'Reseptlər' },
  { id: 'stocktake',     label: 'İnventar Sayımı' },
];

// Xammal tab məzmunu:
// - Siyahı: nameAz | unit | currentStock | minStock | stockStatus badge | Hərəkət düyməsi
// - Filter: Hamısı | Az qalıb | Bitmişdir | Kateqoriyaya görə
// - Modal: Xammal yarat/düzəlt
// - Hərəkət modal: Giriş (purchase) / Çıxış (waste) / Düzəliş (adjustment)

// Resept tab məzmunu:
// - Məhsul siyahısı (resepti olanlar ✓, olmayanlar düzəliş ikonası)
// - Resept modalı: ingredient-lər cədvəli (rawMaterial + quantity + unit)
```

---

## Tapşırıq 8 — Stok Trend Qrafiyi

**Fayl:** `src/components/admin/views/InventoryView.tsx`  
**Yeni bölmə:** Stok hərəkəti qrafiyi.

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

// Seçilmiş material üçün son 30 günlük trend:
const { data: movements } = useQuery({
  queryKey: ['raw-movements', selectedMaterialId],
  queryFn: () => api.get(`/raw-materials/${selectedMaterialId}/movements?limit=100`).then(r => r.data.data),
  enabled: !!selectedMaterialId,
});

// Qrafikdə: Tarix × Cari stok (running balance)
<ResponsiveContainer width="100%" height={180}>
  <AreaChart data={stockTrend}>
    <defs>
      <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
      </linearGradient>
    </defs>
    <Area type="monotone" dataKey="stock" stroke="#f97316" fill="url(#stockGrad)" strokeWidth={2} />
    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
    <YAxis tick={{ fontSize: 11 }} />
    <Tooltip />
  </AreaChart>
</ResponsiveContainer>
```

---

## Tamamlanma Vəziyyəti

- [x] `RawMaterial`, `Recipe`, `Ingredient`, `RawMovement`, `Stocktake`, `StocktakeItem` modelləri schema-ya əlavə edildi
- [x] `Branch` + `Product` modellərinə relations əlavə edildi
- [ ] `npm run db:migrate` işə salındı  ← server dayandırılıb `prisma generate` + `db:migrate` işlədilməlidir
- [x] `server/src/routes/rawMaterials.ts` yaradıldı
- [x] `server/src/routes/recipes.ts` yaradıldı
- [x] `server/src/routes/orders.ts` — `deductStockForOrder` əlavə edildi
- [x] `server/src/routes/inventory.ts` — stocktake endpoint-ləri əlavə edildi
- [x] `server/src/index.ts` — yeni route-lar qoşuldu
- [x] `InventoryView.tsx` — 4 tab (products/raw-materials/recipes/stocktake)
- [x] Stok trend qrafiyi

---

## Növbəti Sprint

Sprint 4 tamamlandıqdan sonra **SPRINT_5_ANALYTICS.md** faylına keç.
