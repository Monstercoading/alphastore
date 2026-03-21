import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gamesAPI, ordersAPI } from '../services/api';
import { conversationAPI, Conversation } from '../services/conversationAPI';
import { playNotificationSound, playMessageSound } from '../utils/notificationSound';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { STATIC_PRODUCTS } from '../data/products-data';
import { API_URL } from '../config/api';

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
  const [activeTab, setActiveTab] = useState<'games' | 'orders' | 'messages'>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAddGameForm, setShowAddGameForm] = useState(false);
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

  // Export orders to JSON file using backend API
  const exportOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/export`);
      if (!response.ok) {
        throw new Error('Failed to export orders');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('تم تصدير الطلبات بنجاح!');
    } catch (error) {
      console.error('Export error:', error);
      alert('فشل تصدير الطلبات');
    }
  };

  // Import orders from JSON file using backend API
  const importOrders = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        let importedData;
        
        // Try to parse as direct orders array first
        try {
          importedData = JSON.parse(fileContent);
        } catch {
          // If that fails, try to extract from export format
          const parsed = JSON.parse(fileContent);
          importedData = parsed.orders || parsed;
        }
        
        if (!Array.isArray(importedData)) {
          alert('الملف غير صالح - يجب أن يحتوي على مصفوفة من الطلبات');
          return;
        }
        
        // Send to backend API
        const response = await fetch('http://192.168.1.52:5000/api/orders/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orders: importedData }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to import orders');
        }
        
        const result = await response.json();
        alert(`تم استيراد ${result.imported} طلب بنجاح! المجموع الكلي: ${result.total}`);
        
        // Refresh orders list
        const updatedOrders = await fetch('http://192.168.1.52:5000/api/orders');
        if (updatedOrders.ok) {
          const ordersData = await updatedOrders.json();
          setOrders(ordersData);
          localStorage.setItem('alpha_orders', JSON.stringify(ordersData));
        }
        
      } catch (error) {
        console.error('Import error:', error);
        alert('خطأ في استيراد الملف');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
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
                <div className="flex gap-3">
                  <button
                    onClick={exportOrders}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    تصدير الطلبات
                  </button>
                  <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    استيراد طلبات
                    <input
                      type="file"
                      accept=".json"
                      onChange={importOrders}
                      className="hidden"
                    />
                  </label>
                </div>
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
                            {new Date(order.createdAt).toLocaleDateString('ar-SA')}
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
