import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import emailjs from '@emailjs/browser';
import { API_URL } from '../config/api';

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
  accountDetails?: {
    username?: string;
    email?: string;
    password?: string;
    additionalInfo?: string;
  };
}

const CompleteOrder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [accountData, setAccountData] = useState({
    username: '',
    email: '',
    password: '',
    additionalInfo: ''
  });

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first
      const response = await fetch(`${API_URL}/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        // Fallback to localStorage
        const savedOrders = localStorage.getItem('alpha_orders');
        if (savedOrders) {
          const orders: Order[] = JSON.parse(savedOrders);
          const foundOrder = orders.find(o => o._id === orderId);
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            setError('الطلب غير موجود');
          }
        } else {
          setError('الطلب غير موجود');
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
      // Fallback to localStorage
      const savedOrders = localStorage.getItem('alpha_orders');
      if (savedOrders) {
        const orders: Order[] = JSON.parse(savedOrders);
        const foundOrder = orders.find(o => o._id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('الطلب غير موجود');
        }
      } else {
        setError('الطلب غير موجود');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;
    
    try {
      setSending(true);
      
      // Update order with account details and mark as completed
      const savedOrders = localStorage.getItem('alpha_orders');
      if (savedOrders) {
        const orders: Order[] = JSON.parse(savedOrders);
        const updatedOrders = orders.map(o => {
          if (o._id === orderId) {
            return {
              ...o,
              status: 'completed',
              accountDetails: accountData
            };
          }
          return o;
        });
        
        localStorage.setItem('alpha_orders', JSON.stringify(updatedOrders));
        
        // Send email via EmailJS (works directly from frontend!)
        try {
          // EmailJS configuration
          const EMAILJS_SERVICE_ID = 'service_1pvhy1g'; // Your Service ID
          const EMAILJS_TEMPLATE_ID = 'template_ex5nff2'; // Your Template ID
          const EMAILJS_PUBLIC_KEY = 'cIHAMAUp1BM_8x8Yz'; // Your Public Key
          
          const templateParams = {
            to_email: order.user.email,
            to_name: `${order.user.firstName} ${order.user.lastName}`,
            order_id: order._id.slice(-6),
            games_list: order.games.map(g => `${g.game.title} ($${g.price})`).join('\n'),
            total_amount: order.totalAmount,
            account_username: accountData.username,
            account_email: accountData.email,
            account_password: accountData.password,
            account_additional: accountData.additionalInfo || 'لا يوجد',
            reply_to: 'alpha.store@gmail.com'
          };
          
          await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
          );
          
          alert(`تم إكمال الطلب وإرسال الإيميل بنجاح!\n\nتم إرسال بيانات الحساب إلى:\n${order.user.email}`);
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          alert(`تم حفظ الطلب ولكن فشل إرسال الإيميل.\n\nلإعداد EmailJS:\n1. سجل في https://www.emailjs.com/\n2. أنشئ Service (Gmail/SendGrid...)\n3. أنشئ Template بالمتغيرات: {{to_email}}, {{account_username}}, {{account_password}}...\n4. احصل على Public Key\n5. عدّل الكود بالقيم الصحيحة\n\nيمكنك إرسال البيانات يدوياً.`);
        }
        
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('حدث خطأ أثناء إكمال الطلب');
    } finally {
      setSending(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">الطلب غير موجود</h1>
            <p className="text-gray-400 mb-6">لم يتم العثور على الطلب المطلوب</p>
            <Link to="/admin" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
              العودة للوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/admin" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة للوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-red-500">إكمال الطلب</h1>
          <p className="text-gray-400 mt-2">أدخل بيانات الحساب لإرسالها للعميل</p>
        </div>

        {/* Order Summary */}
        <div className="bg-[#1a1d24] rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">ملخص الطلب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">رقم الطلب:</span>
              <span className="text-white">#{order._id.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">العميل:</span>
              <span className="text-white">{order.user.firstName} {order.user.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">البريد الإلكتروني:</span>
              <span className="text-white" dir="ltr">{order.user.email}</span>
            </div>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <p className="text-gray-400 mb-2">المنتجات:</p>
              {order.games.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-white">{item.game.title}</span>
                  <span className="text-green-400">${item.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between text-lg font-bold">
              <span className="text-white">المجموع:</span>
              <span className="text-red-500">${order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Account Details Form */}
        <div className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">بيانات الحساب</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                اسم المستخدم / Username
              </label>
              <input
                type="text"
                value={accountData.username}
                onChange={(e) => setAccountData({...accountData, username: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                البريد الإلكتروني للحساب / Email
              </label>
              <input
                type="email"
                value={accountData.email}
                onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="أدخل البريد الإلكتروني للحساب"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                كلمة المرور / Password
              </label>
              <input
                type="text"
                value={accountData.password}
                onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                معلومات إضافية (اختياري)
              </label>
              <textarea
                value={accountData.additionalInfo}
                onChange={(e) => setAccountData({...accountData, additionalInfo: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                rows={3}
                placeholder="أي معلومات إضافية مثل: رمز الأمان، أسئلة الأمان، إلخ..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري إكمال الطلب...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    إكمال الطلب وإرسال البيانات
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mt-4">
              <p className="text-blue-400 text-sm text-center">
                <strong>📧 إرسال تلقائي:</strong> سيتم إرسال بيانات الحساب إلى إيميل العميل تلقائياً
                <br />
                عبر <strong>MailerSend</strong> عند الضغط على "إكمال الطلب"
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteOrder;
