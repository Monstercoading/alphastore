import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDisplayName } from '../utils/nameFormatter';
import { gamesAPI } from '../services/api';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { STATIC_PRODUCTS, getMergedProducts } from '../data/products-data';

// API URL constants for server connection
const API_URL = 'http://192.168.1.52:5000/api';
const UPLOADS_URL = 'http://192.168.1.52:5000';

interface Game {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  platform: string;
  region: string;
  images: string[];
  availability: string;
  isNew?: boolean;
}

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const { state } = useAuth();

  const searchQuery = searchParams.get('search') || '';
  const platformFromUrl = searchParams.get('platform') || '';
  const platforms = ['PC', 'Xbox', 'PlayStation', 'Mobile'];

  // Sync selectedPlatform with URL params
  useEffect(() => {
    setSelectedPlatform(platformFromUrl);
  }, [platformFromUrl]);

  useEffect(() => {
    fetchGames();
    loadFavorites();
    
    // Reload favorites when user changes
    const interval = setInterval(() => {
      const favoritesKey = getFavoritesKey();
      const savedFavorites = localStorage.getItem(favoritesKey);
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites);
        if (JSON.stringify(parsed) !== JSON.stringify(favorites)) {
          setFavorites(parsed);
        }
      }
    }, 1000);
    
    // Listen for storage changes from admin panel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'alpha_products') {
        fetchGames();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [state.user?.email]);

  const getFavoritesKey = () => {
    const userEmail = state.user?.email || 'guest';
    return `favoriteGames_${userEmail}`;
  };

  const loadFavorites = () => {
    const favoritesKey = getFavoritesKey();
    const savedFavorites = localStorage.getItem(favoritesKey);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    } else {
      setFavorites([]);
    }
  };

  // Calculate sales count for each game from completed orders
  const getSalesCount = (gameId: string): number => {
    const savedOrders = localStorage.getItem('alpha_orders');
    if (!savedOrders) return 0;
    
    try {
      const orders = JSON.parse(savedOrders);
      return orders.filter((order: any) => 
        order.status === 'completed' && 
        order.games.some((gameItem: any) => gameItem.game._id === gameId)
      ).length;
    } catch {
      return 0;
    }
  };

  const toggleFavorite = (gameId: string) => {
    // Check if user is logged in
    if (!state.isAuthenticated || !state.user) {
      showErrorToast('يجب تسجيل الدخول لإضافة الألعاب إلى المفضلة');
      return;
    }
    
    let newFavorites;
    if (favorites.includes(gameId)) {
      newFavorites = favorites.filter(id => id !== gameId);
      showSuccessToast('تم إزالة اللعبة من المفضلة');
    } else {
      newFavorites = [...favorites, gameId];
      showSuccessToast('تم إضافة اللعبة للمفضلة');
    }
    setFavorites(newFavorites);
    const favoritesKey = getFavoritesKey();
    localStorage.setItem(favoritesKey, JSON.stringify(newFavorites));
  };

  // Live filtering based on search and platform
  useEffect(() => {
    let result = [...games];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(game => 
        game.title.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.platform.toLowerCase().includes(query)
      );
    }
    
    // Apply platform filter
    if (selectedPlatform) {
      result = result.filter(game => game.platform === selectedPlatform);
    }
    
    setFilteredGames(result);
    
    // Smooth scroll to products ONLY when there are results
    if (result.length > 0 && productsRef.current) {
      // Scroll when search query exists
      if (searchQuery.trim()) {
        setTimeout(() => {
          productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      // Scroll when platform filter is selected/changed
      if (selectedPlatform) {
        setTimeout(() => {
          productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [searchQuery, selectedPlatform, games]);

  const fetchGames = async () => {
    try {
      // Try to get from localStorage first (admin updates)
      const savedGames = localStorage.getItem('alpha_products');
      if (savedGames) {
        const parsedGames = JSON.parse(savedGames);
        if (parsedGames.length > 0) {
          setGames(parsedGames);
          setFilteredGames(parsedGames);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to static data (shared across all users)
      const staticData = getMergedProducts();
      setGames(staticData);
      setFilteredGames(staticData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      // Final fallback to static data
      setGames(STATIC_PRODUCTS);
      setFilteredGames(STATIC_PRODUCTS);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Unified Hero Section with all content */}
      <div className="relative bg-gradient-to-r from-red-900 to-black overflow-hidden">
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        {/* Animated background with floating logos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating logo particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            >
              <img 
                src="/j.png" 
                alt="" 
                className="w-16 h-16 opacity-30 filter blur-sm"
                style={{
                  transform: `scale(${0.6 + Math.random() * 0.8})`,
                }}
              />
            </div>
          ))}
          
          {/* Rotating logo in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-20">
            <img src="/j.png" alt="" className="w-[600px] h-[600px]" />
          </div>
          
          {/* Pulsing glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-red-500 opacity-25 filter blur-[150px] animate-pulse-glow"></div>
          
          {/* Multiple glow layers */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-600 opacity-20 filter blur-[200px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-400 opacity-15 filter blur-[250px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
          
          {/* Original blur circles with enhanced animation */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animate-bounce-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse animate-float-up"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-pulse animate-float-down"></div>
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-2xl opacity-25 animate-float-up" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce-slow" style={{ animationDelay: '2.5s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-20">
          {/* Main Content */}
          <div className="text-center">
            {state.user ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                  أهلاً بك {formatDisplayName(state.user.firstName, state.user.lastName)}
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto drop-shadow-md">
                  مرحباً بك في Alpha Store! استكشف أفضل الألعاب والعروض الحصرية
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                  Alpha Store
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto drop-shadow-md">
                  أفضل متجر لبيع مفاتيح الألعاب الأصلية بأسعار تنافسية
                </p>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!state.user && (
                <Link
                  to="/register"
                  className="btn-primary text-lg px-8 py-4 drop-shadow-md border-2 border-red-500/50"
                >
                  إنشاء حساب
                </Link>
              )}
              <button
                onClick={() => {
                  const productsSection = document.getElementById('products-section');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gray-800 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors text-lg drop-shadow-md border-2 border-gray-600/50"
              >
                استعرض الألعاب
              </button>
            </div>
          </div>

          {/* Featured Banner */}
          <div className="mt-12 mb-12">
            <div className="card p-6 text-center bg-black/30 backdrop-blur-sm border border-red-500/30">
              <div className="flex items-center justify-center mb-4">
                <div className="badge-new drop-shadow-md">جديد</div>
                <span className="text-white text-2xl font-bold ml-3 drop-shadow-lg">عروض حصرية</span>
              </div>
              <p className="text-gray-300 text-lg drop-shadow-md">
                خصم 20% على جميع مفاتيح Steam و Origin
              </p>
              <p className="text-red-400 font-semibold mt-2 drop-shadow-md">
                لفترة محدودة - استخدم الكود: EN20
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div id="products-section" ref={productsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="relative mb-8 pb-4 overflow-visible">
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="absolute w-80 h-20 bg-red-500/10 rounded-full blur-3xl"></div>
            </div>
            <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 drop-shadow-2xl animate-pulse relative z-10 leading-relaxed" style={{ lineHeight: '1.6', paddingBottom: '10px' }}>
              منتجاتنا
            </h2>
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <h2 className="text-6xl font-bold text-red-500/5 blur-xl" style={{ lineHeight: '1.6', paddingBottom: '10px' }}>منتجاتنا</h2>
            </div>
          </div>
          <div className="flex items-center justify-center mb-12">
            <div className="flex-1 max-w-md">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            </div>
            <div className="px-8">
              <div className="w-24 h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/30"></div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            </div>
          </div>
          <p className="text-gray-300 text-xl font-medium">اكتشف أفضل الألعاب والعروض الحصرية</p>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-500/20 border-t-red-500 mb-6"></div>
            <p className="text-gray-400 text-xl font-medium">جاري التحميل...</p>
            <div className="flex justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <div key={game._id} className="group cursor-pointer bg-[#1a1d24] rounded-xl shadow-[0_0_15px_3px_rgba(255,0,0,0.25)] hover:shadow-[0_0_20px_4px_rgba(255,0,0,0.35)] transition-all duration-300 overflow-hidden flex flex-col h-full relative">
                  {/* Enhanced Red Aura Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 via-red-500/8 to-red-500/5 blur-sm -z-10"></div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/3 via-transparent to-red-500/3 blur-md -z-10"></div>
                {/* Top Section - Image Area */}
                <div className="relative h-48 overflow-hidden flex-shrink-0 z-0">
                  <div className="absolute inset-0 z-10 pointer-events-none"></div>
                  {game.images && game.images.length > 0 ? (
                    <img
                      src={game.images[0].startsWith('data:') ? game.images[0] : `${UPLOADS_URL}${game.images[0]}`}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ pointerEvents: 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Wishlist Icon */}
                  <button 
                    onClick={() => toggleFavorite(game._id)}
                    className="absolute top-3 left-3 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-20"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill={favorites.includes(game._id) ? "#ef4444" : "none"} 
                      stroke={favorites.includes(game._id) ? "#ef4444" : "white"} 
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 006.364 0L12 7.5l1.318-1.182a4.5 4.5 0 106.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 000-6.364z" />
                    </svg>
                  </button>
                  
                  {/* Discount Badge */}
                  {game.discount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-20">
                      -{game.discount}%
                    </div>
                  )}
                  
                  {/* Sales Count Badge */}
                  {(() => {
                    const salesCount = getSalesCount(game._id);
                    return salesCount > 0 && (
                      <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                        </svg>
                        تم البيع: {salesCount}
                      </div>
                    );
                  })()}
                  
                  {/* New Badge */}
                  {game.isNew && (
                    <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20">
                      جديد
                    </div>
                  )}
                </div>
                
                {/* Middle Section - Info */}
                <div className="p-4 flex-grow relative z-10 bg-[#1a1d24]">
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 leading-tight">
                    {game.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex gap-2 mb-4">
                    <span className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-lg text-xs font-medium border border-gray-600/30">
                      {game.platform}
                    </span>
                    <span className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-lg text-xs font-medium border border-gray-600/30">
                      {game.region}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                      game.availability === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      game.availability === 'sold' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {game.availability === 'available' ? 'متاح' :
                       game.availability === 'sold' ? 'تم البيع' : 'محجوز'}
                    </span>
                  </div>
                </div>
                
                {/* Bottom Section - Price & Action */}
                <div className="px-4 pb-4 mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-2xl font-bold">
                        ${game.price}
                      </span>
                      {game.originalPrice && (
                        <span className="text-gray-500 text-sm line-through">
                          ${game.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {game.discount && (
                      <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/30">
                        حفظ {game.discount}%
                      </div>
                    )}
                  </div>
                  
                  <Link
                    to={`/game/${game._id}`}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all duration-300 text-center block shadow-lg hover:shadow-red-500/25"
                  >
                    عرض التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-gray-700 mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : 'لا توجد منتجات'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ? 'جرب البحث بكلمة مختلفة أو تصفح جميع المنتجات' : 'لا توجد منتجات متاحة حالياً'}
            </p>
            {(searchQuery || selectedPlatform) && (
              <button 
                onClick={() => {
                  setSearchParams({});
                  setSelectedPlatform('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                إعادة تعيين البحث والفلاتر
              </button>
            )}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-gray-700 mb-4">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <p className="text-gray-400 text-xl mb-8 font-medium">لا توجد منتجات متاحة حالياً</p>
            <p className="text-gray-500 mb-8">قم بإنشاء حساب جديد لاستعراض المنتجات عند توفرها</p>
            <Link
              to="/register"
              className="btn-primary inline-block bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400/50 drop-shadow-md hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 px-8 py-3 font-semibold text-lg"
            >
              إنشاء حساب جديد
            </Link>
          </div>
        )}
      </div>

      {/* Social Media Icons - Bottom Right (Circular) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-8">
        <a 
          href="https://discord.gg/4pEx4HrpM3" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-12 flex items-center justify-center"
          title="Discord"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
          </svg>
        </a>
        <a 
          href="https://www.instagram.com/alpha_store.jo/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:-rotate-12 flex items-center justify-center"
          title="Instagram"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Alpha Store</h3>
              <p className="text-gray-400 text-sm">
                أفضل متجر لبيع مفاتيح الألعاب الأصلية
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">الرئيسية</Link></li>
                <li><Link to="/games" className="text-gray-400 hover:text-white text-sm transition-colors">المنتجات</Link></li>
                <li><Link to="/cart" className="text-gray-400 hover:text-white text-sm transition-colors">طلباتي</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2">
                <li><a href="https://discord.gg/4pEx4HrpM3" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">اتصل بنا</a></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">الشروط والأحكام</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">تابعنا</h3>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/alpha_store.jo/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/4pEx4HrpM3" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm mb-2">
              © 2026 Alpha Store. جميع الحقوق محفوظة.
            </p>
            <p className="text-gray-500 text-xs">
              تصميم وبرمجة <span className="text-red-400 font-medium">Monster</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
