import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gamesAPI, ordersAPI } from '../services/api';
import { conversationAPI, Conversation } from '../services/conversationAPI';
import { discountCodeAPI, DiscountCode } from '../services/discountCodeAPI';
import { playNotificationSound, playMessageSound } from '../utils/notificationSound';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { STATIC_PRODUCTS } from '../data/products-data';
import { API_URL } from '../config/api';
import { socketService } from '../services/socketService';

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
  createdAt: string;
  updatedAt: string;
}

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
  status: 'pending' | 'completed' | 'cancelled' | 'sent';
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState<'games' | 'orders' | 'messages' | 'discounts'>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAddGameForm, setShowAddGameForm] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [lastKnownOrderCount, setLastKnownOrderCount] = useState(0);
  const [newOrdersAlert, setNewOrdersAlert] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  const [gameForm, setGameForm] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    platform: 'PC',
    region: 'Global',
    availability: 'available',
    images: [] as string[]
  });

  const [discountForm, setDiscountForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minimumAmount: '',
    maxDiscountAmount: '',
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    usageLimit: '',
    userUsageLimit: '1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Load games and orders from localStorage on mount
  useEffect(() => {
    const savedGames = localStorage.getItem('alpha_products');
    const savedOrders = localStorage.getItem('alpha_orders');
    
    if (savedGames) {
      try {
        const parsedGames = JSON.parse(savedGames);
        if (parsedGames.length > 0) {
          setGames(parsedGames);
        } else {
          setGames([...STATIC_PRODUCTS]);
        }
      } catch (e) {
        setGames([...STATIC_PRODUCTS]);
      }
    } else {
      setGames([...STATIC_PRODUCTS]);
      localStorage.setItem('alpha_products', JSON.stringify(STATIC_PRODUCTS));
    }

    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        setOrders([]);
      }
    }

    // Listen for storage changes (new orders from other tabs/users)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'alpha_orders') {
        const newOrders = localStorage.getItem('alpha_orders');
        if (newOrders) {
          try {
            setOrders(JSON.parse(newOrders));
          } catch (err) {
            console.error('Error parsing orders:', err);
          }
        }
      }
      if (e.key === 'alpha_products') {
        const newGames = localStorage.getItem('alpha_products');
        if (newGames) {
          try {
            setGames(JSON.parse(newGames));
          } catch (err) {
            console.error('Error parsing games:', err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Polling for cross-browser sync (checks every 2 seconds)
    const pollInterval = setInterval(() => {
      const currentOrders = localStorage.getItem('alpha_orders');
      if (currentOrders) {
        try {
          const parsedOrders = JSON.parse(currentOrders);
          setOrders(prevOrders => {
            // Only update if different
            if (JSON.stringify(prevOrders) !== JSON.stringify(parsedOrders)) {
              return parsedOrders;
            }
            return prevOrders;
          });
        } catch (err) {
          console.error('Error polling orders:', err);
        }
      }
      
      const currentGames = localStorage.getItem('alpha_products');
      if (currentGames) {
        try {
          const parsedGames = JSON.parse(currentGames);
          setGames(prevGames => {
            // Only update if different
            if (JSON.stringify(prevGames) !== JSON.stringify(parsedGames)) {
              return parsedGames;
            }
            return prevGames;
          });
        } catch (err) {
          console.error('Error polling games:', err);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Polling for new orders and alerts
  useEffect(() => {
    if (activeTab !== 'orders') return;

    const pollForNewOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/orders`);
        if (response.ok) {
          const serverOrders = await response.json();
          const currentOrderCount = serverOrders.length;
          
          // Check for new orders
          if (currentOrderCount > lastKnownOrderCount) {
            const newOrders = serverOrders.slice(0, currentOrderCount - lastKnownOrderCount);
            const alerts = newOrders.map((order: Order) => 
              `طلب جديد من ${order.user.firstName} ${order.user.lastName}!`
            );
            
            setNewOrdersAlert(prev => [...prev, ...alerts]);
            setLastKnownOrderCount(currentOrderCount);
            
            // Play notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZgjMGHmO8+G');
            audio.play().catch(() => {});
            
            // Show popup
            alerts.forEach((alert: string) => {
              setTimeout(() => {
                const popup = document.createElement('div');
                popup.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 animate-pulse';
                popup.innerHTML = `
                  <div class="flex items-center gap-3">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                    </svg>
                    <span class="font-bold">${alert}</span>
                  </div>
                `;
                document.body.appendChild(popup);
                
                setTimeout(() => {
                  popup.remove();
                }, 5000);
              }, alerts.indexOf(alert) * 1000);
            });
          }
          
          setOrders(serverOrders);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial load
    pollForNewOrders();
    
    // Set up polling every 20 seconds
    const pollInterval = setInterval(pollForNewOrders, 20000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [activeTab, lastKnownOrderCount]);

  // Load discount codes and available games
  useEffect(() => {
    if (state.isAuthenticated && state.user?.role === 'admin') {
      loadDiscountCodes();
      loadAvailableGames();
    }
  }, [state.isAuthenticated]);

  // Load conversations when messages tab is active
  useEffect(() => {
    console.log('Messages tab effect:', {
      isAuthenticated: state.isAuthenticated,
      userRole: state.user?.role,
      activeTab
    });
    
    if (state.isAuthenticated && state.user?.role === 'admin' && activeTab === 'messages') {
      console.log('Starting conversation polling...');
      loadConversations();
      
      // Connect to Socket.io for real-time updates
      socketService.connect();
      
      // Listen for new conversation messages
      socketService.onNewConversationMessage((data) => {
        console.log('New conversation message received:', data);
        loadConversations(); // Refresh conversations
        playMessageSound();
      });
      
      // Set up polling for new conversations every 10 seconds (backup)
      const pollInterval = setInterval(() => {
        console.log('Polling conversations...');
        loadConversations();
      }, 10000);

      return () => {
        console.log('Cleaning up conversation polling');
        clearInterval(pollInterval);
        socketService.off('newConversationMessage');
      };
    }
  }, [state.isAuthenticated, activeTab]);

  const loadDiscountCodes = async () => {
    try {
      const codes = await discountCodeAPI.getDiscountCodes();
      setDiscountCodes(codes);
    } catch (error) {
      console.error('Error loading discount codes:', error);
    }
  };

  const loadAvailableGames = async () => {
    try {
      const games = await discountCodeAPI.getAvailableProducts();
      setAvailableGames(games);
    } catch (error) {
      console.error('Error loading available games:', error);
    }
  };

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      console.log('Current user state:', state);
      console.log('Token in localStorage:', localStorage.getItem('token'));
      
      const convs = await conversationAPI.getAdminConversations();
      console.log('Conversations loaded:', convs);
      
      setConversations(convs);
      
      // Calculate unread messages
      const unread = convs.reduce((total: number, conv: any) => total + (conv.unreadByAdmin || 0), 0);
      setUnreadMessages(unread);
      
      console.log('Unread messages:', unread);
      
      // Remove success toast to stop spamming
      // showSuccessToast('تم تحديث المحادثات');
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Handle 401 errors - token expired or invalid
      if (error.response?.status === 401) {
        console.log('Token expired/invalid in loadConversations:', error.response.data);
        console.log('Current token:', localStorage.getItem('token'));
        console.log('Current user:', localStorage.getItem('user'));
        
        // Temporarily disable auto-logout to debug
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // window.location.href = '/login';
        
        // Just show error message for now
        showErrorToast('Token expired or invalid - please check console');
        return;
      }
      
      let errorMessage = 'فشل تحميل المحادثات';
      if (error.response?.data?.error || error.response?.data?.message) {
        errorMessage = error.response.data.error || error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(errorMessage);
    }
  };

  const handleSaveDiscount = async () => {
    try {
      // Validation
      if (!discountForm.code.trim()) {
        showErrorToast('يرجى إدخال كود الخصم');
        return;
      }
      if (!discountForm.description.trim()) {
        showErrorToast('يرجى إدخال وصف الخصم');
        return;
      }
      if (!discountForm.discountValue || parseFloat(discountForm.discountValue) <= 0) {
        showErrorToast('يرجى إدخال قيمة خصم صحيحة');
        return;
      }

      const discountData = {
        code: discountForm.code.trim().toUpperCase(),
        description: discountForm.description.trim(),
        discountType: discountForm.discountType,
        discountValue: parseFloat(discountForm.discountValue),
        minimumAmount: discountForm.minimumAmount ? parseFloat(discountForm.minimumAmount) : 0,
        maxDiscountAmount: discountForm.maxDiscountAmount ? parseFloat(discountForm.maxDiscountAmount) : undefined,
        applicableProducts: discountForm.applicableProducts.length > 0 ? discountForm.applicableProducts : undefined,
        applicableCategories: discountForm.applicableCategories.length > 0 ? discountForm.applicableCategories : undefined,
        usageLimit: discountForm.usageLimit ? parseInt(discountForm.usageLimit) : undefined,
        userUsageLimit: parseInt(discountForm.userUsageLimit) || 1,
        startDate: discountForm.startDate,
        endDate: discountForm.endDate
      };

      if (editingDiscount) {
        await discountCodeAPI.updateDiscountCode(editingDiscount._id, discountData);
        showSuccessToast('تم تحديث كود الخصم بنجاح');
      } else {
        await discountCodeAPI.createDiscountCode(discountData);
        showSuccessToast('تم إضافة كود الخصم بنجاح');
      }

      setShowDiscountForm(false);
      setEditingDiscount(null);
      resetDiscountForm();
      loadDiscountCodes();
    } catch (error: any) {
      console.error('Error saving discount code:', error);
      const errorMessage = error.response?.data?.error || error.message || 'فشل حفظ كود الخصم';
      showErrorToast(errorMessage);
    }
  };

  const handleEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setDiscountForm({
      code: discount.code,
      description: discount.description,
      discountType: discount.discountType,
      discountValue: discount.discountValue.toString(),
      minimumAmount: discount.minimumAmount.toString(),
      maxDiscountAmount: discount.maxDiscountAmount?.toString() || '',
      applicableProducts: discount.applicableProducts.map((p: any) => p._id),
      applicableCategories: discount.applicableCategories,
      usageLimit: discount.usageLimit?.toString() || '',
      userUsageLimit: discount.userUsageLimit.toString(),
      startDate: new Date(discount.startDate).toISOString().split('T')[0],
      endDate: new Date(discount.endDate).toISOString().split('T')[0]
    });
    setShowDiscountForm(true);
  };

  const handleDeleteDiscount = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكود؟')) {
      try {
        await discountCodeAPI.deleteDiscountCode(id);
        showSuccessToast('تم حذف كود الخصم بنجاح');
        loadDiscountCodes();
      } catch (error) {
        console.error('Error deleting discount code:', error);
        showErrorToast('فشل حذف كود الخصم');
      }
    }
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumAmount: '',
      maxDiscountAmount: '',
      applicableProducts: [],
      applicableCategories: [],
      usageLimit: '',
      userUsageLimit: '1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  // Save games to alpha_products in localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    try {
      const gamesJson = JSON.stringify(games);
      // Check if data exceeds localStorage quota (~5MB)
      if (gamesJson.length > 5 * 1024 * 1024) {
        alert('تنبيه: حجم البيانات كبير جداً. يرجى تقليل حجم الصور أو حذف بعض الألعاب.');
        return;
      }
      localStorage.setItem('alpha_products', gamesJson);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('خطأ: تم تجاوز حجم التخزين المسموح. يرجى حذف بعض الصور أو الألعاب القديمة.');
      } else {
        console.error('Error saving games:', error);
      }
    }
  }, [games]);

  // Save orders to alpha_orders in localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alpha_orders', JSON.stringify(orders));
  }, [orders]);

  const resetGameForm = () => {
    setGameForm({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      discount: '',
      platform: 'PC',
      region: 'Global',
      availability: 'available',
      images: []
    });
  };

  // Compress and resize multiple images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check total images limit (max 5)
    if (gameForm.images.length + files.length > 5) {
      alert('يمكنك رفع 5 صور كحد أقصى.');
      return;
    }
    
    files.forEach(file => {
      // Check file size (max 1MB per image)
      if (file.size > 1024 * 1024) {
        alert(`الصورة ${file.name} كبيرة جداً. الحد الأقصى 1MB.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Max dimensions 500x500 for better quality
          const maxSize = 500;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          setGameForm(prev => ({
            ...prev,
            images: [...prev.images, compressedDataUrl]
          }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setGameForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const gameData = {
      title: gameForm.title,
      description: gameForm.description,
      price: parseFloat(gameForm.price),
      originalPrice: gameForm.originalPrice ? parseFloat(gameForm.originalPrice) : undefined,
      discount: gameForm.discount ? parseInt(gameForm.discount) : undefined,
      platform: gameForm.platform,
      region: gameForm.region,
      availability: gameForm.availability,
      images: gameForm.images,
    };

    try {
      let response;
      if (editingGame) {
        // Update existing game
        response = await fetch(`${API_URL}/products/${editingGame._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData),
        });
      } else {
        // Create new game
        response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save game');
      }

      const savedGame = await response.json();

      if (editingGame) {
        setGames(prev => prev.map(g => g._id === editingGame._id ? savedGame : g));
      } else {
        setGames(prev => [...prev, savedGame]);
      }

      setShowAddGameForm(false);
      setEditingGame(null);
      resetGameForm();
      
      alert(editingGame ? 'تم تحديث اللعبة بنجاح!' : 'تم إضافة اللعبة بنجاح!');
    } catch (error) {
      console.error('Error saving game:', error);
      alert('فشل حفظ اللعبة. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setGameForm({
      title: game.title,
      description: game.description,
      price: game.price.toString(),
      originalPrice: game.originalPrice?.toString() || '',
      discount: game.discount?.toString() || '',
      platform: game.platform,
      region: game.region,
      availability: game.availability,
      images: game.images || []
    });
    setShowAddGameForm(true);
  };

  const handleDeleteGame = (gameId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
      setGames(prev => prev.filter(g => g._id !== gameId));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      
      // Update local state
      setOrders(prev => {
        const updatedOrders = prev.map(o => o._id === orderId ? updatedOrder : o);
        localStorage.setItem('alpha_orders', JSON.stringify(updatedOrders));
        return updatedOrders;
      });

      alert(`تم تحديث حالة الطلب إلى: ${status === 'sent' ? 'تم الإرسال' : status}`);
    } catch (error) {
      console.error('Status update error:', error);
      alert('فشل تحديث حالة الطلب');
    }
  };

  const calculateDiscountedPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return price - (price * discount / 100);
  };

  if (!state.isAuthenticated || state.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">الوصول مرفوض</h1>
            <p className="text-gray-400">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-red-500">لوحة تحكم Alpha Store</h1>
        
        <div className="bg-[#1a1d24] rounded-lg shadow border border-gray-800">
          {/* Tabs */}
          <div className="border-b border-gray-800">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('games')}
                className={`py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'games'
                    ? 'border-b-2 border-red-500 text-red-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                إدارة الألعاب
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-red-500 text-red-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                إدارة الطلبات
              </button>
              <button
                onClick={() => setActiveTab('discounts')}
                className={`py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'discounts'
                    ? 'border-b-2 border-red-500 text-red-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                أكواد الخصم
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-4 px-6 text-sm font-medium transition-colors relative ${
                  activeTab === 'messages'
                    ? 'border-b-2 border-red-500 text-red-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                رسائل الزبائن
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">إدارة الألعاب</h2>
                <button
                  onClick={() => {
                    setEditingGame(null);
                    resetGameForm();
                    setShowAddGameForm(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إضافة لعبة جديدة
                </button>
              </div>

              {/* Add/Edit Game Form */}
              {showAddGameForm && (
                <div className="bg-[#0a0a0a] p-6 rounded-lg mb-6 border border-gray-800">
                  <h3 className="text-lg font-medium mb-4 text-red-500">
                    {editingGame ? 'تعديل لعبة' : 'إضافة لعبة جديدة'}
                  </h3>
                  <form onSubmit={handleGameSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">العنوان</label>
                        <input
                          type="text"
                          value={gameForm.title}
                          onChange={(e) => setGameForm({...gameForm, title: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">المنصة</label>
                        <select
                          value={gameForm.platform}
                          onChange={(e) => setGameForm({...gameForm, platform: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                        >
                          <option value="PC">PC</option>
                          <option value="PlayStation">PlayStation</option>
                          <option value="Xbox">Xbox</option>
                          <option value="Mobile">Mobile</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">الوصف</label>
                      <textarea
                        value={gameForm.description}
                        onChange={(e) => setGameForm({...gameForm, description: e.target.value})}
                        className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">السعر ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={gameForm.price}
                          onChange={(e) => setGameForm({...gameForm, price: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">السعر الأصلي (قبل الخصم) $</label>
                        <input
                          type="number"
                          step="0.01"
                          value={gameForm.originalPrice}
                          onChange={(e) => setGameForm({...gameForm, originalPrice: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                          placeholder="اختياري"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">نسبة الخصم (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gameForm.discount}
                          onChange={(e) => setGameForm({...gameForm, discount: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                          placeholder="مثال: 20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">المنطقة</label>
                        <select
                          value={gameForm.region}
                          onChange={(e) => setGameForm({...gameForm, region: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                        >
                          <option value="Global">عالمي</option>
                          <option value="North America">أمريكا الشمالية</option>
                          <option value="Europe">أوروبا</option>
                          <option value="Asia">آسيا</option>
                          <option value="Middle East">الشرق الأوسط</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">الحالة</label>
                        <select
                          value={gameForm.availability}
                          onChange={(e) => setGameForm({...gameForm, availability: e.target.value})}
                          className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                        >
                          <option value="available">متاح</option>
                          <option value="sold">تم البيع</option>
                          <option value="reserved">محجوز</option>
                        </select>
                      </div>
                    </div>

                    {/* Multiple Images Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">صور اللعبة (5 صور كحد أقصى)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer bg-[#1a1d24] border border-gray-700 rounded-lg px-4 py-3 text-white hover:border-red-500 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={gameForm.images.length >= 5}
                          />
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{gameForm.images.length >= 5 ? 'تم الوصول للحد الأقصى' : 'إضافة صور'}</span>
                          </div>
                        </label>
                        <span className="text-gray-400 text-sm">{gameForm.images.length} / 5</span>
                      </div>
                      
                      {/* Image Thumbnails Preview */}
                      {gameForm.images.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {gameForm.images.map((img, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={img} 
                                alt={`صورة ${index + 1}`} 
                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-700 group-hover:border-red-500 transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                                  رئيسية
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price Preview with Discount */}
                    {(gameForm.price && gameForm.discount) && (
                      <div className="bg-[#1a1d24] p-4 rounded-lg border border-gray-800">
                        <p className="text-sm text-gray-400">معاينة السعر:</p>
                        <div className="flex items-center gap-2 mt-1">
                          {gameForm.originalPrice && (
                            <span className="text-gray-500 line-through text-lg">
                              ${gameForm.originalPrice}
                            </span>
                          )}
                          <span className="text-green-400 text-2xl font-bold">
                            ${calculateDiscountedPrice(parseFloat(gameForm.price), parseInt(gameForm.discount)).toFixed(2)}
                          </span>
                          {gameForm.discount && (
                            <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                              خصم {gameForm.discount}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddGameForm(false);
                          setEditingGame(null);
                          resetGameForm();
                        }}
                        className="px-6 py-2 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        {editingGame ? 'تحديث' : 'إضافة'} لعبة
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Games Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-[#0a0a0a]">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        اللعبة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        السعر
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        المنصة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1a1d24] divide-y divide-gray-800">
                    {games.map((game) => (
                      <tr key={game._id} className="hover:bg-[#0a0a0a]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {game.images.length > 0 && (
                              <img src={game.images[0]} alt={game.title} className="w-12 h-12 rounded-lg object-cover ml-3" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-white">{game.title}</div>
                              <div className="text-xs text-gray-400 truncate max-w-xs">{game.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            {game.originalPrice && (
                              <span className="text-gray-500 line-through text-sm">
                                ${game.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-bold">${game.price.toFixed(2)}</span>
                              {game.discount && (
                                <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">
                                  -{game.discount}%
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {game.platform}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            game.availability === 'available' ? 'bg-green-600 text-white' :
                            game.availability === 'sold' ? 'bg-red-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {game.availability === 'available' ? 'متاح' :
                             game.availability === 'sold' ? 'تم البيع' : 'محجوز'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditGame(game)}
                            className="text-indigo-400 hover:text-indigo-300 ml-4 transition-colors"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteGame(game._id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">إدارة الطلبات</h2>
                {/* Export/Import removed as requested */}
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>لا توجد طلبات حالياً</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#0a0a0a]">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          العميل
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          المنتجات
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          المجموع
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          التاريخ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#1a1d24] divide-y divide-gray-800">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-[#0a0a0a]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              #{order.orderNumber || order._id.substring(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {order.user.firstName} {order.user.lastName}
                            </div>
                            <div className="text-xs text-gray-400">{order.user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {order.games.map((item, index) => (
                                <div key={index} className="mb-1">
                                  {item.game.title} - ${item.price}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-bold">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              order.status === 'pending' ? 'bg-yellow-600 text-white' :
                              order.status === 'completed' ? 'bg-green-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {order.status === 'pending' ? 'قيد الانتظار' :
                               order.status === 'completed' ? 'مكتمل' : 'ملغي'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/complete-order/${order._id}`)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  إكمال
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  إلغاء
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">رسائل الزبائن</h2>
                <button
                  onClick={loadConversations}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  تحديث
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-12 bg-[#1a1d24] rounded-xl">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">لا يوجد طلب دعم فني</h3>
                  <p className="text-gray-400">عندما يطلب أحد الزبائن الدعم الفني، ستظهر المحادثات هنا</p>
                </div>
              ) : (
                <div className="bg-[#1a1d24] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0a0a0a]">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          رقم الطلب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الزبون
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الطلب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          آخر رسالة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {conversations.map((conversation) => (
                        <tr key={conversation._id} className="hover:bg-[#0a0a0a]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{conversation.customerName}</div>
                            <div className="text-xs text-gray-400">{conversation.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {(() => {
                                const orderId = conversation.orderId as any;
                                let orderIdStr = '';
                                if (typeof orderId === 'string') {
                                  orderIdStr = orderId;
                                } else if (orderId && typeof orderId === 'object') {
                                  orderIdStr = orderId._id || orderId.toString();
                                }
                                return `طلب #${orderIdStr.slice(-6) || '---'}`;
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              conversation.status === 'open' 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {conversation.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                            </span>
                            {conversation.unreadByAdmin > 0 && (
                              <span className="mr-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                {conversation.unreadByAdmin} جديد
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-400">
                              {conversation.lastMessage 
                                ? new Date(conversation.lastMessage).toLocaleDateString('ar-SA')
                                : 'لا توجد رسائل'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => navigate(`/conversation/${conversation._id}`)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              فتح المحادثة
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Discount Codes Tab */}
          {activeTab === 'discounts' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">إدارة أكواد الخصم</h2>
                <button
                  onClick={() => {
                    resetDiscountForm();
                    setEditingDiscount(null);
                    setShowDiscountForm(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إضافة كود خصم
                </button>
              </div>

              {/* Discount Form Modal */}
              {showDiscountForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-[#1a1d24] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {editingDiscount ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
                    </h3>
                    
                    <div className="space-y-4">
                      {/* كود الخصم */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">كود الخصم *</label>
                        <input
                          type="text"
                          value={discountForm.code}
                          onChange={(e) => setDiscountForm({...discountForm, code: e.target.value.toUpperCase()})}
                          className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="مثال: SALE2024"
                        />
                      </div>

                      {/* الوصف */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">الوصف *</label>
                        <input
                          type="text"
                          value={discountForm.description}
                          onChange={(e) => setDiscountForm({...discountForm, description: e.target.value})}
                          className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="خصم خاص على جميع المنتجات"
                        />
                      </div>

                      {/* نوع الخصم وقيمته */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">نوع الخصم *</label>
                          <select
                            value={discountForm.discountType}
                            onChange={(e) => setDiscountForm({...discountForm, discountType: e.target.value as 'percentage' | 'fixed'})}
                            className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="percentage">نسبة مئوية (%)</option>
                            <option value="fixed">مبلغ ثابت ($)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">قيمة الخصم *</label>
                          <input
                            type="number"
                            value={discountForm.discountValue}
                            onChange={(e) => setDiscountForm({...discountForm, discountValue: e.target.value})}
                            className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder={discountForm.discountType === 'percentage' ? 'مثال: 10' : 'مثال: 5'}
                            min="0"
                          />
                        </div>
                      </div>

                      {/* الحد الأدنى للشراء */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">الحد الأدنى للشراء ($) <span className="text-gray-500 text-xs">(اختياري)</span></label>
                        <input
                          type="number"
                          value={discountForm.minimumAmount}
                          onChange={(e) => setDiscountForm({...discountForm, minimumAmount: e.target.value})}
                          className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      {/* تواريخ الصلاحية */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">تاريخ البدء *</label>
                          <input
                            type="date"
                            value={discountForm.startDate}
                            onChange={(e) => setDiscountForm({...discountForm, startDate: e.target.value})}
                            className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">تاريخ الانتهاء *</label>
                          <input
                            type="date"
                            value={discountForm.endDate}
                            onChange={(e) => setDiscountForm({...discountForm, endDate: e.target.value})}
                            className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* عدد مرات الاستخدام */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">عدد مرات الاستخدام <span className="text-gray-500 text-xs">(اختياري)</span></label>
                          <input
                            type="number"
                            value={discountForm.usageLimit}
                            onChange={(e) => setDiscountForm({...discountForm, usageLimit: e.target.value})}
                            className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="غير محدود"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">مرات الاستخدام لكل مستخدم</label>
                          <input
                            type="number"
                            value={discountForm.userUsageLimit}
                            onChange={(e) => setDiscountForm({...discountForm, userUsageLimit: e.target.value})}
                            className="w-full bg-[#0a0a0a] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="1"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowDiscountForm(false);
                          setEditingDiscount(null);
                        }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleSaveDiscount}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        {editingDiscount ? 'تحديث' : 'إضافة'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Discount Codes Table */}
              <div className="bg-[#1a1d24] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a]">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الكود
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الوصف
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الخصم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الاستخدام
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {discountCodes.map((discount) => (
                      <tr key={discount._id} className="hover:bg-[#0a0a0a]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{discount.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300">{discount.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300">
                            {discount.discountType === 'percentage' 
                              ? `${discount.discountValue}%` 
                              : `$${discount.discountValue}`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300">
                            {discount.usageCount}/{discount.usageLimit || '∞'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            discount.isActive 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {discount.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditDiscount(discount)}
                            className="text-blue-400 hover:text-blue-300 ml-3"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteDiscount(discount._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
