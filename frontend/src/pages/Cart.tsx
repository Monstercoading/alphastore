import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDisplayName } from '../utils/nameFormatter';
import { conversationAPI } from '../services/conversationAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import Loading from '../components/Loading';
import { API_URL } from '../config/api';
import ChatModal from '../components/ChatModal';

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
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  createdAt: string;
}

const Cart: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const { navigateWithDelay, isLoading: navLoading } = useNavigationWithDelay();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);

  const handleSupport = async (orderId?: string) => {
    try {
      console.log('Opening support chat...');
      
      // Only create conversation if orderId is provided
      if (orderId) {
        console.log('Creating conversation for order:', orderId);
        const conversation = await conversationAPI.createConversation(orderId);
        console.log('Conversation created:', conversation);
        showSuccessToast('تم فتح المحادثة مع الدعم الفني');
        
        // Store the conversation ID to be selected when modal opens
        localStorage.setItem('newConversationId', conversation._id);
        setShowChatModal(true);
      } else {
        // Don't allow general conversations
        showErrorToast('يمكنك فقط التواصل مع الدعم الفني بخصوص طلبات قيد الانتظار');
      }
    } catch (error: any) {
      console.error('Error opening chat:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        showErrorToast('لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      } else if (error.response?.status === 401) {
        // 🔧 FIXED: Don't auto-logout, just show error
        console.log('401 error in handleSupport - backend might be down');
        showErrorToast('مشكلة في فتح المحادثة. يرجى المحاولة مرة أخرى.');
      } else {
        showErrorToast('فشل فتح المحادثة. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) {
      fetchOrders();
    }
  }, [state.isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Try to get orders from server first
      const response = await fetch(`${API_URL}/orders`);
      if (response.ok) {
        const serverOrders = await response.json();
        // Filter by current user
        const userOrders = serverOrders.filter((order: Order) => 
          order.user.email === state.user?.email
        );
        setOrders(userOrders);
        localStorage.setItem('alpha_orders', JSON.stringify(serverOrders));
      } else {
        // Fallback to localStorage
        const savedOrders = localStorage.getItem('alpha_orders');
        let localOrders: Order[] = [];
        
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          localOrders = parsedOrders.filter((order: Order) => 
            order.user.email === state.user?.email
          );
        }
        
        setOrders(localOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to localStorage
      const savedOrders = localStorage.getItem('alpha_orders');
      let localOrders: Order[] = [];
      
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        localOrders = parsedOrders.filter((order: Order) => 
          order.user.email === state.user?.email
        );
      }
      
      setOrders(localOrders);
    } finally {
      setLoading(false);
    }
  };

  // Export user's orders to JSON file
  const exportMyOrders = () => {
    if (orders.length === 0) {
      alert('لا توجد طلبات للتصدير');
      return;
    }
    
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'my_orders.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert('تم تصدير طلباتك - أرسل الملف للأدمن');
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'قيد الانتظار', color: 'text-yellow-400 bg-yellow-400/20' };
      case 'sent':
        return { text: 'تم الإرسال إلى بريدك الإلكتروني', color: 'text-green-400 bg-green-400/20' };
      case 'completed':
        return { text: 'مكتمل', color: 'text-blue-400 bg-blue-400/20' };
      case 'cancelled':
        return { text: 'ملغي', color: 'text-red-400 bg-red-400/20' };
      default:
        return { text: status, color: 'text-gray-400 bg-gray-400/20' };
    }
  };

  if (!state.isAuthenticated) {
    return (
      <>
        {navLoading && <Loading />}
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">يرجى تسجيل الدخول</h1>
            <p className="text-gray-400 mb-6">يجب تسجيل الدخول لعرض طلباتك</p>
            <Link to="/login" className="btn-primary inline-block">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500/20 border-t-red-500"></div>
            <p className="mt-4 text-gray-400">جاري تحميل الطلبات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">طلباتي</h1>
          <p className="text-gray-400">تتبع حالة طلباتك بشكل مباشر</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-gray-700 mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">لا توجد طلبات</h3>
            <p className="text-gray-400 mb-6">لم تقم بإنشاء أي طلبات بعد</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1v4a1 1 0 001 1h3" />
              </svg>
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              return (
                <div key={order._id} className="bg-[#1a1d24] rounded-xl border border-gray-800 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">طلب #{order._id}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {order.games.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{item.game.title}</h4>
                            <p className="text-gray-400 text-sm">{item.game.platform}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-green-400 font-bold">${item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400 text-sm">المجموع الكلي</p>
                          <p className="text-2xl font-bold text-green-400">${order.totalAmount}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleSupport(order._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              تواصل مع الدعم الفني
                            </button>
                          )}
                          <div className="text-sm text-gray-400">
                            {order.user.firstName} {order.user.lastName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Chat Modal */}
      <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
    </div>
  );
};

export default Cart;
