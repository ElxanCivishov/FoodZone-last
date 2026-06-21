import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (respect foreign key order)
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.waiterRequest.deleteMany();
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
    {
      name: "Starters",
      nameAz: "Qəlyanaltılar",
      nameEn: "Starters",
      nameRu: "Закуски",
      nameTr: "Başlangıçlar",
      icon: "utensils",
      sortOrder: 1,
    },
    {
      name: "Salads",
      nameAz: "Salatlar",
      nameEn: "Salads",
      nameRu: "Салаты",
      nameTr: "Salatalar",
      icon: "leaf",
      sortOrder: 2,
    },
    {
      name: "Main Course",
      nameAz: "Əsas Yeməklər",
      nameEn: "Main Course",
      nameRu: "Основные блюда",
      nameTr: "Ana Yemekler",
      icon: "chef-hat",
      sortOrder: 3,
    },
    {
      name: "Burgers",
      nameAz: "Burgerlər",
      nameEn: "Burgers",
      nameRu: "Бургеры",
      nameTr: "Burgerler",
      icon: "sandwich",
      sortOrder: 4,
    },
    {
      name: "Pizza",
      nameAz: "Pizzalar",
      nameEn: "Pizza",
      nameRu: "Пицца",
      nameTr: "Pizza",
      icon: "pizza",
      sortOrder: 5,
    },
    {
      name: "Desserts",
      nameAz: "Şirniyyatlar",
      nameEn: "Desserts",
      nameRu: "Десерты",
      nameTr: "Tatlılar",
      icon: "cake",
      sortOrder: 6,
    },
    {
      name: "Drinks",
      nameAz: "İçkilər",
      nameEn: "Drinks",
      nameRu: "Напитки",
      nameTr: "İçecekler",
      icon: "coffee",
      sortOrder: 7,
    },
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
    // Starters
    {
      categoryId: categories[0].id,
      name: "Bruschetta",
      nameAz: "Bruschetta",
      nameEn: "Bruschetta",
      nameRu: "Брускетта",
      nameTr: "Bruschetta",
      description: "Grilled bread with tomato, basil and garlic",
      descriptionAz: "Qızardılmış çörək pomidor, reyhan və sarımsaq ilə",
      descriptionEn: "Grilled bread with tomato, basil and garlic",
      descriptionRu: "Жареный хлеб с помидорами, базиликом и чесноком",
      descriptionTr: "Izgara ekmek domates, fesleğen ve sarımsak ile",
      price: 8.5,
      image: "/uploads/bruschetta.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: false,
      hasSizes: false,
    },
    {
      categoryId: categories[0].id,
      name: "Chicken Wings",
      nameAz: "Toyuq Qanadları",
      nameEn: "Chicken Wings",
      nameRu: "Куриные крылышки",
      nameTr: "Tavuk Kanatları",
      description: "Crispy wings with BBQ sauce",
      descriptionAz: "BBQ souslu xırtıldayan qanadlar",
      price: 12.0,
      image: "/uploads/wings.jpg",
      sortOrder: 2,
      isPopular: true,
      hasExtras: true,
      hasSizes: false,
    },
    {
      categoryId: categories[0].id,
      name: "Mozzarella Sticks",
      nameAz: "Mozzarella Çubuqları",
      nameEn: "Mozzarella Sticks",
      nameRu: "Сырные палочки",
      nameTr: "Mozzarella Çubukları",
      description: "Breaded mozzarella with marinara",
      price: 9.0,
      image: "/uploads/mozzarella.jpg",
      sortOrder: 3,
      isPopular: false,
      hasExtras: false,
      hasSizes: false,
    },
    // Salads
    {
      categoryId: categories[1].id,
      name: "Caesar Salad",
      nameAz: "Sezar Salatı",
      nameEn: "Caesar Salad",
      nameRu: "Салат Цезарь",
      nameTr: "Sezar Salatası",
      description: "Romaine lettuce, parmesan, croutons, caesar dressing",
      price: 14.0,
      image: "/uploads/caesar.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: true,
      hasSizes: false,
    },
    {
      categoryId: categories[1].id,
      name: "Greek Salad",
      nameAz: "Yunan Salatı",
      nameEn: "Greek Salad",
      nameRu: "Греческий салат",
      nameTr: "Yunan Salatası",
      description: "Tomato, cucumber, olives, feta cheese",
      price: 13.0,
      image: "/uploads/greek.jpg",
      sortOrder: 2,
      isPopular: false,
      hasExtras: false,
      hasSizes: false,
    },
    // Main Course
    {
      categoryId: categories[2].id,
      name: "Grilled Salmon",
      nameAz: "Qızardılmış Somon",
      nameEn: "Grilled Salmon",
      nameRu: "Жареный лосось",
      nameTr: "Izgara Somon",
      description: "Atlantic salmon with lemon butter sauce",
      price: 28.0,
      image: "/uploads/salmon.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: true,
      hasSizes: false,
    },
    {
      categoryId: categories[2].id,
      name: "Beef Steak",
      nameAz: "Mal Əti Stake",
      nameEn: "Beef Steak",
      nameRu: "Говяжий стейк",
      nameTr: "Dana Biftek",
      description: "Premium ribeye with herb butter",
      price: 35.0,
      image: "/uploads/steak.jpg",
      sortOrder: 2,
      isPopular: true,
      hasExtras: true,
      hasSizes: true,
    },
    {
      categoryId: categories[2].id,
      name: "Chicken Alfredo",
      nameAz: "Toyuq Alfredo",
      nameEn: "Chicken Alfredo",
      nameRu: "Курица Альфредо",
      nameTr: "Tavuk Alfredo",
      description: "Creamy pasta with grilled chicken",
      price: 18.0,
      image: "/uploads/alfredo.jpg",
      sortOrder: 3,
      isPopular: false,
      hasExtras: false,
      hasSizes: false,
    },
    // Burgers
    {
      categoryId: categories[3].id,
      name: "Classic Burger",
      nameAz: "Klassik Burger",
      nameEn: "Classic Burger",
      nameRu: "Классический бургер",
      nameTr: "Klasik Burger",
      description: "Beef patty, lettuce, tomato, cheese, special sauce",
      price: 16.0,
      image: "/uploads/classic-burger.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: true,
      hasSizes: true,
    },
    {
      categoryId: categories[3].id,
      name: "Double Cheeseburger",
      nameAz: "İkili Çizburger",
      nameEn: "Double Cheeseburger",
      nameRu: "Двойной чизбургер",
      nameTr: "Çift Peynirli Burger",
      description: "Two beef patties, double cheese, bacon",
      price: 22.0,
      image: "/uploads/double-burger.jpg",
      sortOrder: 2,
      isPopular: true,
      hasExtras: true,
      hasSizes: false,
    },
    {
      categoryId: categories[3].id,
      name: "Chicken Burger",
      nameAz: "Toyuq Burgeri",
      nameEn: "Chicken Burger",
      nameRu: "Куриный бургер",
      nameTr: "Tavuk Burger",
      description: "Crispy chicken fillet with coleslaw",
      price: 15.0,
      image: "/uploads/chicken-burger.jpg",
      sortOrder: 3,
      isPopular: false,
      hasExtras: true,
      hasSizes: false,
    },
    // Pizza
    {
      categoryId: categories[4].id,
      name: "Margherita",
      nameAz: "Marqarita",
      nameEn: "Margherita",
      nameRu: "Маргарита",
      nameTr: "Margarita",
      description: "Tomato sauce, mozzarella, fresh basil",
      price: 18.0,
      image: "/uploads/margherita.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: true,
      hasSizes: true,
    },
    {
      categoryId: categories[4].id,
      name: "Pepperoni",
      nameAz: "Pepperoni",
      nameEn: "Pepperoni",
      nameRu: "Пепперони",
      nameTr: "Pepperoni",
      description: "Tomato sauce, mozzarella, pepperoni",
      price: 22.0,
      image: "/uploads/pepperoni.jpg",
      sortOrder: 2,
      isPopular: true,
      hasExtras: true,
      hasSizes: true,
    },
    {
      categoryId: categories[4].id,
      name: "Four Cheese",
      nameAz: "Dörd Pendir",
      nameEn: "Four Cheese",
      nameRu: "Четыре сыра",
      nameTr: "Dört Peynirli",
      description: "Mozzarella, cheddar, parmesan, gorgonzola",
      price: 24.0,
      image: "/uploads/4cheese.jpg",
      sortOrder: 3,
      isPopular: false,
      hasExtras: true,
      hasSizes: true,
    },
    // Desserts
    {
      categoryId: categories[5].id,
      name: "Tiramisu",
      nameAz: "Tiramisu",
      nameEn: "Tiramisu",
      nameRu: "Тирамису",
      nameTr: "Tiramisu",
      description: "Classic Italian coffee dessert",
      price: 10.0,
      image: "/uploads/tiramisu.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: false,
      hasSizes: false,
    },
    {
      categoryId: categories[5].id,
      name: "Cheesecake",
      nameAz: "Pendirli Tort",
      nameEn: "Cheesecake",
      nameRu: "Чизкейк",
      nameTr: "Cheesecake",
      description: "New York style with strawberry sauce",
      price: 11.0,
      image: "/uploads/cheesecake.jpg",
      sortOrder: 2,
      isPopular: true,
      hasExtras: false,
      hasSizes: false,
    },
    // Drinks
    {
      categoryId: categories[6].id,
      name: "Fresh Lemonade",
      nameAz: "Təzə Limonad",
      nameEn: "Fresh Lemonade",
      nameRu: "Свежий лимонад",
      nameTr: "Taze Limonata",
      description: "Homemade lemonade with mint",
      price: 5.0,
      image: "/uploads/lemonade.jpg",
      sortOrder: 1,
      isPopular: true,
      hasExtras: false,
      hasSizes: true,
    },
    {
      categoryId: categories[6].id,
      name: "Mojito",
      nameAz: "Mojito",
      nameEn: "Mojito",
      nameRu: "Мохито",
      nameTr: "Mojito",
      description: "Classic mint mojito (non-alcoholic)",
      price: 7.0,
      image: "/uploads/mojito.jpg",
      sortOrder: 2,
      isPopular: true,
      hasExtras: false,
      hasSizes: true,
    },
    {
      categoryId: categories[6].id,
      name: "Turkish Coffee",
      nameAz: "Türk Qəhvəsi",
      nameEn: "Turkish Coffee",
      nameRu: "Турецкий кофе",
      nameTr: "Türk Kahvesi",
      description: "Traditional Turkish coffee",
      price: 4.0,
      image: "/uploads/turkish-coffee.jpg",
      sortOrder: 3,
      isPopular: false,
      hasExtras: false,
      hasSizes: false,
    },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({ data: { ...p, status: "active" } }),
    ),
  );
  console.log("🍕 Products created: 18 products");

  // ========== PRODUCT SIZES ==========
  const steak = products.find((p) => p.name === "Beef Steak");
  const classicBurger = products.find((p) => p.name === "Classic Burger");
  const margherita = products.find((p) => p.name === "Margherita");
  const pepperoni = products.find((p) => p.name === "Pepperoni");
  const fourCheese = products.find((p) => p.name === "Four Cheese");
  const lemonade = products.find((p) => p.name === "Fresh Lemonade");
  const mojito = products.find((p) => p.name === "Mojito");

  if (steak) {
    await prisma.productSize.createMany({
      data: [
        {
          productId: steak.id,
          name: "200g",
          nameAz: "200qr",
          nameEn: "200g",
          priceModifier: 0,
          isDefault: true,
        },
        {
          productId: steak.id,
          name: "300g",
          nameAz: "300qr",
          nameEn: "300g",
          priceModifier: 10,
          isDefault: false,
        },
        {
          productId: steak.id,
          name: "400g",
          nameAz: "400qr",
          nameEn: "400g",
          priceModifier: 18,
          isDefault: false,
        },
      ],
    });
  }

  if (classicBurger) {
    await prisma.productSize.createMany({
      data: [
        {
          productId: classicBurger.id,
          name: "Regular",
          nameAz: "Standart",
          nameEn: "Regular",
          priceModifier: 0,
          isDefault: true,
        },
        {
          productId: classicBurger.id,
          name: "Large",
          nameAz: "Böyük",
          nameEn: "Large",
          priceModifier: 4,
          isDefault: false,
        },
      ],
    });
  }

  for (const pizza of [margherita, pepperoni, fourCheese]) {
    if (pizza) {
      await prisma.productSize.createMany({
        data: [
          {
            productId: pizza.id,
            name: "Small (25cm)",
            nameAz: "Kiçik (25sm)",
            nameEn: "Small (25cm)",
            priceModifier: 0,
            isDefault: true,
          },
          {
            productId: pizza.id,
            name: "Medium (30cm)",
            nameAz: "Orta (30sm)",
            nameEn: "Medium (30cm)",
            priceModifier: 5,
            isDefault: false,
          },
          {
            productId: pizza.id,
            name: "Large (35cm)",
            nameAz: "Böyük (35sm)",
            nameEn: "Large (35cm)",
            priceModifier: 10,
            isDefault: false,
          },
        ],
      });
    }
  }

  for (const drink of [lemonade, mojito]) {
    if (drink) {
      await prisma.productSize.createMany({
        data: [
          {
            productId: drink.id,
            name: "300ml",
            nameAz: "300ml",
            nameEn: "300ml",
            priceModifier: 0,
            isDefault: true,
          },
          {
            productId: drink.id,
            name: "500ml",
            nameAz: "500ml",
            nameEn: "500ml",
            priceModifier: 2,
            isDefault: false,
          },
        ],
      });
    }
  }
  console.log("📏 Product sizes created");

  // ========== PRODUCT EXTRAS ==========
  const wings = products.find((p) => p.name === "Chicken Wings");
  const caesar = products.find((p) => p.name === "Caesar Salad");
  const salmon = products.find((p) => p.name === "Grilled Salmon");
  const doubleBurger = products.find((p) => p.name === "Double Cheeseburger");
  const chickenBurger = products.find((p) => p.name === "Chicken Burger");

  const extrasMap = [
    {
      product: wings,
      extras: [
        {
          name: "Extra Sauce",
          nameAz: "Əlavə Sous",
          nameEn: "Extra Sauce",
          price: 1.5,
        },
        {
          name: "Ranch Dip",
          nameAz: "Ranch Sous",
          nameEn: "Ranch Dip",
          price: 2.0,
        },
      ],
    },
    {
      product: caesar,
      extras: [
        {
          name: "Extra Chicken",
          nameAz: "Əlavə Toyuq",
          nameEn: "Extra Chicken",
          price: 4.0,
        },
        { name: "Avocado", nameAz: "Avokado", nameEn: "Avocado", price: 3.0 },
      ],
    },
    {
      product: salmon,
      extras: [
        {
          name: "Extra Vegetables",
          nameAz: "Əlavə Tərəvəz",
          nameEn: "Extra Vegetables",
          price: 3.5,
        },
        {
          name: "Garlic Butter",
          nameAz: "Sarımsaq Yağı",
          nameEn: "Garlic Butter",
          price: 2.0,
        },
      ],
    },
    {
      product: classicBurger,
      extras: [
        { name: "Bacon", nameAz: "Bekon", nameEn: "Bacon", price: 2.5 },
        {
          name: "Extra Cheese",
          nameAz: "Əlavə Pendir",
          nameEn: "Extra Cheese",
          price: 1.5,
        },
        {
          name: "Jalapeño",
          nameAz: "Jalapeño",
          nameEn: "Jalapeño",
          price: 1.0,
        },
        {
          name: "Fried Egg",
          nameAz: "Qızardılmış Yumurta",
          nameEn: "Fried Egg",
          price: 1.5,
        },
      ],
    },
    {
      product: doubleBurger,
      extras: [
        { name: "Bacon", nameAz: "Bekon", nameEn: "Bacon", price: 2.5 },
        {
          name: "Extra Cheese",
          nameAz: "Əlavə Pendir",
          nameEn: "Extra Cheese",
          price: 1.5,
        },
      ],
    },
    {
      product: chickenBurger,
      extras: [
        {
          name: "Extra Cheese",
          nameAz: "Əlavə Pendir",
          nameEn: "Extra Cheese",
          price: 1.5,
        },
        { name: "Bacon", nameAz: "Bekon", nameEn: "Bacon", price: 2.5 },
      ],
    },
    {
      product: margherita,
      extras: [
        {
          name: "Extra Cheese",
          nameAz: "Əlavə Pendir",
          nameEn: "Extra Cheese",
          price: 2.0,
        },
        {
          name: "Mushrooms",
          nameAz: "Göbələk",
          nameEn: "Mushrooms",
          price: 2.5,
        },
        { name: "Olives", nameAz: "Zeytun", nameEn: "Olives", price: 1.5 },
        {
          name: "Pepperoni",
          nameAz: "Pepperoni",
          nameEn: "Pepperoni",
          price: 3.0,
        },
      ],
    },
    {
      product: pepperoni,
      extras: [
        {
          name: "Extra Cheese",
          nameAz: "Əlavə Pendir",
          nameEn: "Extra Cheese",
          price: 2.0,
        },
        {
          name: "Mushrooms",
          nameAz: "Göbələk",
          nameEn: "Mushrooms",
          price: 2.5,
        },
        { name: "Olives", nameAz: "Zeytun", nameEn: "Olives", price: 1.5 },
      ],
    },
    {
      product: fourCheese,
      extras: [
        {
          name: "Mushrooms",
          nameAz: "Göbələk",
          nameEn: "Mushrooms",
          price: 2.5,
        },
        { name: "Olives", nameAz: "Zeytun", nameEn: "Olives", price: 1.5 },
      ],
    },
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
      {
        title: "Welcome Discount",
        titleAz: "Xoş Gəlmisiniz Endirimi",
        titleEn: "Welcome Discount",
        description: "Get 20% off your first order",
        descriptionAz: "İlk sifarişinizdən 20% endirim əldə edin",
        descriptionEn: "Get 20% off your first order",
        pointsRequired: 0,
        discountPercent: 20,
        status: "active",
      },
      {
        title: "Coffee Treat",
        titleAz: "Pulsuz Qəhvə",
        titleEn: "Coffee Treat",
        description: "Redeem for a free Turkish Coffee",
        descriptionAz: "Türk qəhvəsi üçün xal xərclə",
        descriptionEn: "Redeem for a free Turkish Coffee",
        pointsRequired: 100,
        discountAmount: 4,
        status: "active",
      },
      {
        title: "Birthday Special",
        titleAz: "Ad Günü Hədiyyəsi",
        titleEn: "Birthday Special",
        description: "15 AZN off on your birthday order",
        descriptionAz: "Ad günü sifarişindən 15 AZN endirim",
        descriptionEn: "15 AZN off on your birthday order",
        pointsRequired: 200,
        discountAmount: 15,
        status: "active",
      },
      {
        title: "Loyal Customer",
        titleAz: "Sadiq Müştəri",
        titleEn: "Loyal Customer",
        description: "10% off for our loyal customers",
        descriptionAz: "Sadiq müştərilər üçün 10% endirim",
        descriptionEn: "10% off for our loyal customers",
        pointsRequired: 500,
        discountPercent: 10,
        status: "active",
      },
    ],
  });
  console.log("🎁 Rewards created: 4 rewards");

  // ========== ORDERS (for Kitchen & Waiter panels) ==========
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
    createdAt: Date;
  };
  const orderData: OrderSeedItem[] = [
    // PENDING orders (Kitchen "New" tab)
    {
      tableId: tablesSahil[0].id,
      status: "pending",
      items: [
        {
          productId: products[10].id,
          quantity: 1,
          unitPrice: 18.0,
          totalPrice: 18.0,
        }, // Margherita
        {
          productId: products[15].id,
          quantity: 2,
          unitPrice: 5.0,
          totalPrice: 10.0,
        }, // Lemonade
      ],
      specialRequest: "Extra cheese on pizza please",
      createdAt: new Date(Date.now() - 5 * 60000),
    },
    {
      tableId: tablesSahil[1].id,
      status: "pending",
      items: [
        {
          productId: products[8].id,
          quantity: 2,
          unitPrice: 16.0,
          totalPrice: 32.0,
        }, // Classic Burger
        {
          productId: products[16].id,
          quantity: 1,
          unitPrice: 7.0,
          totalPrice: 7.0,
        }, // Mojito
      ],
      specialRequest: "No onions on burgers",
      createdAt: new Date(Date.now() - 3 * 60000),
    },
    {
      tableId: tablesSahil[2].id,
      status: "pending",
      items: [
        {
          productId: products[5].id,
          quantity: 1,
          unitPrice: 28.0,
          totalPrice: 28.0,
        }, // Salmon
        {
          productId: products[13].id,
          quantity: 1,
          unitPrice: 10.0,
          totalPrice: 10.0,
        }, // Tiramisu
      ],
      createdAt: new Date(Date.now() - 1 * 60000),
    },

    // PREPARING orders (Kitchen "Preparing" tab)
    {
      tableId: tablesSahil[3].id,
      status: "preparing",
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 14 * 60000), // started 14min ago, 6min left
      items: [
        { productId: products[9].id, quantity: 1, unitPrice: 22.0, totalPrice: 22.0 }, // Double Burger
        { productId: products[14].id, quantity: 1, unitPrice: 11.0, totalPrice: 11.0 }, // Cheesecake
      ],
      createdAt: new Date(Date.now() - 15 * 60000),
    },
    {
      tableId: tablesSahil[4].id,
      status: "preparing",
      estimatedTime: 15,
      preparationStartedAt: new Date(Date.now() - 16 * 60000), // started 16min ago → 1min overdue
      items: [
        { productId: products[11].id, quantity: 1, unitPrice: 15.0, totalPrice: 15.0 }, // Chicken Burger
        { productId: products[1].id, quantity: 1, unitPrice: 12.0, totalPrice: 12.0 }, // Wings
      ],
      specialRequest: "Wings extra crispy",
      createdAt: new Date(Date.now() - 18 * 60000),
    },
    {
      tableId: tablesSahil[5].id,
      status: "preparing",
      estimatedTime: 15,
      preparationStartedAt: new Date(Date.now() - 7 * 60000), // started 7min ago, 8min left
      items: [
        { productId: products[6].id, quantity: 1, unitPrice: 35.0, totalPrice: 35.0 }, // Steak
        { productId: products[3].id, quantity: 1, unitPrice: 14.0, totalPrice: 14.0 }, // Caesar
      ],
      createdAt: new Date(Date.now() - 8 * 60000),
    },

    // READY orders (Kitchen "Ready" tab + Waiter "Orders" tab)
    {
      tableId: tablesSahil[6].id,
      status: "ready",
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 24 * 60000),
      preparationCompletedAt: new Date(Date.now() - 5 * 60000),
      preparationDuration: 19, // 19min actual (1min early)
      delayMinutes: -1,
      items: [
        { productId: products[12].id, quantity: 1, unitPrice: 24.0, totalPrice: 24.0 }, // 4 Cheese
        { productId: products[16].id, quantity: 2, unitPrice: 7.0, totalPrice: 14.0 }, // Mojito
      ],
      createdAt: new Date(Date.now() - 25 * 60000),
    },
    {
      tableId: tablesSahil[7].id,
      status: "ready",
      estimatedTime: 15,
      preparationStartedAt: new Date(Date.now() - 19 * 60000),
      preparationCompletedAt: new Date(Date.now() - 4 * 60000),
      preparationDuration: 15, // exactly on time
      delayMinutes: 0,
      items: [
        { productId: products[7].id, quantity: 1, unitPrice: 18.0, totalPrice: 18.0 }, // Alfredo
        { productId: products[0].id, quantity: 1, unitPrice: 8.5, totalPrice: 8.5 }, // Bruschetta
      ],
      createdAt: new Date(Date.now() - 20 * 60000),
    },

    // SERVED orders (completed)
    {
      tableId: tablesNizami[0].id,
      status: "served",
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 58 * 60000),
      preparationCompletedAt: new Date(Date.now() - 40 * 60000),
      preparationDuration: 18,
      delayMinutes: -2,
      items: [
        { productId: products[10].id, quantity: 2, unitPrice: 18.0, totalPrice: 36.0 },
        { productId: products[15].id, quantity: 3, unitPrice: 5.0, totalPrice: 15.0 },
      ],
      createdAt: new Date(Date.now() - 60 * 60000),
    },
    {
      tableId: tablesNizami[1].id,
      status: "served",
      estimatedTime: 20,
      preparationStartedAt: new Date(Date.now() - 88 * 60000),
      preparationCompletedAt: new Date(Date.now() - 65 * 60000),
      preparationDuration: 23, // 3min late
      delayMinutes: 3,
      items: [
        { productId: products[6].id, quantity: 1, unitPrice: 35.0, totalPrice: 35.0 },
        { productId: products[3].id, quantity: 1, unitPrice: 14.0, totalPrice: 14.0 },
      ],
      createdAt: new Date(Date.now() - 90 * 60000),
    },
  ];

  for (const od of orderData) {
    const subtotal = od.items.reduce((s, i) => s + i.totalPrice, 0);
    const serviceFee = subtotal * 0.05;
    const total = subtotal + serviceFee;
    const orderNumber = String(Math.floor(10000 + Math.random() * 90000));

    await prisma.order.create({
      data: {
        orderNumber,
        tableId: od.tableId,
        branchId: branch1.id,
        subtotal,
        serviceFee,
        discount: 0,
        total,
        status: od.status as any,
        paymentMethod: "cash",
        paymentStatus: od.status === "served" ? "paid" : "pending",
        specialRequest: od.specialRequest || null,
        estimatedTime: od.estimatedTime ?? null,
        preparationStartedAt: od.preparationStartedAt ?? null,
        preparationCompletedAt: od.preparationCompletedAt ?? null,
        preparationDuration: od.preparationDuration ?? null,
        delayMinutes: od.delayMinutes ?? null,
        createdAt: od.createdAt,
        items: { create: od.items },
      },
    });
  }
  console.log(
    "🛒 Orders created: 10 orders (pending, preparing, ready, served)",
  );

  // ========== WAITER REQUESTS ==========
  await prisma.waiterRequest.createMany({
    data: [
      {
        tableId: tablesSahil[0].id,
        type: "call",
        status: "pending",
        message: null,
        createdAt: new Date(Date.now() - 2 * 60000),
      },
      {
        tableId: tablesSahil[2].id,
        type: "water",
        status: "pending",
        message: "Cold water please",
        createdAt: new Date(Date.now() - 1 * 60000),
      },
      {
        tableId: tablesSahil[4].id,
        type: "bill",
        status: "pending",
        message: null,
        createdAt: new Date(Date.now() - 5 * 60000),
      },
      {
        tableId: tablesSahil[6].id,
        type: "napkin",
        status: "accepted",
        message: null,
        createdAt: new Date(Date.now() - 10 * 60000),
      },
      {
        tableId: tablesSahil[1].id,
        type: "clean",
        status: "pending",
        message: "Spilled drink on table",
        createdAt: new Date(Date.now() - 3 * 60000),
      },
      {
        tableId: tablesNizami[0].id,
        type: "call",
        status: "done",
        message: null,
        createdAt: new Date(Date.now() - 30 * 60000),
      },
      {
        tableId: tablesNizami[2].id,
        type: "water",
        status: "pending",
        message: "Sparkling water",
        createdAt: new Date(Date.now() - 1 * 60000),
      },
    ],
  });
  console.log("🔔 Waiter requests created: 7 requests");

  // ========== SETTINGS ==========
  await prisma.settings.create({
    data: { id: "singleton", defaultPrepTime: 15 },
  });
  console.log("⚙️  Settings created: defaultPrepTime=15");

  console.log("\n✅ SEED COMPLETED SUCCESSFULLY!");
  console.log("\n📋 Login Credentials:");
  console.log("   Admin:    admin@foodzone.az / password123");
  console.log("   Manager:  manager@foodzone.az / password123");
  console.log("   Kitchen:  chef1@foodzone.az / password123");
  console.log("   Waiter:   waiter1@foodzone.az / password123");
  console.log("\n🍽️  Kitchen Panel: 3 pending + 3 preparing + 2 ready orders");
  console.log("🔔 Waiter Panel: 5 pending/accepted + 2 ready orders");
  console.log("📊 Admin Dashboard: 10 orders, stats ready");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
