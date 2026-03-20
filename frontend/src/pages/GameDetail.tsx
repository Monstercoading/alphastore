import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STATIC_PRODUCTS, getStaticProductById } from '../data/products-data';
import { API_URL, UPLOADS_URL } from '../config/api';

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
  accountDetails?: {
    username?: string;
    email?: string;
    additionalInfo?: string;
  };
}

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchGame();
    }
  }, [id]);

  const fetchGame = () => {
    try {
      setLoading(true);
      // Try to find game in localStorage first
      const savedGames = localStorage.getItem('alpha_products');
      let games: Game[] = [];
      
      if (savedGames) {
        games = JSON.parse(savedGames);
      }
      
      // If not found in localStorage, use static data
      if (games.length === 0) {
        games = [...STATIC_PRODUCTS];
      }
      
      const foundGame = games.find(g => g._id === id);
      if (foundGame) {
        setGame(foundGame);
      } else {
        // Try to find in static data directly
        const staticGame = getStaticProductById(id || '');
        if (staticGame) {
          setGame(staticGame as Game);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching game:', error);
      // Final fallback: try static data
      const staticGame = getStaticProductById(id || '');
      if (staticGame) {
        setGame(staticGame as Game);
      }
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!game) return;

    try {
      setOrdering(true);

      // Calculate final price with discount
      const finalPrice = game.discount
        ? game.price - (game.price * game.discount / 100)
        : game.price;

      // Create order object
      const order = {
        user: {
          email: state.user?.email || '',
          firstName: state.user?.firstName || '',
          lastName: state.user?.lastName || '',
        },
        games: [{
          game: {
            _id: game._id,
            title: game.title,
            platform: game.platform,
            price: game.price,
            images: game.images,
          },
          price: finalPrice,
        }],
        totalAmount: finalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      try {
        // Send order to server automatically
        const response = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        });

        if (!response.ok) {
          throw new Error('Failed to create order');
        }

        const createdOrder = await response.json();

        // Save to localStorage for backup
        const existingOrders = localStorage.getItem('alpha_orders');
        const orders = existingOrders ? JSON.parse(existingOrders) : [];
        orders.push(createdOrder);
        localStorage.setItem('alpha_orders', JSON.stringify(orders));

        // Also save to user-specific orders for quick access
        const userOrdersKey = `orders_${state.user?.email}`;
        const existingUserOrders = localStorage.getItem(userOrdersKey);
        const userOrders = existingUserOrders ? JSON.parse(existingUserOrders) : [];
        userOrders.push(createdOrder);
        localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));

        // Show success and redirect
        alert('تم إرسال الطلب بنجاح! سيتم مراجعته من قبل الإدارة.');
        navigate('/cart');
      } catch (apiError) {
        console.error('API Error:', apiError);
        alert('فشل إرسال الطلب للسيرفر. يرجى المحاولة مرة أخرى.');
        // Fallback to localStorage if API fails
        const existingOrders = localStorage.getItem('alpha_orders');
        const orders = existingOrders ? JSON.parse(existingOrders) : [];
        orders.push(order);
        localStorage.setItem('alpha_orders', JSON.stringify(orders));
        alert('تم حفظ الطلب محلياً. سيتم إرساله لاحقاً.');
        navigate('/cart');
      }
    } catch (error: any) {
      alert('فشل إنشاء الطلب');
      console.error('Order error:', error);
    } finally {
      setOrdering(false);
    }
  };

  const getImageUrl = (image: string) => {
    if (image.startsWith('data:')) {
      return image;
    }
    return `${UPLOADS_URL}${image}`;
  };

  const handleNextImage = () => {
    if (!game?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % game.images.length);
  };

  const handlePrevImage = () => {
    if (!game?.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + game.images.length) % game.images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const calculateDiscountedPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return price - (price * discount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-500/20 border-t-red-500 mb-6"></div>
            <p className="text-gray-400 text-xl font-medium">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-gray-700 mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">المنتج غير موجود</h1>
            <p className="text-gray-400 mb-6">لم يتم العثور على المنتج المطلوب</p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const discountedPrice = game.discount 
    ? calculateDiscountedPrice(game.price, game.discount)
    : game.price;

  const currentImage = game.images && game.images.length > 0 
    ? game.images[currentImageIndex] 
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Breadcrumbs */}
      <div className="bg-[#1a1d24] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              الرئيسية
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">ألعاب</span>
            <span className="text-gray-600">/</span>
            <span className="text-white font-medium truncate max-w-xs">{game.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للمتجر
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Image Carousel */}
            <div className="bg-[#1a1d24] rounded-xl border border-gray-800 overflow-hidden">
              <div className="relative h-96 group">
                {currentImage ? (
                  <>
                    <img
                      src={getImageUrl(currentImage)}
                      alt={game.title}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    
                    {/* Navigation Arrows */}
                    {game.images.length > 1 && (
                      <>
                        {/* Previous Button */}
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {/* Next Button */}
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Image Counter */}
                        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {game.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Discount Badge */}
                {game.discount && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                    خصم {game.discount}%
                  </div>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {game.images && game.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {game.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'border-red-500 ring-2 ring-red-500/30' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${game.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="bg-[#1a1d24] rounded-xl border border-gray-800 p-6">
              <h1 className="text-3xl font-bold text-white mb-4">{game.title}</h1>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm font-medium border border-gray-600/30">
                  {game.platform}
                </span>
                <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm font-medium border border-gray-600/30">
                  {game.region}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                  game.availability === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  game.availability === 'sold' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}>
                  {game.availability === 'available' ? 'متاح' :
                   game.availability === 'sold' ? 'تم البيع' : 'محجوز'}
                </span>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h2 className="text-xl font-semibold text-white mb-3">وصف المنتج</h2>
                <p className="text-gray-400 leading-relaxed">{game.description}</p>
              </div>
            </div>


            {/* Account Details */}
            {game.accountDetails && (
              <div className="bg-[#1a1d24] rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">تفاصيل الحساب</h2>
                <div className="space-y-3 text-sm">
                  {game.accountDetails.username && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">اسم المستخدم:</span>
                      <span className="text-white font-medium">{game.accountDetails.username}</span>
                    </div>
                  )}
                  {game.accountDetails.email && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-400">البريد الإلكتروني:</span>
                      <span className="text-white font-medium">{game.accountDetails.email}</span>
                    </div>
                  )}
                  {game.accountDetails.additionalInfo && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400">معلومات إضافية:</span>
                      <span className="text-white font-medium">{game.accountDetails.additionalInfo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Purchase Box */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1d24] rounded-xl border border-gray-800 p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-white mb-6">معلومات الشراء</h2>
              
              {/* Price */}
              <div className="mb-6">
                {game.discount ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 line-through text-xl">${game.originalPrice?.toFixed(2) || (game.price * (1 + game.discount/100)).toFixed(2)}</span>
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">-{game.discount}%</span>
                    </div>
                    <span className="text-4xl font-bold text-green-400">${discountedPrice.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold text-green-400">${game.price.toFixed(2)}</span>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-3 text-gray-400">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>تسليم فوري</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>ضمان 100%</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>دعم فني 24/7</span>
                </div>
              </div>

              {/* Purchase Button */}
              {state.isAuthenticated ? (
                game.availability === 'available' ? (
                  <button
                    onClick={handleOrder}
                    disabled={ordering}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ordering ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        جاري الطلب...
                      </span>
                    ) : (
                      'شراء الآن'
                    )}
                  </button>
                ) : (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-4 rounded-lg text-center font-medium">
                    هذا المنتج غير متاح حالياً
                  </div>
                )
              ) : (
                <Link
                  to="/login"
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition-all duration-300 text-center"
                >
                  تسجيل الدخول للشراء
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
