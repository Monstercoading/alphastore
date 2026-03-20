import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDisplayName } from '../utils/nameFormatter';
import { gamesAPI } from '../services/api';
import { showNotification } from '../assets/notifications';
import { mockGames, Game } from '../data/mockGames';

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    platform: '',
    region: '',
    priceRange: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { state } = useAuth();

  // Get search query from URL
  const queryFromUrl = searchParams.get('query') || '';

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(savedFavorites.map((game: Game) => game._id));
  }, []);

  const addToCart = (game: Game) => {
    if (!state.isAuthenticated) {
      alert('يجب تسجيل الدخول أولاً!');
      return;
    }
    
    // Add to cart logic here
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(game);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
    
    alert('تمت إضافة اللعبة للسلة بنجاح!');
    
    // Navigate to cart page
    navigate('/cart');
  };

  const toggleFavorite = (game: Game) => {
    const favIds = [...favorites];
    const index = favIds.indexOf(game._id);
    
    if (index > -1) {
      favIds.splice(index, 1);
    } else {
      favIds.push(game._id);
    }
    
    setFavorites(favIds);
    localStorage.setItem('favorites', JSON.stringify(favIds.map(id => games.find(g => g._id === id)).filter(Boolean)));
  };

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await gamesAPI.getGames();
      if (response.data) {
        setGames(response.data);
      } else {
        setGames(mockGames);
      }
    } catch (error) {
      console.log('Using mock games due to API error');
      setGames(mockGames);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            {state.user ? (
              <span>أهلاً بك {formatDisplayName(state.user.firstName, state.user.lastName)}</span>
            ) : (
              <span>Alpha Store</span>
            )}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            {state.user ? 'مرحباً بك في Alpha Store! استكشف أفضل الألعاب والعروض الحصرية' : 'أفضل متجر لبيع مفاتيح الألعاب الأصلية بأسعار تنافسية'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!state.user && (
              <Link to="/register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform">
                إنشاء حساب
              </Link>
            )}
            <button
              onClick={() => {
                const productsSection = document.getElementById('products');
                productsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-semibold hover:bg-white/30 transition-colors border border-white/30"
            >
              استعرض الألعاب
            </button>
          </div>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-center shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <span className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm">جديد</span>
              <span className="text-white text-3xl font-bold mr-4">عروض حصرية</span>
            </div>
            <p className="text-white text-xl mb-2">خصم 20% على جميع مفاتيح Steam و Origin</p>
            <p className="text-yellow-300 font-semibold">لفترة محدودة - استخدم الكود: EN20</p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">🎮 منتجاتنا</h2>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white mt-4">جاري التحميل...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.isArray(games) && games.map((game) => (
                <div key={game._id} className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 border border-white/20">
                  {/* Game Image */}
                  <div className="relative h-48 overflow-hidden">
                    {game.images && game.images.length > 0 ? (
                      <img
                        src={game.images[0]}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{game.title.charAt(0)}</span>
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {game.discount && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{game.discount}%
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(game)}
                      className="absolute top-3 left-3 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <svg className={`w-5 h-5 ${favorites.includes(game._id) ? 'text-red-500 fill-current' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Game Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{game.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{game.platform}</span>
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">{game.region}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {game.discount ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through text-sm">${game.price}</span>
                            <span className="text-2xl font-bold text-white">${(game.price * (1 - game.discount / 100)).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-white">${game.price}</span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(game)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:scale-105 transition-transform text-sm"
                      >
                        أضف للسلة
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-md py-12 px-4 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Alpha Store</h3>
              <p className="text-gray-300">أفضل متجر لبيع مفاتيح الألعاب الأصلية</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">الرئيسية</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">الألعاب</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">العروض</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">اتصل بنا</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">سياسة الإرجاع</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">الشروط والأحكام</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">خصوصية</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">تابعنا</h4>
              <div className="flex space-x-reverse space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 Alpha Store. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
