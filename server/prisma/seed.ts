import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Cleanup (leaf → root) ──────────────────────────────────────────────────
  await prisma.stocktakeItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.rawMovement.deleteMany();
  await prisma.staffPerformance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.customerFeedback.deleteMany();
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dailySpecial.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.waiterRequest.deleteMany();
  await prisma.tableReservation.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.stocktake.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.staffShift.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.cashDrawer.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.productExtra.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.settings.deleteMany();

  console.log("✅ Cleared existing data");

  // ========== RESTAURANT ==========
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "FoodZone",
      slug: "foodzone",
      logo: "/uploads/logo.png",
      description: "Premium dining experience with QR ordering",
      status: "active",
    },
  });
  console.log("🏢 Restaurant created:", restaurant.name);

  // ========== BRANCHES ==========
  const branch1 = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: "Sahil",
      address: "Sahil m. Neftchilar ave. 126",
      phone: "+994 12 555 55 55",
      wifiName: "FoodZone-Sahil",
      wifiPassword: "welcome2024",
      status: "active",
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: "Nizami",
      address: "Nizami m. Jafar Jabbarli str. 44",
      phone: "+994 12 444 44 44",
      wifiName: "FoodZone-Nizami",
      wifiPassword: "nizami2024",
      status: "active",
    },
  });
  console.log("🏪 Branches created: Sahil, Nizami");

  // ========== TABLES ==========
  const tablesSahil = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      prisma.table.create({
        data: {
          branchId: branch1.id,
          number: String(i + 1),
          qrCode: `FZ-SA-${String(i + 1).padStart(3, "0")}`,
          status: i < 8 ? "active" : "inactive",
          capacity: [2, 4, 6, 8][i % 4],
        },
      }),
    ),
  );

  const tablesNizami = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.table.create({
        data: {
          branchId: branch2.id,
          number: String(i + 1),
          qrCode: `FZ-NZ-${String(i + 1).padStart(3, "0")}`,
          status: "active",
          capacity: [2, 4, 6][i % 3],
        },
      }),
    ),
  );
  console.log("🪑 Tables created: 20 tables");

  // ========== USERS ==========
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@foodzone.az",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
      status: "active",
    },
  });
  const manager = await prisma.user.create({
    data: {
      email: "manager@foodzone.az",
      password: hashedPassword,
      name: "Manager Ali",
      role: "manager",
      status: "active",
    },
  });
  const chef1 = await prisma.user.create({
    data: {
      email: "chef1@foodzone.az",
      password: hashedPassword,
      name: "Chef Ramil",
      role: "kitchen",
      status: "active",
    },
  });
  const chef2 = await prisma.user.create({
    data: {
      email: "chef2@foodzone.az",
      password: hashedPassword,
      name: "Chef Nigar",
      role: "kitchen",
      status: "active",
    },
  });
  const waiter1 = await prisma.user.create({
    data: {
      email: "waiter1@foodzone.az",
      password: hashedPassword,
      name: "Waiter Orkhan",
      role: "waiter",
      status: "active",
    },
  });
  const waiter2 = await prisma.user.create({
    data: {
      email: "waiter2@foodzone.az",
      password: hashedPassword,
      name: "Waiter Lala",
      role: "waiter",
      status: "active",
    },
  });
  const staff = await prisma.user.create({
    data: {
      email: "staff@foodzone.az",
      password: hashedPassword,
      name: "Staff Member",
      role: "staff",
      status: "active",
    },
  });
  console.log("👤 Users created: admin, manager, 2 chefs, 2 waiters, 1 staff");

  // ========== CATEGORIES ==========
  const categoriesData = [
    { name: "Starters",    nameAz: "Qəlyanaltılar", nameEn: "Starters",    nameRu: "Закуски",          nameTr: "Başlangıçlar", icon: "utensils",  sortOrder: 1 },
    { name: "Salads",      nameAz: "Salatlar",       nameEn: "Salads",      nameRu: "Салаты",           nameTr: "Salatalar",    icon: "leaf",      sortOrder: 2 },
    { name: "Main Course", nameAz: "Əsas Yeməklər",  nameEn: "Main Course", nameRu: "Основные блюда",   nameTr: "Ana Yemekler", icon: "chef-hat",  sortOrder: 3 },
    { name: "Burgers",     nameAz: "Burgerlər",       nameEn: "Burgers",     nameRu: "Бургеры",          nameTr: "Burgerler",    icon: "sandwich",  sortOrder: 4 },
    { name: "Pizza",       nameAz: "Pizzalar",        nameEn: "Pizza",       nameRu: "Пицца",            nameTr: "Pizza",        icon: "pizza",     sortOrder: 5 },
    { name: "Desserts",    nameAz: "Şirniyyatlar",    nameEn: "Desserts",    nameRu: "Десерты",          nameTr: "Tatlılar",     icon: "cake",      sortOrder: 6 },
    { name: "Drinks",      nameAz: "İçkilər",         nameEn: "Drinks",      nameRu: "Напитки",          nameTr: "İçecekler",    icon: "coffee",    sortOrder: 7 },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.create({
        data: { ...cat, branchId: branch1.id, status: "active" },
      }),
    ),
  );
  console.log("📂 Categories created: 7 categories");

  // ========== PRODUCTS ==========
  const productsData = [
    // Starters [0..2]
    { categoryId: categories[0].id, name: "Bruschetta",         nameAz: "Bruschetta",          nameEn: "Bruschetta",         nameRu: "Брускетта",            nameTr: "Bruschetta",          description: "Grilled bread with tomato, basil and garlic", descriptionAz: "Qızardılmış çörək pomidor, reyhan və sarımsaq ilə", descriptionEn: "Grilled bread with tomato, basil and garlic", descriptionRu: "Жареный хлеб с помидорами, базиликом и чесноком", descriptionTr: "Izgara ekmek domates, fesleğen ve sarımsak ile", price: 8.5,  image: "/uploads/bruschetta.jpg",     sortOrder: 1, isPopular: true,  hasExtras: false, hasSizes: false },
    { categoryId: categories[0].id, name: "Chicken Wings",      nameAz: "Toyuq Qanadları",     nameEn: "Chicken Wings",      nameRu: "Куриные крылышки",     nameTr: "Tavuk Kanatları",     description: "Crispy wings with BBQ sauce",                  descriptionAz: "BBQ souslu xırtıldayan qanadlar",                  price: 12.0, image: "/uploads/wings.jpg",          sortOrder: 2, isPopular: true,  hasExtras: true,  hasSizes: false },
    { categoryId: categories[0].id, name: "Mozzarella Sticks",  nameAz: "Mozzarella Çubuqları",nameEn: "Mozzarella Sticks",  nameRu: "Сырные палочки",       nameTr: "Mozzarella Çubukları",description: "Breaded mozzarella with marinara",              price: 9.0,  image: "/uploads/mozzarella.jpg",     sortOrder: 3, isPopular: false, hasExtras: false, hasSizes: false },
    // Salads [3..4]
    { categoryId: categories[1].id, name: "Caesar Salad",       nameAz: "Sezar Salatı",        nameEn: "Caesar Salad",       nameRu: "Салат Цезарь",         nameTr: "Sezar Salatası",      description: "Romaine lettuce, parmesan, croutons, caesar dressing", price: 14.0, image: "/uploads/caesar.jpg",  sortOrder: 1, isPopular: true,  hasExtras: true,  hasSizes: false },
    { categoryId: categories[1].id, name: "Greek Salad",        nameAz: "Yunan Salatı",        nameEn: "Greek Salad",        nameRu: "Греческий салат",      nameTr: "Yunan Salatası",      description: "Tomato, cucumber, olives, feta cheese",        price: 13.0, image: "/uploads/greek.jpg",          sortOrder: 2, isPopular: false, hasExtras: false, hasSizes: false },
    // Main Course [5..7]
    { categoryId: categories[2].id, name: "Grilled Salmon",     nameAz: "Qızardılmış Somon",   nameEn: "Grilled Salmon",     nameRu: "Жареный лосось",       nameTr: "Izgara Somon",        description: "Atlantic salmon with lemon butter sauce",      price: 28.0, image: "/uploads/salmon.jpg",         sortOrder: 1, isPopular: true,  hasExtras: true,  hasSizes: false },
    { categoryId: categories[2].id, name: "Beef Steak",         nameAz: "Mal Əti Stake",       nameEn: "Beef Steak",         nameRu: "Говяжий стейк",        nameTr: "Dana Biftek",         description: "Premium ribeye with herb butter",              price: 35.0, image: "/uploads/steak.jpg",          sortOrder: 2, isPopular: true,  hasExtras: true,  hasSizes: true  },
    { categoryId: categories[2].id, name: "Chicken Alfredo",    nameAz: "Toyuq Alfredo",       nameEn: "Chicken Alfredo",    nameRu: "Курица Альфредо",      nameTr: "Tavuk Alfredo",       description: "Creamy pasta with grilled chicken",            price: 18.0, image: "/uploads/alfredo.jpg",        sortOrder: 3, isPopular: false, hasExtras: false, hasSizes: false },
    // Burgers [8..10]
    { categoryId: categories[3].id, name: "Classic Burger",     nameAz: "Klassik Burger",      nameEn: "Classic Burger",     nameRu: "Классический бургер",  nameTr: "Klasik Burger",       description: "Beef patty, lettuce, tomato, cheese, special sauce", price: 16.0, image: "/uploads/classic-burger.jpg", sortOrder: 1, isPopular: true,  hasExtras: true,  hasSizes: true  },
    { categoryId: categories[3].id, name: "Double Cheeseburger",nameAz: "İkili Çizburger",     nameEn: "Double Cheeseburger",nameRu: "Двойной чизбургер",    nameTr: "Çift Peynirli Burger",description: "Two beef patties, double cheese, bacon",       price: 22.0, image: "/uploads/double-burger.jpg",  sortOrder: 2, isPopular: true,  hasExtras: true,  hasSizes: false },
    { categoryId: categories[3].id, name: "Chicken Burger",     nameAz: "Toyuq Burgeri",       nameEn: "Chicken Burger",     nameRu: "Куриный бургер",       nameTr: "Tavuk Burger",        description: "Crispy chicken fillet with coleslaw",          price: 15.0, image: "/uploads/chicken-burger.jpg", sortOrder: 3, isPopular: false, hasExtras: true,  hasSizes: false },
    // Pizza [11..13]
    { categoryId: categories[4].id, name: "Margherita",         nameAz: "Marqarita",           nameEn: "Margherita",         nameRu: "Маргарита",            nameTr: "Margarita",           description: "Tomato sauce, mozzarella, fresh basil",        price: 18.0, image: "/uploads/margherita.jpg",     sortOrder: 1, isPopular: true,  hasExtras: true,  hasSizes: true  },
    { categoryId: categories[4].id, name: "Pepperoni",          nameAz: "Pepperoni",           nameEn: "Pepperoni",          nameRu: "Пепперони",            nameTr: "Pepperoni",           description: "Tomato sauce, mozzarella, pepperoni",          price: 22.0, image: "/uploads/pepperoni.jpg",      sortOrder: 2, isPopular: true,  hasExtras: true,  hasSizes: true  },
    { categoryId: categories[4].id, name: "Four Cheese",        nameAz: "Dörd Pendir",         nameEn: "Four Cheese",        nameRu: "Четыре сыра",          nameTr: "Dört Peynirli",       description: "Mozzarella, cheddar, parmesan, gorgonzola",    price: 24.0, image: "/uploads/4cheese.jpg",        sortOrder: 3, isPopular: false, hasExtras: true,  hasSizes: true  },
    // Desserts [14..15]
    { categoryId: categories[5].id, name: "Tiramisu",           nameAz: "Tiramisu",            nameEn: "Tiramisu",           nameRu: "Тирамису",             nameTr: "Tiramisu",            description: "Classic Italian coffee dessert",               price: 10.0, image: "/uploads/tiramisu.jpg",       sortOrder: 1, isPopular: true,  hasExtras: false, hasSizes: false },
    { categoryId: categories[5].id, name: "Cheesecake",         nameAz: "Pendirli Tort",       nameEn: "Cheesecake",         nameRu: "Чизкейк",              nameTr: "Cheesecake",          description: "New York style with strawberry sauce",         price: 11.0, image: "/uploads/cheesecake.jpg",     sortOrder: 2, isPopular: true,  hasExtras: false, hasSizes: false },
    // Drinks [16..18]
    { categoryId: categories[6].id, name: "Fresh Lemonade",     nameAz: "Təzə Limonad",        nameEn: "Fresh Lemonade",     nameRu: "Свежий лимонад",       nameTr: "Taze Limonata",       description: "Homemade lemonade with mint",                  price: 5.0,  image: "/uploads/lemonade.jpg",       sortOrder: 1, isPopular: true,  hasExtras: false, hasSizes: true  },
    { categoryId: categories[6].id, name: "Mojito",             nameAz: "Mojito",              nameEn: "Mojito",             nameRu: "Мохито",               nameTr: "Mojito",              description: "Classic mint mojito (non-alcoholic)",          price: 7.0,  image: "/uploads/mojito.jpg",         sortOrder: 2, isPopular: true,  hasExtras: false, hasSizes: true  },
    { categoryId: categories[6].id, name: "Turkish Coffee",     nameAz: "Türk Qəhvəsi",        nameEn: "Turkish Coffee",     nameRu: "Турецкий кофе",        nameTr: "Türk Kahvesi",        description: "Traditional Turkish coffee",                   price: 4.0,  image: "/uploads/turkish-coffee.jpg", sortOrder: 3, isPopular: false, hasExtras: false, hasSizes: false },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({ data: { ...p, status: "active" } }),
    ),
  );
  console.log("🍕 Products created: 18 products");

  // ========== PRODUCT SIZES ==========
  const steak        = products[6];
  const classicBurger= products[8];
  const margherita   = products[11];
  const pepperoni    = products[12];
  const fourCheese   = products[13];
  const lemonade     = products[16];
  const mojito       = products[17];

  await prisma.productSize.createMany({
    data: [
      { productId: steak.id, name: "200g",             nameAz: "200qr",          nameEn: "200g",             priceModifier: 0,  isDefault: true  },
      { productId: steak.id, name: "300g",             nameAz: "300qr",          nameEn: "300g",             priceModifier: 10, isDefault: false },
      { productId: steak.id, name: "400g",             nameAz: "400qr",          nameEn: "400g",             priceModifier: 18, isDefault: false },
      { productId: classicBurger.id, name: "Regular",  nameAz: "Standart",       nameEn: "Regular",          priceModifier: 0,  isDefault: true  },
      { productId: classicBurger.id, name: "Large",    nameAz: "Böyük",          nameEn: "Large",            priceModifier: 4,  isDefault: false },
      ...([margherita, pepperoni, fourCheese].flatMap(pizza => [
        { productId: pizza.id, name: "Small (25cm)",   nameAz: "Kiçik (25sm)",   nameEn: "Small (25cm)",     priceModifier: 0,  isDefault: true  },
        { productId: pizza.id, name: "Medium (30cm)",  nameAz: "Orta (30sm)",    nameEn: "Medium (30cm)",    priceModifier: 5,  isDefault: false },
        { productId: pizza.id, name: "Large (35cm)",   nameAz: "Böyük (35sm)",   nameEn: "Large (35cm)",     priceModifier: 10, isDefault: false },
      ])),
      { productId: lemonade.id, name: "300ml",         nameAz: "300ml",          nameEn: "300ml",            priceModifier: 0,  isDefault: true  },
      { productId: lemonade.id, name: "500ml",         nameAz: "500ml",          nameEn: "500ml",            priceModifier: 2,  isDefault: false },
      { productId: mojito.id,   name: "300ml",         nameAz: "300ml",          nameEn: "300ml",            priceModifier: 0,  isDefault: true  },
      { productId: mojito.id,   name: "500ml",         nameAz: "500ml",          nameEn: "500ml",            priceModifier: 2,  isDefault: false },
    ],
  });
  console.log("📏 Product sizes created");

  // ========== PRODUCT EXTRAS ==========
  const wings        = products[1];
  const caesar       = products[3];
  const salmon       = products[5];
  const doubleBurger = products[9];
  const chickenBurger= products[10];

  const extrasMap = [
    { product: wings,        extras: [{ name: "Extra Sauce", nameAz: "Əlavə Sous",   nameEn: "Extra Sauce",   price: 1.5 }, { name: "Ranch Dip",    nameAz: "Ranch Sous",   nameEn: "Ranch Dip",    price: 2.0 }] },
    { product: caesar,       extras: [{ name: "Extra Chicken",nameAz: "Əlavə Toyuq", nameEn: "Extra Chicken", price: 4.0 }, { name: "Avocado",      nameAz: "Avokado",      nameEn: "Avocado",      price: 3.0 }] },
    { product: salmon,       extras: [{ name: "Extra Veg",   nameAz: "Əlavə Tərəvəz",nameEn: "Extra Veg",     price: 3.5 }, { name: "Garlic Butter",nameAz: "Sarımsaq Yağı",nameEn: "Garlic Butter",price: 2.0 }] },
    { product: classicBurger,extras: [{ name: "Bacon",       nameAz: "Bekon",        nameEn: "Bacon",         price: 2.5 }, { name: "Extra Cheese", nameAz: "Əlavə Pendir", nameEn: "Extra Cheese",  price: 1.5 }, { name: "Jalapeño", nameAz: "Jalapeño", nameEn: "Jalapeño", price: 1.0 }, { name: "Fried Egg", nameAz: "Qızardılmış Yumurta", nameEn: "Fried Egg", price: 1.5 }] },
    { product: doubleBurger, extras: [{ name: "Bacon",       nameAz: "Bekon",        nameEn: "Bacon",         price: 2.5 }, { name: "Extra Cheese", nameAz: "Əlavə Pendir", nameEn: "Extra Cheese",  price: 1.5 }] },
    { product: chickenBurger,extras: [{ name: "Extra Cheese",nameAz: "Əlavə Pendir", nameEn: "Extra Cheese",  price: 1.5 }, { name: "Bacon",        nameAz: "Bekon",        nameEn: "Bacon",         price: 2.5 }] },
    { product: margherita,   extras: [{ name: "Extra Cheese",nameAz: "Əlavə Pendir", nameEn: "Extra Cheese",  price: 2.0 }, { name: "Mushrooms",    nameAz: "Göbələk",      nameEn: "Mushrooms",     price: 2.5 }, { name: "Olives", nameAz: "Zeytun", nameEn: "Olives", price: 1.5 }, { name: "Pepperoni", nameAz: "Pepperoni", nameEn: "Pepperoni", price: 3.0 }] },
    { product: pepperoni,    extras: [{ name: "Extra Cheese",nameAz: "Əlavə Pendir", nameEn: "Extra Cheese",  price: 2.0 }, { name: "Mushrooms",    nameAz: "Göbələk",      nameEn: "Mushrooms",     price: 2.5 }, { name: "Olives", nameAz: "Zeytun", nameEn: "Olives", price: 1.5 }] },
    { product: fourCheese,   extras: [{ name: "Mushrooms",   nameAz: "Göbələk",      nameEn: "Mushrooms",     price: 2.5 }, { name: "Olives",       nameAz: "Zeytun",       nameEn: "Olives",        price: 1.5 }] },
  ];

  for (const { product, extras } of extrasMap) {
    if (product) {
      await prisma.productExtra.createMany({
        data: extras.map((e) => ({ ...e, productId: product.id })),
      });
    }
  }
  console.log("➕ Product extras created");

  // ========== REWARDS ==========
  await prisma.reward.createMany({
    data: [
      { title: "Welcome Discount", titleAz: "Xoş Gəlmisiniz Endirimi", titleEn: "Welcome Discount", description: "Get 20% off your first order", descriptionAz: "İlk sifarişinizdən 20% endirim əldə edin", descriptionEn: "Get 20% off your first order", pointsRequired: 0,   discountPercent: 20, status: "active" },
      { title: "Coffee Treat",     titleAz: "Pulsuz Qəhvə",            titleEn: "Coffee Treat",     description: "Redeem for a free Turkish Coffee", descriptionAz: "Türk qəhvəsi üçün xal xərclə",     descriptionEn: "Redeem for a free Turkish Coffee", pointsRequired: 100, discountAmount: 4,   status: "active" },
      { title: "Birthday Special", titleAz: "Ad Günü Hədiyyəsi",       titleEn: "Birthday Special", description: "15 AZN off on your birthday order", descriptionAz: "Ad günü sifarişindən 15 AZN endirim",descriptionEn: "15 AZN off on your birthday order",pointsRequired: 200, discountAmount: 15,  status: "active" },
      { title: "Loyal Customer",   titleAz: "Sadiq Müştəri",           titleEn: "Loyal Customer",   description: "10% off for our loyal customers", descriptionAz: "Sadiq müştərilər üçün 10% endirim",  descriptionEn: "10% off for our loyal customers",  pointsRequired: 500, discountPercent: 10, status: "active" },
    ],
  });
  console.log("🎁 Rewards created: 4 rewards");

  // ========== RAW MATERIALS ==========
  // "Aşağı ehtiyat" demo üçün bəziləri intentionally az stokla
  const rawMaterialsData = [
    { nameAz: "Un",                nameEn: "Flour",              unit: "kg",    currentStock: 50,  minStock: 10,  costPerUnit: 1.50, category: "Quru məhsullar" },
    { nameAz: "Pomidor sousu",     nameEn: "Tomato sauce",       unit: "litr",  currentStock: 18,  minStock: 5,   costPerUnit: 2.00, category: "Souslar" },
    { nameAz: "Mozzarella",        nameEn: "Mozzarella",         unit: "kg",    currentStock: 12,  minStock: 3,   costPerUnit: 8.00, category: "Süd məhsulları" },
    { nameAz: "Toyuq fileto",      nameEn: "Chicken fillet",     unit: "kg",    currentStock: 22,  minStock: 5,   costPerUnit: 5.50, category: "Ət" },
    { nameAz: "Mal əti (qiymə)",   nameEn: "Beef mince",         unit: "kg",    currentStock: 18,  minStock: 5,   costPerUnit: 7.00, category: "Ət" },
    { nameAz: "Somon",             nameEn: "Salmon",             unit: "kg",    currentStock: 2.2, minStock: 3,   costPerUnit: 18.00,category: "Dəniz məhsulları" }, // aşağı stok
    { nameAz: "Kərə yağı",         nameEn: "Butter",             unit: "kg",    currentStock: 7,   minStock: 2,   costPerUnit: 4.50, category: "Süd məhsulları" },
    { nameAz: "Limon",             nameEn: "Lemon",              unit: "ədəd",  currentStock: 45,  minStock: 10,  costPerUnit: 0.50, category: "Meyvə-tərəvəz" },
    { nameAz: "Nane",              nameEn: "Mint",               unit: "dəstə", currentStock: 12,  minStock: 5,   costPerUnit: 0.80, category: "Göyərti" },
    { nameAz: "Qaymaq",            nameEn: "Heavy cream",        unit: "litr",  currentStock: 1.8, minStock: 2,   costPerUnit: 3.50, category: "Süd məhsulları" }, // aşağı stok
    { nameAz: "Parmesan",          nameEn: "Parmesan",           unit: "kg",    currentStock: 4,   minStock: 1,   costPerUnit: 14.00,category: "Süd məhsulları" },
    { nameAz: "Romaine salat",     nameEn: "Romaine lettuce",    unit: "kg",    currentStock: 1.5, minStock: 2,   costPerUnit: 3.00, category: "Meyvə-tərəvəz" }, // aşağı stok
    { nameAz: "Burger çörəyi",     nameEn: "Burger bun",         unit: "ədəd",  currentStock: 80,  minStock: 20,  costPerUnit: 0.80, category: "Çörək" },
    { nameAz: "Pizza xəmiri baza", nameEn: "Pizza dough base",   unit: "ədəd",  currentStock: 25,  minStock: 10,  costPerUnit: 1.50, category: "Çörək" },
    { nameAz: "Zeytun yağı",       nameEn: "Olive oil",          unit: "litr",  currentStock: 4.5, minStock: 1,   costPerUnit: 6.00, category: "Yağ" },
    { nameAz: "Pepperoni dilim",   nameEn: "Pepperoni slices",   unit: "kg",    currentStock: 5,   minStock: 1.5, costPerUnit: 12.00,category: "Ət" },
    { nameAz: "Yumurta",           nameEn: "Egg",                unit: "ədəd",  currentStock: 60,  minStock: 12,  costPerUnit: 0.25, category: "Süd məhsulları" },
  ];

  const rawMaterials = await Promise.all(
    rawMaterialsData.map((rm) =>
      prisma.rawMaterial.create({
        data: { ...rm, name: rm.nameAz, branchId: branch1.id, status: "active" },
      }),
    ),
  );
  console.log(`🧂 Raw materials created: ${rawMaterials.length} items (3 low stock)`);

  // Raw material aliases
  const rmUn       = rawMaterials[0];   // Flour
  const rmSous     = rawMaterials[1];   // Tomato sauce
  const rmMozz     = rawMaterials[2];   // Mozzarella
  const rmToyuq    = rawMaterials[3];   // Chicken
  const rmMalEti   = rawMaterials[4];   // Beef
  const rmSomon    = rawMaterials[5];   // Salmon
  const rmKere     = rawMaterials[6];   // Butter
  const rmLimon    = rawMaterials[7];   // Lemon
  const rmNane     = rawMaterials[8];   // Mint
  const rmQaymaq   = rawMaterials[9];   // Cream
  const rmParmesan = rawMaterials[10];  // Parmesan
  const rmBurgerBun= rawMaterials[12];  // Burger bun
  const rmPizzaBaza= rawMaterials[13];  // Pizza dough
  const rmZeytunYag= rawMaterials[14];  // Olive oil

  // ========== RECIPES ==========
  // Marqarita Pizza
  const recipeMargherita = await prisma.recipe.create({
    data: {
      productId: margherita.id,
      yield: 1,
      note: "25sm ölçü üçün. Böyük ölçü üçün miqdarlar 1.5x artırılsın.",
      ingredients: {
        create: [
          { rawMaterialId: rmPizzaBaza.id, quantity: 1,    unit: "ədəd" },
          { rawMaterialId: rmSous.id,      quantity: 0.1,  unit: "litr" },
          { rawMaterialId: rmMozz.id,      quantity: 0.15, unit: "kg"   },
          { rawMaterialId: rmZeytunYag.id, quantity: 0.02, unit: "litr" },
        ],
      },
    },
  });

  // Klassik Burger
  const recipeClassicBurger = await prisma.recipe.create({
    data: {
      productId: classicBurger.id,
      yield: 1,
      note: "1 burger porsiyonu.",
      ingredients: {
        create: [
          { rawMaterialId: rmMalEti.id,   quantity: 0.15, unit: "kg"   },
          { rawMaterialId: rmBurgerBun.id,quantity: 1,    unit: "ədəd" },
          { rawMaterialId: rmMozz.id,     quantity: 0.04, unit: "kg"   },
          { rawMaterialId: rmKere.id,     quantity: 0.02, unit: "kg"   },
        ],
      },
    },
  });

  // Toyuq Qanadları
  const recipeWings = await prisma.recipe.create({
    data: {
      productId: wings.id,
      yield: 1,
      note: "1 porsiya (6 ədəd).",
      ingredients: {
        create: [
          { rawMaterialId: rmToyuq.id,quantity: 0.3,  unit: "kg" },
          { rawMaterialId: rmKere.id, quantity: 0.03, unit: "kg" },
        ],
      },
    },
  });

  // Qızardılmış Somon
  const recipeSalmon = await prisma.recipe.create({
    data: {
      productId: salmon.id,
      yield: 1,
      note: "220qr somon fileto.",
      ingredients: {
        create: [
          { rawMaterialId: rmSomon.id, quantity: 0.22, unit: "kg"   },
          { rawMaterialId: rmKere.id,  quantity: 0.03, unit: "kg"   },
          { rawMaterialId: rmLimon.id, quantity: 1,    unit: "ədəd" },
        ],
      },
    },
  });

  // Sezar Salatı
  const recipeCaesar = await prisma.recipe.create({
    data: {
      productId: caesar.id,
      yield: 1,
      note: "1 porsiya.",
      ingredients: {
        create: [
          { rawMaterialId: rawMaterials[11].id, quantity: 0.12, unit: "kg"   }, // romaine
          { rawMaterialId: rmParmesan.id,        quantity: 0.03, unit: "kg"   },
          { rawMaterialId: rmToyuq.id,           quantity: 0.1,  unit: "kg"   },
          { rawMaterialId: rmZeytunYag.id,       quantity: 0.02, unit: "litr" },
        ],
      },
    },
  });

  // Təzə Limonad
  const recipeLemonade = await prisma.recipe.create({
    data: {
      productId: lemonade.id,
      yield: 1,
      note: "300ml stəkan üçün.",
      ingredients: {
        create: [
          { rawMaterialId: rmLimon.id, quantity: 2,   unit: "ədəd"  },
          { rawMaterialId: rmNane.id,  quantity: 0.1, unit: "dəstə" },
        ],
      },
    },
  });

  console.log("📋 Recipes created: 6 products");

  // ========== RAW MOVEMENTS (ilkin stok alışları) ==========
  const purchaseDate = new Date(Date.now() - 2 * 24 * 60 * 60000); // 2 gün əvvəl

  await prisma.rawMovement.createMany({
    data: rawMaterials.map((rm) => ({
      rawMaterialId: rm.id,
      branchId: branch1.id,
      type: "purchase",
      quantity: rm.currentStock,
      unitCost: rm.costPerUnit ?? 0,
      note: "İlkin stok alışı",
      createdById: manager.id,
      createdAt: purchaseDate,
    })),
  });
  console.log("📦 Raw movements created: initial stock purchases");

  // ========== PROMO CODES ==========
  const now = new Date();
  const in30  = new Date(now.getTime() + 30  * 24 * 60 * 60000);
  const in60  = new Date(now.getTime() + 60  * 24 * 60 * 60000);
  const in90  = new Date(now.getTime() + 90  * 24 * 60 * 60000);
  const past  = new Date(now.getTime() - 1   * 24 * 60 * 60000);

  await prisma.promoCode.createMany({
    data: [
      {
        branchId: branch1.id,
        code: "WELCOME10",
        description: "Yeni müştərilər üçün 10% endirim",
        type: "percent",
        value: 10,
        minOrderAmount: 20,
        maxUses: null,
        usedCount: 14,
        validFrom: new Date(now.getTime() - 30 * 24 * 60 * 60000),
        validTo: in60,
        status: "active",
      },
      {
        branchId: branch1.id,
        code: "SUMMER25",
        description: "Yay mövsümü — 25% endirim",
        type: "percent",
        value: 25,
        minOrderAmount: 50,
        maxUses: 50,
        usedCount: 23,
        validFrom: now,
        validTo: in90,
        status: "active",
      },
      {
        branchId: branch1.id,
        code: "FLATOFF15",
        description: "15 AZN sabit endirim",
        type: "fixed",
        value: 15,
        minOrderAmount: 40,
        maxUses: 100,
        usedCount: 7,
        validFrom: now,
        validTo: in30,
        status: "active",
      },
      {
        branchId: branch1.id,
        code: "EXPIRED50",
        description: "Test — bitmiş promo kod",
        type: "percent",
        value: 50,
        minOrderAmount: null,
        maxUses: 10,
        usedCount: 10,
        validFrom: new Date(now.getTime() - 60 * 24 * 60 * 60000),
        validTo: past,
        status: "expired",
      },
      {
        branchId: branch2.id,
        code: "NIZAMI10",
        description: "Nizami filialı üçün xüsusi endirim",
        type: "percent",
        value: 10,
        minOrderAmount: 25,
        maxUses: 200,
        usedCount: 41,
        validFrom: now,
        validTo: in60,
        status: "active",
      },
    ],
  });
  console.log("🏷️  Promo codes created: 5 codes");

  // ========== CUSTOMERS (CRM) ==========
  const customersData = [
    { name: "Aysel Məmmədova",   phone: "+994501234567", email: "aysel@example.com",  totalOrders: 8,  totalSpent: 240.50, points: 350, tags: ["loyal", "pizza"],   notes: "Pizza seven müştəri", lastVisit: new Date(Date.now() - 2  * 24 * 60 * 60000) },
    { name: "Kamran Hüseynov",   phone: "+994552345678", email: null,                  totalOrders: 3,  totalSpent: 95.00,  points: 120, tags: ["burger"],           notes: null,                  lastVisit: new Date(Date.now() - 7  * 24 * 60 * 60000) },
    { name: "Nigar Əliyeva",     phone: "+994703456789", email: "nigar@example.com",   totalOrders: 18, totalSpent: 520.00, points: 780, tags: ["vip", "loyal"],     notes: "VIP müştəri, həmişə pəncərə yanında oturur", lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60000) },
    { name: "Rashad Quliyev",    phone: "+994774567890", email: null,                  totalOrders: 1,  totalSpent: 28.00,  points: 45,  tags: [],                  notes: null,                  lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60000) },
    { name: "Leyla Babayeva",    phone: "+994515678901", email: "leyla@example.com",   totalOrders: 5,  totalSpent: 160.00, points: 200, tags: ["salad", "drinks"],  notes: "Vegetarian, ətsiz yeməklər sifariş edir", lastVisit: new Date(Date.now() - 4 * 24 * 60 * 60000) },
    { name: "Fərid Rəsulzadə",   phone: "+994559876543", email: null,                  totalOrders: 12, totalSpent: 380.00, points: 560, tags: ["steak", "loyal"],   notes: "Steak həvəskarı",     lastVisit: new Date(Date.now() - 3  * 24 * 60 * 60000) },
  ];

  const customers = await Promise.all(
    customersData.map((c) =>
      prisma.customer.create({
        data: { ...c, branchId: branch1.id },
      }),
    ),
  );
  console.log(`👥 Customers created: ${customers.length} CRM records`);

  // ========== ORDERS ==========
  type OrderSeedItem = {
    tableId: string;
    status: string;
    items: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[];
    specialRequest?: string;
    estimatedTime?: number;
    preparationStartedAt?: Date;
    preparationCompletedAt?: Date;
    preparationDuration?: number;
    delayMinutes?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    paidAt?: Date;
    createdAt: Date;
    customerId?: string;
  };

  const orderData: OrderSeedItem[] = [
    // PENDING orders (Kitchen "New" tab)
    {
      tableId: tablesSahil[0].id,
      status: "pending",
      items: [
        { productId: products[11].id, quantity: 1, unitPrice: 18.0, totalPrice: 18.0 }, // Margherita
        { productId: products[16].id, quantity: 2, unitPrice: 5.0,  totalPrice: 10.0 }, // Lemonade
      ],
      specialRequest: "Extra cheese on pizza please",
      createdAt: new Date(Date.now() - 5 * 60000),
    },
    {
      tableId: tablesSahil[1].id,
      status: "pending",
      items: [
        { productId: products[8].id,  quantity: 2, unitPrice: 16.0, totalPrice: 32.0 }, // Classic Burger
        { productId: products[17].id, quantity: 1, unitPrice: 7.0,  totalPrice: 7.0  }, // Mojito
      ],
      specialRequest: "No onions on burgers",
      createdAt: new Date(Date.now() - 3 * 60000),
    },
    {
      tableId: tablesSahil[2].id,
      status: "pending",
      items: [
        { productId: products[5].id,  quantity: 1, unitPrice: 28.0, totalPrice: 28.0 }, // Salmon
        { productId: products[14].id, quantity: 1, unitPrice: 10.0, totalPrice: 10.0 }, // Tiramisu
      ],
      createdAt: new Date(Date.now() - 1 * 60000),
      customerId: customers[2].id,
    },
    // PREPARING orders (Kitchen "Preparing" tab)
    {
      tableId: tablesSahil[3].id,
      status: "preparing",
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 14 * 60000),
      items: [
        { productId: products[9].id,  quantity: 1, unitPrice: 22.0, totalPrice: 22.0 }, // Double Burger
        { productId: products[15].id, quantity: 1, unitPrice: 11.0, totalPrice: 11.0 }, // Cheesecake
      ],
      createdAt: new Date(Date.now() - 15 * 60000),
    },
    {
      tableId: tablesSahil[4].id,
      status: "preparing",
      estimatedTime: 15,
      preparationStartedAt: new Date(Date.now() - 16 * 60000),
      items: [
        { productId: products[10].id, quantity: 1, unitPrice: 15.0, totalPrice: 15.0 }, // Chicken Burger
        { productId: products[1].id,  quantity: 1, unitPrice: 12.0, totalPrice: 12.0 }, // Wings
      ],
      specialRequest: "Wings extra crispy",
      createdAt: new Date(Date.now() - 18 * 60000),
    },
    {
      tableId: tablesSahil[5].id,
      status: "preparing",
      estimatedTime: 15,
      preparationStartedAt: new Date(Date.now() - 7 * 60000),
      items: [
        { productId: products[6].id,  quantity: 1, unitPrice: 35.0, totalPrice: 35.0 }, // Steak
        { productId: products[3].id,  quantity: 1, unitPrice: 14.0, totalPrice: 14.0 }, // Caesar
      ],
      createdAt: new Date(Date.now() - 8 * 60000),
      customerId: customers[5].id,
    },
    // READY orders (Kitchen "Ready" tab)
    {
      tableId: tablesSahil[6].id,
      status: "ready",
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 24 * 60000),
      preparationCompletedAt: new Date(Date.now() - 5 * 60000),
      preparationDuration: 19,
      delayMinutes: -1,
      items: [
        { productId: products[13].id, quantity: 1, unitPrice: 24.0, totalPrice: 24.0 }, // 4 Cheese
        { productId: products[17].id, quantity: 2, unitPrice: 7.0,  totalPrice: 14.0 }, // Mojito
      ],
      createdAt: new Date(Date.now() - 25 * 60000),
    },
    {
      tableId: tablesSahil[7].id,
      status: "ready",
      estimatedTime: 15,
      preparationStartedAt: new Date(Date.now() - 19 * 60000),
      preparationCompletedAt: new Date(Date.now() - 4 * 60000),
      preparationDuration: 15,
      delayMinutes: 0,
      items: [
        { productId: products[7].id,  quantity: 1, unitPrice: 18.0, totalPrice: 18.0 }, // Alfredo
        { productId: products[0].id,  quantity: 1, unitPrice: 8.5,  totalPrice: 8.5  }, // Bruschetta
      ],
      createdAt: new Date(Date.now() - 20 * 60000),
      customerId: customers[0].id,
    },
    // SERVED / PAID orders (analytics data)
    {
      tableId: tablesNizami[0].id,
      status: "served",
      paymentStatus: "paid",
      paymentMethod: "card",
      paidAt: new Date(Date.now() - 40 * 60000),
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 58 * 60000),
      preparationCompletedAt: new Date(Date.now() - 40 * 60000),
      preparationDuration: 18,
      delayMinutes: -2,
      items: [
        { productId: products[11].id, quantity: 2, unitPrice: 18.0, totalPrice: 36.0 },
        { productId: products[16].id, quantity: 3, unitPrice: 5.0,  totalPrice: 15.0 },
      ],
      createdAt: new Date(Date.now() - 60 * 60000),
      customerId: customers[1].id,
    },
    {
      tableId: tablesNizami[1].id,
      status: "served",
      paymentStatus: "paid",
      paymentMethod: "cash",
      paidAt: new Date(Date.now() - 65 * 60000),
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 88 * 60000),
      preparationCompletedAt: new Date(Date.now() - 65 * 60000),
      preparationDuration: 23,
      delayMinutes: 3,
      items: [
        { productId: products[6].id,  quantity: 1, unitPrice: 35.0, totalPrice: 35.0 },
        { productId: products[3].id,  quantity: 1, unitPrice: 14.0, totalPrice: 14.0 },
      ],
      createdAt: new Date(Date.now() - 90 * 60000),
      customerId: customers[5].id,
    },
    // Historical paid orders for dashboard charts (yesterday)
    {
      tableId: tablesSahil[0].id,
      status: "served",
      paymentStatus: "paid",
      paymentMethod: "card",
      paidAt: new Date(Date.now() - 26 * 60 * 60000),
      items: [
        { productId: products[12].id, quantity: 1, unitPrice: 22.0, totalPrice: 22.0 }, // Pepperoni
        { productId: products[1].id,  quantity: 2, unitPrice: 12.0, totalPrice: 24.0 }, // Wings x2
        { productId: products[17].id, quantity: 2, unitPrice: 7.0,  totalPrice: 14.0 }, // Mojito x2
      ],
      createdAt: new Date(Date.now() - 27 * 60 * 60000),
    },
    {
      tableId: tablesSahil[2].id,
      status: "served",
      paymentStatus: "paid",
      paymentMethod: "online",
      paidAt: new Date(Date.now() - 30 * 60 * 60000),
      items: [
        { productId: products[6].id,  quantity: 1, unitPrice: 35.0, totalPrice: 35.0 }, // Steak
        { productId: products[15].id, quantity: 1, unitPrice: 11.0, totalPrice: 11.0 }, // Cheesecake
        { productId: products[16].id, quantity: 1, unitPrice: 5.0,  totalPrice: 5.0  }, // Lemonade
      ],
      createdAt: new Date(Date.now() - 31 * 60 * 60000),
      customerId: customers[2].id,
    },
    {
      tableId: tablesSahil[4].id,
      status: "served",
      paymentStatus: "paid",
      paymentMethod: "cash",
      paidAt: new Date(Date.now() - 48 * 60 * 60000),
      items: [
        { productId: products[8].id,  quantity: 3, unitPrice: 16.0, totalPrice: 48.0 }, // 3x Classic Burger
        { productId: products[14].id, quantity: 2, unitPrice: 10.0, totalPrice: 20.0 }, // 2x Tiramisu
        { productId: products[17].id, quantity: 3, unitPrice: 7.0,  totalPrice: 21.0 }, // 3x Mojito
      ],
      createdAt: new Date(Date.now() - 49 * 60 * 60000),
    },
  ];

  const createdOrders: any[] = [];
  for (const od of orderData) {
    const subtotal = od.items.reduce((s, i) => s + i.totalPrice, 0);
    const serviceFee = subtotal * 0.05;
    const total = subtotal + serviceFee;
    const orderNumber = String(Math.floor(10000 + Math.random() * 90000));

    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId: od.tableId,
        branchId: branch1.id,
        subtotal,
        serviceFee,
        discount: 0,
        total,
        status: od.status as any,
        paymentMethod: od.paymentMethod ?? "cash",
        paymentStatus: od.paymentStatus ?? (od.status === "served" ? "paid" : "pending"),
        paidAt: od.paidAt ?? null,
        specialRequest: od.specialRequest || null,
        estimatedTime: od.estimatedTime ?? null,
        preparationStartedAt: od.preparationStartedAt ?? null,
        preparationCompletedAt: od.preparationCompletedAt ?? null,
        preparationDuration: od.preparationDuration ?? null,
        delayMinutes: od.delayMinutes ?? null,
        customerId: od.customerId ?? null,
        createdAt: od.createdAt,
        items: { create: od.items },
      },
    });
    createdOrders.push(order);
  }
  console.log(`🛒 Orders created: ${createdOrders.length} orders`);

  // ========== CUSTOMER FEEDBACK ==========
  const servedOrders = createdOrders.filter((_, i) => orderData[i].status === "served");
  const feedbackData = [
    { orderId: servedOrders[0]?.id, customerId: customers[1].id, rating: 5, comment: "Marqarita pizza əla idi! Növbəti dəfə də gələcəyik." },
    { orderId: servedOrders[1]?.id, customerId: customers[5].id, rating: 4, comment: "Steak yaxşı idi, amma bir az gec gəldi." },
    { orderId: servedOrders[2]?.id, customerId: customers[2].id, rating: 5, comment: "Pepperoni pizza və mojito — mükəmməl kombinasiya!" },
    { orderId: servedOrders[3]?.id, customerId: null,             rating: 3, comment: "Steak orta idi, daha isti gəlsə yaxşı olar." },
  ];

  for (const fb of feedbackData) {
    if (!fb.orderId) continue;
    await prisma.customerFeedback.create({
      data: {
        branchId: branch1.id,
        customerId: fb.customerId,
        orderId: fb.orderId,
        rating: fb.rating,
        comment: fb.comment,
        createdAt: new Date(Date.now() - Math.random() * 5 * 60 * 60000),
      },
    });
  }
  console.log("⭐ Customer feedbacks created: 4 reviews");

  // ========== WAITER REQUESTS ==========
  await prisma.waiterRequest.createMany({
    data: [
      { tableId: tablesSahil[0].id, type: "call",   status: "pending",  message: null,                     createdAt: new Date(Date.now() - 2  * 60000) },
      { tableId: tablesSahil[2].id, type: "water",  status: "pending",  message: "Cold water please",      createdAt: new Date(Date.now() - 1  * 60000) },
      { tableId: tablesSahil[4].id, type: "bill",   status: "pending",  message: null,                     createdAt: new Date(Date.now() - 5  * 60000) },
      { tableId: tablesSahil[6].id, type: "napkin", status: "accepted", message: null,                     createdAt: new Date(Date.now() - 10 * 60000) },
      { tableId: tablesSahil[1].id, type: "clean",  status: "pending",  message: "Spilled drink on table", createdAt: new Date(Date.now() - 3  * 60000) },
      { tableId: tablesNizami[0].id,type: "call",   status: "done",     message: null,                     createdAt: new Date(Date.now() - 30 * 60000) },
      { tableId: tablesNizami[2].id,type: "water",  status: "pending",  message: "Sparkling water",        createdAt: new Date(Date.now() - 1  * 60000) },
    ],
  });
  console.log("🔔 Waiter requests created: 7 requests");

  // ========== TABLE RESERVATIONS ==========
  const tomorrow    = new Date(now.getTime() + 1 * 24 * 60 * 60000);
  const dayAfter    = new Date(now.getTime() + 2 * 24 * 60 * 60000);
  tomorrow.setHours(19, 0, 0, 0);
  dayAfter.setHours(20, 0, 0, 0);
  const lunchDay    = new Date(now.getTime() + 2 * 24 * 60 * 60000);
  lunchDay.setHours(13, 0, 0, 0);

  await prisma.tableReservation.createMany({
    data: [
      { branchId: branch1.id, tableId: tablesSahil[2].id, customerName: "Anar Nəcəfov",    phone: "+994501112233", partySize: 4, dateTime: tomorrow, duration: 90,  status: "confirmed", notes: "Ad günü — tort sifariş edilib" },
      { branchId: branch1.id, tableId: tablesSahil[0].id, customerName: "Sevinc İsmailova",phone: "+994552223344", partySize: 2, dateTime: dayAfter, duration: 60,  status: "confirmed", notes: null },
      { branchId: branch1.id, tableId: tablesSahil[4].id, customerName: "Fərid Rəsulzadə", phone: "+994559876543", partySize: 8, dateTime: lunchDay, duration: 120, status: "confirmed", notes: "Şirkət naharı — 8 nəfər" },
      { branchId: branch2.id, tableId: tablesNizami[3].id,customerName: "Günel Xəlilova",  phone: "+994703334455", partySize: 3, dateTime: tomorrow, duration: 90,  status: "pending",   notes: null },
    ],
  });
  console.log("📅 Reservations created: 4 upcoming reservations");

  // ========== ACTIVE SHIFT ==========
  const shiftOpenedAt = new Date();
  shiftOpenedAt.setHours(8, 0, 0, 0);

  const activeShift = await prisma.shift.create({
    data: {
      branchId: branch1.id,
      openedById: manager.id,
      openedAt: shiftOpenedAt,
      status: "open",
      openingCash: 150,
      notes: "Standart açılış — iki ofisant işdə",
    },
  });
  console.log("🕐 Active shift created: opened at 08:00");

  // ========== CASH DRAWER ==========
  await prisma.cashDrawer.create({
    data: {
      branchId: branch1.id,
      openedById: manager.id,
      openedAt: shiftOpenedAt,
      openingCash: 150,
      status: "open",
      notes: "Gündəlik açılış",
    },
  });
  console.log("💵 Cash drawer created: open with 150 AZN");

  // ========== NOTIFICATIONS ==========
  await prisma.notification.createMany({
    data: [
      {
        branchId: branch1.id,
        type: "low_stock",
        title: "Stok xəbərdarlığı — Somon",
        message: "Somon ehtiyatı minimumdan aşağı düşüb (2.2 kq < 3 kq minimum)",
        data: { rawMaterialId: rmSomon.id, currentStock: 2.2, minStock: 3 },
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60000),
      },
      {
        branchId: branch1.id,
        type: "low_stock",
        title: "Stok xəbərdarlığı — Qaymaq",
        message: "Qaymaq ehtiyatı minimumdan aşağı düşüb (1.8 litr < 2 litr minimum)",
        data: { rawMaterialId: rmQaymaq.id, currentStock: 1.8, minStock: 2 },
        isRead: false,
        createdAt: new Date(Date.now() - 25 * 60000),
      },
      {
        branchId: branch1.id,
        type: "low_stock",
        title: "Stok xəbərdarlığı — Romaine Salat",
        message: "Romaine salat ehtiyatı minimumdan aşağı düşüb (1.5 kq < 2 kq minimum)",
        data: { rawMaterialId: rawMaterials[11].id, currentStock: 1.5, minStock: 2 },
        isRead: false,
        createdAt: new Date(Date.now() - 20 * 60000),
      },
      {
        branchId: branch1.id,
        type: "sla_breach",
        title: "Sifariş gecikir",
        message: `Masa 5 — ${20} dəqiqədir "hazırlanır" vəziyyətindədir`,
        data: { waitMinutes: 20 },
        isRead: true,
        createdAt: new Date(Date.now() - 18 * 60000),
      },
      {
        branchId: branch1.id,
        type: "daily_report",
        title: "Günlük hesabat — Sahil",
        message: "Dünən: 24 sifariş · 387.50 ₼ gəlir",
        data: { orders: 24, revenue: 387.50 },
        isRead: true,
        createdAt: new Date(Date.now() - 8 * 60 * 60000),
      },
      {
        branchId: branch2.id,
        type: "daily_report",
        title: "Günlük hesabat — Nizami",
        message: "Dünən: 18 sifariş · 292.00 ₼ gəlir",
        data: { orders: 18, revenue: 292.00 },
        isRead: true,
        createdAt: new Date(Date.now() - 8 * 60 * 60000),
      },
    ],
  });
  console.log("🔔 Notifications created: 6 notifications (3 low stock, 1 SLA, 2 daily)");

  // ========== SETTINGS ==========
  await prisma.settings.create({
    data: { id: "singleton", defaultPrepTime: 15 },
  });
  console.log("⚙️  Settings created: defaultPrepTime=15");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ SEED COMPLETED SUCCESSFULLY!");
  console.log("\n📋 Login Credentials:");
  console.log("   Admin:    admin@foodzone.az    / password123");
  console.log("   Manager:  manager@foodzone.az  / password123");
  console.log("   Kitchen:  chef1@foodzone.az    / password123");
  console.log("   Waiter:   waiter1@foodzone.az  / password123");
  console.log("\n🍽️  Kitchen Panel: 3 pending + 3 preparing + 2 ready orders");
  console.log("🔔 Waiter Panel: 5 active waiter requests");
  console.log("📊 Dashboard: 4 paid orders, analytics data, 6 notifications");
  console.log("🧂 Inventory: 17 raw materials (3 low stock), 6 recipes");
  console.log("🏷️  Promo: 5 codes (WELCOME10, SUMMER25, FLATOFF15, NIZAMI10, EXPIRED50)");
  console.log("👥 CRM: 6 customers, 4 feedbacks, 4 reservations");
  console.log("💵 Active shift + cash drawer open at 08:00");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
