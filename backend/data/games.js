// بيانات الألعاب التجريبية
const games = [
  {
    _id: '1',
    title: 'Fortnite - Account Level 150',
    description: 'حساب Fortnite بمستوى 150 مع شخصيات نادرة',
    price: 299.99,
    originalPrice: 399.99,
    discount: 25,
    category: 'battle-royale',
    platform: 'PC',
    image: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Fortnite',
    images: [
      'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Fortnite+1',
      'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Fortnite+2'
    ],
    features: ['Skin Rare', 'Level 150', 'Victory Royale', 'Rare Items'],
    stock: 5,
    rating: 4.5,
    reviews: 12,
    seller: {
      name: 'Gaming Pro',
      rating: 4.8,
      verified: true
    },
    availability: 'available',
    region: 'Global'
  },
  {
    _id: '2',
    title: 'PUBG Mobile - Max Level Account',
    description: 'حساب PUBG Mobile بأعلى مستوى وكل الأسلحة',
    price: 199.99,
    originalPrice: 299.99,
    discount: 33,
    category: 'battle-royale',
    platform: 'Mobile',
    image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=PUBG',
    images: [
      'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=PUBG+1',
      'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=PUBG+2'
    ],
    features: ['Max Level', 'All Weapons', 'Rare Skins', 'High K/D'],
    stock: 3,
    rating: 4.7,
    reviews: 8,
    seller: {
      name: 'Mobile Master',
      rating: 4.9,
      verified: true
    },
    availability: 'available',
    region: 'Middle East'
  },
  {
    _id: '3',
    title: 'Call of Duty Warzone - Premium Account',
    description: 'حساب COD Warzone مع كل الباقات المميزة',
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    category: 'fps',
    platform: 'PC',
    image: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=COD',
    images: [
      'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=COD+1',
      'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=COD+2'
    ],
    features: ['Premium Pass', 'All Operators', 'High Stats', 'Legendary Weapons'],
    stock: 7,
    rating: 4.6,
    reviews: 15,
    seller: {
      name: 'FPS Expert',
      rating: 4.7,
      verified: true
    },
    availability: 'available',
    region: 'Europe'
  },
  {
    _id: '4',
    title: 'GTA V Online - Rich Account',
    description: 'حساب GTA V Online مع أموال غير محدودة',
    price: 89.99,
    originalPrice: 149.99,
    discount: 40,
    category: 'open-world',
    platform: 'Console',
    image: 'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=GTA',
    images: [
      'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=GTA+1',
      'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=GTA+2'
    ],
    features: ['Unlimited Money', 'All Cars', 'High Level', 'Properties'],
    stock: 10,
    rating: 4.4,
    reviews: 20,
    seller: {
      name: 'Car Dealer',
      rating: 4.6,
      verified: true
    },
    availability: 'available',
    region: 'USA'
  },
  {
    _id: '5',
    title: 'FIFA 24 - Ultimate Team Account',
    description: 'حساب FIFA 24 مع فريق Ultimate Team قوي',
    price: 119.99,
    originalPrice: 179.99,
    discount: 33,
    category: 'sports',
    platform: 'Console',
    image: 'https://via.placeholder.com/300x200/FFEAA7/000000?text=FIFA',
    images: [
      'https://via.placeholder.com/300x200/FFEAA7/000000?text=FIFA+1',
      'https://via.placeholder.com/300x200/FFEAA7/000000?text=FIFA+2'
    ],
    features: ['Ultimate Team', 'Rare Players', 'High Coins', 'Championship'],
    stock: 4,
    rating: 4.8,
    reviews: 6,
    seller: {
      name: 'Football Pro',
      rating: 4.9,
      verified: true
    },
    availability: 'available',
    region: 'Global'
  },
  {
    _id: '6',
    title: 'Minecraft - Premium Account',
    description: 'حساب Minecraft Premium مع عوالم مبنية',
    price: 49.99,
    originalPrice: 79.99,
    discount: 37,
    category: 'sandbox',
    platform: 'PC',
    image: 'https://via.placeholder.com/300x200/D63031/FFFFFF?text=Minecraft',
    images: [
      'https://via.placeholder.com/300x200/D63031/FFFFFF?text=Minecraft+1',
      'https://via.placeholder.com/300x200/D63031/FFFFFF?text=Minecraft+2'
    ],
    features: ['Premium Account', 'Built Worlds', 'Rare Items', 'Skins'],
    stock: 15,
    rating: 4.3,
    reviews: 18,
    seller: {
      name: 'Block Builder',
      rating: 4.5,
      verified: true
    },
    availability: 'available',
    region: 'Global'
  },
  {
    _id: '7',
    title: 'Valorant - High Rank Account',
    description: 'حساب Valorant برانك عالي مع شخصيات نادرة',
    price: 179.99,
    originalPrice: 249.99,
    discount: 28,
    category: 'fps',
    platform: 'PC',
    image: 'https://via.placeholder.com/300x200/6C5CE7/FFFFFF?text=Valorant',
    images: [
      'https://via.placeholder.com/300x200/6C5CE7/FFFFFF?text=Valorant+1',
      'https://via.placeholder.com/300x200/6C5CE7/FFFFFF?text=Valorant+2'
    ],
    features: ['High Rank', 'Rare Agents', 'Premium Skins', 'High Win Rate'],
    stock: 2,
    rating: 4.9,
    reviews: 4,
    seller: {
      name: 'Tactical Pro',
      rating: 5.0,
      verified: true
    },
    availability: 'available',
    region: 'Europe'
  },
  {
    _id: '8',
    title: 'Apex Legends - Champion Account',
    description: 'حساب Apex Legends مع كل الشخصيات والباقات',
    price: 139.99,
    originalPrice: 199.99,
    discount: 30,
    category: 'battle-royale',
    platform: 'PC',
    image: 'https://via.placeholder.com/300x200/A29BFE/FFFFFF?text=Apex',
    images: [
      'https://via.placeholder.com/300x200/A29BFE/FFFFFF?text=Apex+1',
      'https://via.placeholder.com/300x200/A29BFE/FFFFFF?text=Apex+2'
    ],
    features: ['All Legends', 'Champion Badge', 'Rare Skins', 'High Stats'],
    stock: 6,
    rating: 4.6,
    reviews: 10,
    seller: {
      name: 'Battle Pro',
      rating: 4.7,
      verified: true
    },
    availability: 'available',
    region: 'USA'
  }
];

module.exports = games;
