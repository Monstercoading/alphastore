import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI } from '../services/api';
import Loading from '../components/Loading';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import { formatMixedNameWithClasses } from '../utils/nameFormatter';

interface Game {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  platform: string;
  image: string;
  images?: string[];
  features?: string[];
  stock: number;
  rating: number;
  reviews: number;
  seller: {
    name: string;
    rating: number;
    verified: boolean;
  };
}

const SearchGames: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const { navigateWithDelay } = useNavigationWithDelay();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchPlatforms();
    fetchGames();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGames();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, category, platform, minPrice, maxPrice, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/games/categories/list');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/games/platforms/list');
      const data = await response.json();
      if (data.success) {
        setPlatforms(data.data);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('category', category);
      if (platform) params.append('platform', platform);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`http://localhost:5000/api/games?${params}`);
      const data = await response.json();
      if (data.success) {
        setGames(data.data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = (gameId: string) => {
    navigateWithDelay(`/game/${gameId}`, 1000);
  };

  const getDiscountPercentage = (originalPrice: number, currentPrice: number) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  return (
    <>
      {loading && <Loading />}
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">البحث عن الألعاب</h1>
            <p className="text-gray-400">ابحث عن حسابات الألعاب التي تريدها</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="ابحث عن لعبة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-gray-300 mb-2">الفئة</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">المنصة</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">جميع المنصات</option>
                  {platforms.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">السعر الأدنى</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">السعر الأعلى</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-gray-300 mb-2">الترتيب حسب</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">الترتيب الافتراضي</option>
                <option value="price-low">السعر: من الأقل إلى الأعلى</option>
                <option value="price-high">السعر: من الأعلى إلى الأقل</option>
                <option value="rating">التقييم: الأعلى أولاً</option>
                <option value="name">الاسم: أ-ي</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-gray-400">
              تم العثور على {games.length} لعبة
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <div
                key={game._id}
                onClick={() => handleGameClick(game._id)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-48 object-cover"
                  />
                  {game.discount && game.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm">
                      خصم {game.discount}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      {game.originalPrice && game.originalPrice > game.price && (
                        <span className="text-gray-400 line-through text-sm ml-2">
                          ${game.originalPrice}
                        </span>
                      )}
                      <span className="text-red-500 font-bold text-lg">
                        ${game.price}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-gray-300 text-sm ml-1">
                        {game.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">
                      {game.platform}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {game.stock} متوفر
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {games.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-xl mb-4">
                لم يتم العثور على ألعاب
              </div>
              <p className="text-gray-500">
                جرب تغيير معايير البحث أو الفلاتر
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchGames;
