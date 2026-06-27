import type { Language } from '@/types';

const T = {
  az: {
    nav: {
      home: 'Ana Səhifə', search: 'Axtarış', restaurant: 'Restoran',
      orders: 'Sifarişlər', profile: 'Profil',
    },
    home: {
      searchPlaceholder: 'Yemək axtar…',
      popular: 'Populyar', newArrivals: 'Yeni Gələnlər', sets: 'Set Menyular',
      seeAll: 'Hamısı',
    },
    profile: {
      favorites: 'Seçilmişlər', orderHistory: 'Sifariş Tarixçəsi',
      addresses: 'Ünvanlarım', payments: 'Ödəniş üsulları',
      coupons: 'Kuponlarım', reviews: 'Rəylər', language: 'Dil seçimi',
      settings: 'Tənzimləmələr', help: 'Kömək', logout: 'Çıxış',
      orders: 'Sifariş', reviewCount: 'Rəy', points: 'Xal',
    },
    waiter: {
      title: 'Ofisiant Çağır', subtitle: 'Nə lazımdır?',
      sending: 'Göndərilir…', sent: 'Müraciət Göndərildi!',
      note: 'Ofisiant tezliklə yanınızda olacaq',
      sendBtn: 'Göndər', cancel: 'Ləğv et',
      notePlaceholder: 'Əlavə qeyd (isteğe bağlı)…',
      types: {
        call: 'Ofisiant', bill: 'Hesab', water: 'Su',
        napkin: 'Salfet', clean: 'Masa Silin', other: 'Digər',
      },
    },
    order: {
      success: 'Sifarişiniz Qəbul Edildi!',
      subSuccess: 'Mətbəx işə başladı',
      track: 'Sifarişi İzlə', backHome: 'Ana Səhifəyə',
      orderNo: 'Sifariş №', estimatedTime: 'Təxmini vaxt', minutes: 'dəq',
    },
    common: { back: 'Geri', close: 'Bağla', confirm: 'Təsdiq', all: 'Hamısı' },
  },
  en: {
    nav: {
      home: 'Home', search: 'Search', restaurant: 'Restaurant',
      orders: 'Orders', profile: 'Profile',
    },
    home: {
      searchPlaceholder: 'Search food…',
      popular: 'Popular', newArrivals: 'New Arrivals', sets: 'Set Menus',
      seeAll: 'See all',
    },
    profile: {
      favorites: 'Favorites', orderHistory: 'Order History',
      addresses: 'My Addresses', payments: 'Payment Methods',
      coupons: 'My Coupons', reviews: 'Reviews', language: 'Language',
      settings: 'Settings', help: 'Help', logout: 'Logout',
      orders: 'Orders', reviewCount: 'Reviews', points: 'Points',
    },
    waiter: {
      title: 'Call Waiter', subtitle: 'What do you need?',
      sending: 'Sending…', sent: 'Request Sent!',
      note: 'A waiter will be with you shortly',
      sendBtn: 'Send', cancel: 'Cancel',
      notePlaceholder: 'Additional note (optional)…',
      types: {
        call: 'Waiter', bill: 'Bill', water: 'Water',
        napkin: 'Napkin', clean: 'Clean Table', other: 'Other',
      },
    },
    order: {
      success: 'Order Placed!',
      subSuccess: 'The kitchen has started',
      track: 'Track Order', backHome: 'Back to Home',
      orderNo: 'Order #', estimatedTime: 'Estimated time', minutes: 'min',
    },
    common: { back: 'Back', close: 'Close', confirm: 'Confirm', all: 'All' },
  },
  ru: {
    nav: {
      home: 'Главная', search: 'Поиск', restaurant: 'Ресторан',
      orders: 'Заказы', profile: 'Профиль',
    },
    home: {
      searchPlaceholder: 'Поиск еды…',
      popular: 'Популярное', newArrivals: 'Новинки', sets: 'Сет-меню',
      seeAll: 'Все',
    },
    profile: {
      favorites: 'Избранное', orderHistory: 'История заказов',
      addresses: 'Мои адреса', payments: 'Способы оплаты',
      coupons: 'Мои купоны', reviews: 'Отзывы', language: 'Язык',
      settings: 'Настройки', help: 'Помощь', logout: 'Выход',
      orders: 'Заказов', reviewCount: 'Отзывов', points: 'Баллов',
    },
    waiter: {
      title: 'Вызвать официанта', subtitle: 'Что нужно?',
      sending: 'Отправка…', sent: 'Запрос отправлен!',
      note: 'Официант скоро подойдёт',
      sendBtn: 'Отправить', cancel: 'Отмена',
      notePlaceholder: 'Дополнительная заметка (необязательно)…',
      types: {
        call: 'Официант', bill: 'Счёт', water: 'Вода',
        napkin: 'Салфетки', clean: 'Убрать стол', other: 'Другое',
      },
    },
    order: {
      success: 'Заказ принят!',
      subSuccess: 'Кухня уже работает',
      track: 'Следить за заказом', backHome: 'На главную',
      orderNo: 'Заказ №', estimatedTime: 'Примерное время', minutes: 'мин',
    },
    common: { back: 'Назад', close: 'Закрыть', confirm: 'Подтвердить', all: 'Все' },
  },
  tr: {
    nav: {
      home: 'Ana Sayfa', search: 'Arama', restaurant: 'Restoran',
      orders: 'Siparişler', profile: 'Profil',
    },
    home: {
      searchPlaceholder: 'Yemek ara…',
      popular: 'Popüler', newArrivals: 'Yeni Gelenler', sets: 'Set Menüler',
      seeAll: 'Tümü',
    },
    profile: {
      favorites: 'Favoriler', orderHistory: 'Sipariş Geçmişi',
      addresses: 'Adreslerim', payments: 'Ödeme Yöntemleri',
      coupons: 'Kuponlarım', reviews: 'Yorumlar', language: 'Dil',
      settings: 'Ayarlar', help: 'Yardım', logout: 'Çıkış',
      orders: 'Sipariş', reviewCount: 'Yorum', points: 'Puan',
    },
    waiter: {
      title: 'Garson Çağır', subtitle: 'Ne lazım?',
      sending: 'Gönderiliyor…', sent: 'İstek Gönderildi!',
      note: 'Garson kısa sürede yanınızda olacak',
      sendBtn: 'Gönder', cancel: 'İptal',
      notePlaceholder: 'Ek not (isteğe bağlı)…',
      types: {
        call: 'Garson', bill: 'Hesap', water: 'Su',
        napkin: 'Peçete', clean: 'Masa Temizle', other: 'Diğer',
      },
    },
    order: {
      success: 'Siparişiniz Alındı!',
      subSuccess: 'Mutfak hazırlamaya başladı',
      track: 'Siparişi Takip Et', backHome: 'Ana Sayfaya',
      orderNo: 'Sipariş #', estimatedTime: 'Tahmini süre', minutes: 'dk',
    },
    common: { back: 'Geri', close: 'Kapat', confirm: 'Onayla', all: 'Tümü' },
  },
} satisfies Record<Language, object>;

export type Translations = typeof T.az;
export default T;
