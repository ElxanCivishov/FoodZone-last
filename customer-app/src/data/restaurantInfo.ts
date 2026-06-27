export const RESTAURANT_INFO = {
  name: 'FoodZone',
  tagline: 'Yapon Mətbəxi • Sushi • Ramen',
  about: 'FoodZone 2018-ci ildən Bakının ürəyindəki İçərişəhərdə fəaliyyət göstərir. Biz ənənəvi yapon mətbəxini müasir Azərbaycan damağına uyğun şəkildə təqdim edirik. Hər gün təzə hazırlanan sushi, ramen və sashimi ilə qonaqlarımıza unutulmaz təcrübə yaşadırıq.',
  founded: '2018',
  rating: 4.8,
  reviewCount: 247,
  tableCount: 24,
  phone: '+994 12 555 00 11',
  address: 'İçərişəhər, Bakı',
  coordinates: { lat: 40.3671, lng: 49.8378 },
  wifiNetworks: [
    { ssid: 'FoodZone_WiFi',  pass: 'foodzone2024', label: 'Əsas şəbəkə'    },
    { ssid: 'FoodZone_Guest', pass: 'guest1234',    label: 'Qonaq şəbəkəsi' },
    { ssid: 'FoodZone_Staff', pass: 'staff5678',    label: 'Personal'        },
  ],
  minOrder: 10,
  deliveryFee: 2,
  minTime: 15,
  maxTime: 25,
  hours: [
    { day: 'Bazar ertəsi',     time: '10:00 – 22:00', idx: 1 },
    { day: 'Çərşənbə axşamı', time: '10:00 – 22:00', idx: 2 },
    { day: 'Çərşənbə',        time: '10:00 – 22:00', idx: 3 },
    { day: 'Cümə axşamı',     time: '10:00 – 22:00', idx: 4 },
    { day: 'Cümə',            time: '10:00 – 22:00', idx: 5 },
    { day: 'Şənbə',           time: '11:00 – 23:00', idx: 6 },
    { day: 'Bazar',           time: '11:00 – 23:00', idx: 0 },
  ],
};

export const GALLERY_PREVIEW = [
  { grad: 'linear-gradient(135deg,#f093fb,#f5576c)', emoji: '🍣' },
  { grad: 'linear-gradient(135deg,#667eea,#764ba2)', emoji: '🏮' },
  { grad: 'linear-gradient(135deg,#4facfe,#00f2fe)', emoji: '🐟' },
  { grad: 'linear-gradient(135deg,#43e97b,#38f9d7)', emoji: '👨‍🍳' },
  { grad: 'linear-gradient(135deg,#fa709a,#fee140)', emoji: '🍜' },
  { grad: 'linear-gradient(135deg,#30cfd0,#667eea)', emoji: '✨' },
];
