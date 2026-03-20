import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDisplayName } from '../utils/nameFormatter';

interface Order {
  _id: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  games: Array<{
    game: {
      _id: string;
      title: string;
      platform: string;
      price: number;
    };
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const Navbar: React.FC = () => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load order count for current user
  useEffect(() => {
    const loadOrderCount = () => {
      if (state.user?.email) {
        const savedOrders = localStorage.getItem('alpha_orders');
        if (savedOrders) {
          const orders: Order[] = JSON.parse(savedOrders);
          const userOrders = orders.filter(order => order.user.email === state.user?.email);
          setOrderCount(userOrders.length);
        } else {
          setOrderCount(0);
        }
      } else {
        setOrderCount(0);
      }
    };

    loadOrderCount();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadOrderCount();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.user]);

  const handleProfileClick = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <nav className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-50 relative overflow-visible">
      {/* Subtle red aura background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/5 via-transparent to-red-900/5 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
      
      <div className="flex items-center justify-between px-5 py-3 h-16 relative">
        {/* Navigation & Profile - Will appear on FAR RIGHT with RTL */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <Link
            to="/"
            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            الرئيسية
          </Link>
          <Link
            to="/favorites"
            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            المفضلة
          </Link>
          <Link
            to="/cart"
            className="relative text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            طلباتي
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse">
                {orderCount}
              </span>
            )}
          </Link>
          
          {state.user ? (
            <>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                >
                  <span className="text-sm font-medium">
                    {formatDisplayName(state.user.firstName, state.user.lastName)}
                  </span>
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 ml-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      تعديل الحساب
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 ml-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
              
              {state.user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  لوحة التحكم
                </Link>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                تسجيل دخول
              </Link>
              <Link
                to="/register"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>

        {/* Search Bar + Filter - Center with flex-1 and max-width, margin auto */}
        <div className="flex-1 max-w-[500px] mx-auto">
          <div className="flex items-center gap-4 w-full">
            <form onSubmit={handleSearch} className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث عن منتج..."
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg py-2.5 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button 
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            
            {/* Filter Button - 15px gap */}
            <div className="relative flex-shrink-0" ref={filterRef}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">فلتر</span>
              </button>
              
              {/* Filter Dropdown - High z-index */}
              {showFilters && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e2229] border border-red-500/30 rounded-lg shadow-[0_0_20px_5px_rgba(255,0,0,0.3)] z-[100] p-3 max-h-[300px] overflow-y-auto">
                  {/* Platform Filter Title */}
                  <h3 className="text-gray-300 text-sm font-semibold mb-3 px-2">اختر المنصة</h3>
                  
                  {/* Platform Options */}
                  <div className="space-y-1">
                    {['PC', 'Xbox', 'PlayStation', 'Mobile'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          if (searchParams.get('platform') === platform) {
                            newParams.delete('platform');
                          } else {
                            newParams.set('platform', platform);
                          }
                          setSearchParams(newParams);
                          setShowFilters(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-right ${
                          searchParams.get('platform') === platform 
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                            : 'hover:bg-[#2a3039] text-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border ${
                          searchParams.get('platform') === platform 
                            ? 'bg-red-500 border-red-500' 
                            : 'border-gray-500'
                        }`}>
                          {searchParams.get('platform') === platform && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">{platform}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Clear Filter Button */}
                  {searchParams.get('platform') && (
                    <button
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('platform');
                        setSearchParams(newParams);
                        setShowFilters(false);
                      }}
                      className="w-full mt-3 pt-3 border-t border-gray-700 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      إلغاء الفلتر
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logo - Will appear on FAR LEFT with RTL (last element) */}
        <div className="flex-shrink-0 overflow-visible">
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="relative">
              <img 
                src="/j.png" 
                alt="Alpha Store" 
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105 animate-pulse"
              />
              <div className="absolute inset-0 bg-red-500/40 rounded-full filter blur-md animate-pulse -z-10 scale-150"></div>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">Alpha Store</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex-shrink-0">
          <button className="text-gray-300 hover:text-white p-2">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
