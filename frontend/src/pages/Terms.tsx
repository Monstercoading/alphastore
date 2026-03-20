import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة للرئيسية
          </Link>
          <h1 className="text-3xl font-bold text-red-500">الشروط والأحكام</h1>
          <p className="text-gray-400 mt-2">آخر تحديث: 19 مارس 2026</p>
        </div>

        <div className="space-y-8">
          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">1. مقدمة</h2>
            <p className="text-gray-300 leading-relaxed">
              مرحباً بك في Alpha Store. باستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
              يرجى قراءتها بعناية قبل استخدام خدماتنا.
            </p>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">2. طبيعة المنتجات</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Alpha Store متجر لبيع مفاتيح ألعاب الفيديو الرقمية الأصلية. جميع المفاتيح:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>أصلية 100% وشرعية</li>
              <li>تُستخدم مرة واحدة فقط</li>
              <li>غير قابلة للاسترجاع بعد التفعيل</li>
              <li>تُرسل عبر البريد الإلكتروني بعد إتمام الشراء</li>
            </ul>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">3. سياسة الإلغاء والاسترجاع</h2>
            <p className="text-gray-300 leading-relaxed">
              نظراً لطبيعة المنتجات الرقمية، <strong className="text-red-400">لا يمكن استرجاع أو استبدال المفاتيح بعد إرسالها</strong>.
              في حال واجهت مشكلة في التفعيل، يرجى التواصل معنا خلال 24 ساعة عبر Discord وسنحاول حل المشكلة.
            </p>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">4. الدفع</h2>
            <p className="text-gray-300 leading-relaxed">
              جميع المدفوعات تتم بشكل آمن. نحن نقبل وسائل الدفع المتاحة في المنصة.
              سيتم إرسال تفاصيل الحساب عبر البريد الإلكتروني بعد تأكيد الدفع وإكمال الطلب من قبل الإدارة.
            </p>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">5. التواصل والدعم</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              للاستفسارات والدعم الفني، يمكنك التواصل معنا عبر:
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href="https://discord.gg/4pEx4HrpM3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                Discord: discord.gg/4pEx4HrpM3
              </a>
              <a 
                href="https://www.instagram.com/alpha_store.jo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-pink-400 hover:text-pink-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram: @alpha_store.jo
              </a>
            </div>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">6. المسؤولية</h2>
            <p className="text-gray-300 leading-relaxed">
              نحن غير مسؤولين عن:
              <br />• استخدام المفاتيح بشكل مخالف لقوانين المنصة
              <br />• مشاكل تقنية في منصات الألعاب (Steam, Origin, Epic, etc.)
              <br />• فقدان البيانات الشخصية للمستخدم
            </p>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">7. التعديلات</h2>
            <p className="text-gray-300 leading-relaxed">
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية.
              الاستمرار في استخدام الموقع بعد التعديلات يعني قبولك للشروط الجديدة.
            </p>
          </section>

          <section className="bg-[#1a1d24] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">8. القانون السائد</h2>
            <p className="text-gray-300 leading-relaxed">
              تخضع هذه الشروط والأحكام للقوانين المعمول بها في الأردن.
              أي نزاع ين arising من استخدام الموقع سيتم حله عن طريق الوساطة أو المحاكم المختصة في الأردن.
            </p>
          </section>

          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-gray-300">
              باستخدامك لـ Alpha Store، فإنك تقر بأنك قرأت وفهمت ووافقت على جميع الشروط والأحكام المذكورة أعلاه.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
