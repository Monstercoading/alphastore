export interface Game {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  platform: string;
  image: string;
  images: string[];
  availability: string;
  region: string;
  isNew?: boolean;
}

export const mockGames: Game[] = [
  {
    _id: '1',
    title: 'Fortnite - Account Level 150+',
    description: 'حساب Fortnite بمستوى 150+ مع شخصيات نادرة و سكنات حصرية',
    price: 299.99,
    originalPrice: 399.99,
    discount: 25,
    category: 'battle-royale',
    platform: 'PC',
    image: 'https://cdn2.unrealengine.com/Fortnite%20Chapter%203%20Season%204%20-%20Paradise%20-%20KeyArt%20Landscape%20-%20Logo-1920x1080-4e3f3e5e3b7c.jpg',
    images: [
      'https://cdn2.unrealengine.com/Fortnite%20Chapter%203%20Season%204%20-%20Paradise%20-%20KeyArt%20Landscape%20-%20Logo-1920x1080-4e3f3e5e3b7c.jpg',
      'https://cdn2.unrealengine.com/fortnite-chapter-3-season-4-battle-pass-1920x1080-2c0741f3f3b2.jpg',
      'https://cdn2.unrealengine.com/fortnite-chapter-3-season-4-gameplay-1920x1080-1a2b3c4d5e6f.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: true
  },
  {
    _id: '2',
    title: 'PUBG Mobile - Conqueror Account',
    description: 'حساب PUBG Mobile رانك Conqueror مع كل الأسلحة والسكنات',
    price: 199.99,
    originalPrice: 349.99,
    discount: 43,
    category: 'battle-royale',
    platform: 'Mobile',
    image: 'https://wstatic-prod.pubg.com/web/live/main_e10c238/img/7feffd0.jpg',
    images: [
      'https://wstatic-prod.pubg.com/web/live/main_e10c238/img/7feffd0.jpg',
      'https://wstatic-prod.pubg.com/web/live/main_e10c238/img/8gfffe1.jpg',
      'https://wstatic-prod.pubg.com/web/live/main_e10c238/img/9hgggf2.jpg'
    ],
    availability: 'available',
    region: 'Middle East',
    isNew: false
  },
  {
    _id: '3',
    title: 'Call of Duty: Modern Warfare III',
    description: 'مفتاح لعبة COD MW3 الأصلي - Steam CD Key Global',
    price: 59.99,
    originalPrice: 69.99,
    discount: 14,
    category: 'fps',
    platform: 'PC',
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202308/1103/8c3ce14208bf41d1a013eaf34862433b3c6f47d99c78bd4f.png',
    images: [
      'https://image.api.playstation.com/vulcan/ap/rnd/202308/1103/8c3ce14208bf41d1a013eaf34862433b3c6f47d99c78bd4f.png',
      'https://image.api.playstation.com/vulcan/ap/rnd/202308/1103/mw3-screenshot-1.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202308/1103/mw3-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: true
  },
  {
    _id: '4',
    title: 'Grand Theft Auto V Premium Edition',
    description: 'GTA V Premium Edition - مفتاح Steam عالمي مع جميع DLCs',
    price: 24.99,
    originalPrice: 39.99,
    discount: 38,
    category: 'open-world',
    platform: 'PC',
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg',
    images: [
      'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg',
      'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/ss1.jpg',
      'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/ss2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '5',
    title: 'EA FC 24 - Ultimate Edition',
    description: 'EA Sports FC 24 Ultimate Edition - PC Origin/EA App Key',
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    category: 'sports',
    platform: 'PC',
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202307/2005/ea-fc-24-cover.jpg',
    images: [
      'https://image.api.playstation.com/vulcan/ap/rnd/202307/2005/ea-fc-24-cover.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202307/2005/ea-fc-24-gameplay-1.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202307/2005/ea-fc-24-gameplay-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: true
  },
  {
    _id: '6',
    title: 'Counter-Strike 2 - Prime Status',
    description: 'CS2 Prime Status Upgrade - Steam Key Global',
    price: 14.99,
    originalPrice: 19.99,
    discount: 25,
    category: 'fps',
    platform: 'PC',
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
    images: [
      'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
      'https://cdn.cloudflare.steamstatic.com/steam/apps/730/ss1.jpg',
      'https://cdn.cloudflare.steamstatic.com/steam/apps/730/ss2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '7',
    title: 'Minecraft: Java & Bedrock Edition',
    description: 'مفتاح ماينكرافت الأصلي - Java + Bedrock Edition',
    price: 29.99,
    originalPrice: 34.99,
    discount: 14,
    category: 'adventure',
    platform: 'PC',
    image: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_702x702.jpg',
    images: [
      'https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_702x702.jpg',
      'https://www.minecraft.net/content/dam/games/minecraft/screenshots/minecraft-screenshot-1.jpg',
      'https://www.minecraft.net/content/dam/games/minecraft/screenshots/minecraft-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '8',
    title: 'Valorant - VP Gift Card 11500',
    description: 'بطاقة شحن Valorant Points 11500 VP - تركيا',
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    category: 'fps',
    platform: 'PC',
    image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltb6530b271fddd0b1/valorant-gift-card.jpg',
    images: [
      'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltb6530b271fddd0b1/valorant-gift-card.jpg',
      'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/valorant-screenshot-1.jpg',
      'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/valorant-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Turkey',
    isNew: true
  },
  {
    _id: '9',
    title: 'League of Legends - RP 18520',
    description: 'بطاقة شحن League of Legends 18520 Riot Points',
    price: 109.99,
    originalPrice: 139.99,
    discount: 21,
    category: 'moba',
    platform: 'PC',
    image: 'https://cdn1.epicgames.com/offer/24b9b5e658bc4a7da0f0c5e8b5e8c5e8/LoL_KeyArt_2560x1440_2560x1440.jpg',
    images: [
      'https://cdn1.epicgames.com/offer/24b9b5e658bc4a7da0f0c5e8b5e8c5e8/LoL_KeyArt_2560x1440_2560x1440.jpg',
      'https://cdn1.epicgames.com/offer/24b9b5e658bc4a7da0f0c5e8b5e8c5e8/lol-screenshot-1.jpg',
      'https://cdn1.epicgames.com/offer/24b9b5e658bc4a7da0f0c5e8b5e8c5e8/lol-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '10',
    title: 'Steam Wallet Gift Card $100',
    description: 'بطاقة شحن Steam Wallet $100 - Global',
    price: 94.99,
    originalPrice: 100.00,
    discount: 5,
    category: 'gift-card',
    platform: 'PC',
    image: 'https://cdn.cloudflare.steamstatic.com/store/promo/summer2021/giftcard_648x324.jpg',
    images: [
      'https://cdn.cloudflare.steamstatic.com/store/promo/summer2021/giftcard_648x324.jpg',
      'https://cdn.cloudflare.steamstatic.com/store/promo/summer2021/giftcard_detail.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '11',
    title: 'Roblox - 10000 Robux',
    description: '10000 Robux - مفتاح شحن Roblox Global',
    price: 89.99,
    originalPrice: 109.99,
    discount: 18,
    category: 'adventure',
    platform: 'PC',
    image: 'https://images.rbxcdn.com/d66ae37d46e00a85ec5bf01a0696c384.jpg',
    images: [
      'https://images.rbxcdn.com/d66ae37d46e00a85ec5bf01a0696c384.jpg',
      'https://images.rbxcdn.com/roblox-screenshot-1.jpg',
      'https://images.rbxcdn.com/roblox-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: true
  },
  {
    _id: '12',
    title: 'Spider-Man 2 PS5',
    description: 'Marvel Spider-Man 2 - Digital Edition PS5 Key',
    price: 69.99,
    originalPrice: 89.99,
    discount: 22,
    category: 'action',
    platform: 'PlayStation',
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/8149a164954795f3f6a21c6e0b1b3e5d66e3e5d66e3.jpg',
    images: [
      'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/8149a164954795f3f6a21c6e0b1b3e5d66e3e5d66e3.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/spiderman2-screenshot-1.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/spiderman2-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: true
  },
  {
    _id: '13',
    title: 'God of War Ragnarök PS5',
    description: 'God of War Ragnarök - Digital Edition PS5 Key',
    price: 59.99,
    originalPrice: 79.99,
    discount: 25,
    category: 'action',
    platform: 'PlayStation',
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1219/8149a164954795f3f6a21c6e0b1b3e5d66e3e5d66e3.jpg',
    images: [
      'https://image.api.playstation.com/vulcan/ap/rnd/202207/1219/8149a164954795f3f6a21c6e0b1b3e5d66e3e5d66e3.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202207/1219/gow-ragnarok-screenshot-1.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202207/1219/gow-ragnarok-screenshot-2.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '14',
    title: 'Xbox Game Pass Ultimate 3 Months',
    description: 'اشتراك Xbox Game Pass Ultimate 3 أشهر - Global',
    price: 39.99,
    originalPrice: 49.99,
    discount: 20,
    category: 'subscription',
    platform: 'Xbox',
    image: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mJ7N',
    images: [
      'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mJ7N',
      'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/xbox-gamepass.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  },
  {
    _id: '15',
    title: 'PlayStation Plus Extra 12 Months',
    description: 'اشتراك PlayStation Plus Extra 12 شهر - أي منطقة',
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    category: 'subscription',
    platform: 'PlayStation',
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202301/1219/ps-plus-extra-keyart.jpg',
    images: [
      'https://image.api.playstation.com/vulcan/ap/rnd/202301/1219/ps-plus-extra-keyart.jpg',
      'https://image.api.playstation.com/vulcan/ap/rnd/202301/1219/ps-plus-games.jpg'
    ],
    availability: 'available',
    region: 'Global',
    isNew: false
  }
];
