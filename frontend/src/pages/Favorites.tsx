import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../assets/notifications';
import { API_URL } from '../config/api';

interface Game {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  platform: string;
  image: string;
  images?: string[];
  availability: string;
  region: string;
  category: string;
  isNew?: boolean;
}

const Favorites: React.FC = () => {
  const { state } = useAuth();
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Fetch all games from API
      const response = await fetch(`${API_URL}/products`);
      if (response.ok) {
        const games = await response.json();
        setAllGames(games);
        
        // Get favorite IDs from localStorage
        const savedFavorites = localStorage.getItem('favoriteGames');
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites);
          const favoriteGames = games.filter((game: Game) => favoriteIds.includes(game._id));
          setFavorites(favoriteGames);
        }
      } else {
        // Fallback to localStorage
        const savedGames = JSON.parse(localStorage.getItem('alpha_products') || '[]');
        setAllGames(savedGames);
        
        const savedFavorites = localStorage.getItem('favoriteGames');
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites);
          const games = savedGames.filter((game: Game) => favoriteIds.includes(game._id));
          setFavorites(games);
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Fallback to localStorage
      const savedGames = JSON.parse(localStorage.getItem('alpha_products') || '[]');
      const savedFavorites = localStorage.getItem('favoriteGames');
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites);
        const games = savedGames.filter((game: Game) => favoriteIds.includes(game._id));
        setFavorites(games);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = (gameId: string) => {
    const savedFavorites = localStorage.getItem('favoriteGames');
    if (savedFavorites) {
      const favoriteIds = JSON.parse(savedFavorites);
      const newFavorites = favoriteIds.filter((id: string) => id !== gameId);
      localStorage.setItem('favoriteGames', JSON.stringify(newFavorites));
      
      const games = allGames.filter((game: Game) => newFavorites.includes(game._id));
      setFavorites(games);
      
      showNotification('تم إزالة اللعبة من المفضلة', 'success');
    }
  };

  const addToCart = (game: Game) => {
    if (!state.isAuthenticated) {
      showNotification('يجب تسجيل الدخول أولاً!', 'error');
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(game);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    showNotification('تمت إضافة اللعبة للسلة بنجاح!', 'success');
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex items-center justify-center">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">يرجى تسجيل الدخول</h1>
            <p className="text-gray-400 mb-6">يجب تسجيل الدخول لعرض المفضلة</p>
            <Link to="/login" className="btn-primary inline-block">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
            ❤️ المفضلة
          </h1>
          <p className="text-gray-400 text-lg">المنتجات التي اخترتها</p>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="text-gray-400 mt-4">جاري التحميل...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">لا توجد منتجات في المفضلة</h3>
            <p className="text-gray-400 mb-6">لم تقم بإضافة أي منتجات للمفضلة بعد</p>
            <Link to="/" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              استكشف الألعاب
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {favorites.map((game) => (
              <div key={game._id} className="group">
                {/* Product Card - Same Design as Home */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700">
                  {/* Game Image Section */}
                  <div className="relative h-64 overflow-hidden">
                    {game.images && game.images.length > 0 ? (
                      <>
                        <img
                          src={game.images[0]}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent via-transparent to-transparent"></div>
                        
                        {/* Discount Badge */}
                        {game.discount && (
                          <div className="absolute top-3 right-3 z-30 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-xl border-2 border-red-600">
                            -{game.discount}%
                          </div>
                        )}
                        
                        {/* Heart Icon - Filled Red */}
                        <button className="absolute top-3 left-3 z-30 bg-red-500 p-2 rounded-full shadow-xl transform hover:scale-110 border-2 border-red-600">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="h-full bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-400 text-sm">لا توجد صور</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                      {game.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                    
                    {/* Platform & Region Badges */}
                    <div className="flex items-center space-x-2 mb-5">
                      <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-xs font-medium border border-gray-600">
                        🎮 {game.platform}
                      </span>
                      <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-xs font-medium border border-gray-600">
                        🌍 {game.region}
                      </span>
                    </div>
                    
                    {/* Price Section */}
                    <div className="flex items-end justify-between mb-5">
                      <div className="flex items-baseline space-x-2">
                        {game.originalPrice && (
                          <span className="text-gray-500 line-through text-lg">
                            ${game.originalPrice}
                          </span>
                        )}
                        <span className="text-green-400 font-bold text-3xl">
                          ${game.price}
                        </span>
                      </div>
                      
                      {game.discount && (
                        <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-lg text-xs font-medium border border-green-600/50">
                          Save {game.discount}%
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => removeFromFavorites(game._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
                      >
                        حذف
                      </button>
                      <button
                        onClick={() => addToCart(game)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                      >
                        أضف للسلة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
