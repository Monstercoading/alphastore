// إعدادات Google OAuth للمحاكاة
// يمكنك تعديل هذه البيانات لتجربة إيميلات مختلفة

export const GOOGLE_MOCK_USER = {
  email: 'arabcraftsmp@gmail.com', // غير هذا للإيميل الذي تريده
  firstName: 'Arab',              // غير هذا لاسمك الأول
  lastName: 'Crafts',              // غير هذا لاسم عائلتك
};

// يمكنك إضافة مستخدمين آخرين للاختبار
export const GOOGLE_TEST_USERS = [
  {
    email: 'test1@gmail.com',
    firstName: 'Test',
    lastName: 'User1',
  },
  {
    email: 'test2@gmail.com',
    firstName: 'Test',
    lastName: 'User2',
  },
];
