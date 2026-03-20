// Alpha Store - Static Products Data
// This file contains hardcoded game data for temporary static hosting
// Edit this file manually to add/update products

export interface GameData {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  platform: string;
  region: string;
  images: string[];
  availability: 'available' | 'sold' | 'reserved';
  createdAt: string;
  updatedAt: string;
}

// Central static products array - accessible by all users
export const STATIC_PRODUCTS: GameData[] = [
  {
    _id: '1',
    title: 'Call of Duty: Modern Warfare III',
    description: 'لعبة أكشن وتصويب من منظور الشخص الأول - تضم طور قصة مثير ومتعدد اللاعبين',
    price: 59.99,
    originalPrice: 69.99,
    discount: 14,
    platform: 'PC',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    title: 'FIFA 2024',
    description: 'لعبة كرة القدم الأشهر عالمياً - حياة حقيقية للاعبين وملاعب',
    price: 49.99,
    originalPrice: 59.99,
    discount: 17,
    platform: 'PlayStation',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '3',
    title: 'Minecraft',
    description: 'لعبة بناء ومغامرات لا نهائية - عالم مفتوح وإبداعي',
    price: 29.99,
    platform: 'Xbox',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '4',
    title: 'Grand Theft Auto V',
    description: 'لوس سانتوس - عالم مفتوح، قصة مثيرة، متعدد اللاعبين',
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    platform: 'PC',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '5',
    title: 'Red Dead Redemption 2',
    description: 'مغامرة غرب أمريكي - قصة ملحمية وعالم مفتوح رائع',
    price: 39.99,
    originalPrice: 59.99,
    discount: 33,
    platform: 'PlayStation',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '6',
    title: 'Fortnite - V-Bucks 1000',
    description: '1000 فيبوكس - عملة اللعبة للشراء داخل المتجر',
    price: 7.99,
    platform: 'PC',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '7',
    title: 'EA Sports FC 24',
    description: 'لعبة كرة القدم الجديدة من EA - رخص رسمية وملاعب حقيقية',
    price: 44.99,
    originalPrice: 69.99,
    discount: 36,
    platform: 'Xbox',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    _id: '8',
    title: 'Valorant Points - 4750',
    description: '4750 نقطة فالورانت - عملة اللعبة للشراء داخل المتجر',
    price: 49.99,
    platform: 'PC',
    region: 'Global',
    images: [],
    availability: 'available',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

// Helper function to get all static products
export const getStaticProducts = (): GameData[] => {
  return [...STATIC_PRODUCTS];
};

// Helper function to get product by ID
export const getStaticProductById = (id: string): GameData | undefined => {
  return STATIC_PRODUCTS.find(product => product._id === id);
};

// Helper function to merge static data with localStorage data
// Priority: localStorage > static data
export const getMergedProducts = (): GameData[] => {
  try {
    const localData = localStorage.getItem('alpha_products');
    if (localData) {
      const parsedLocal = JSON.parse(localData);
      if (parsedLocal.length > 0) {
        return parsedLocal;
      }
    }
  } catch (error) {
    console.error('Error reading localStorage:', error);
  }
  return [...STATIC_PRODUCTS];
};

export default STATIC_PRODUCTS;
