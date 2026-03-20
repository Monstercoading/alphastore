// دالة للتحقق مما إذا كان النص يحتوي على حروف عربية
const isArabic = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

// دالة للتحقق مما إذا كان النص يحتوي على حروف إنجليزية
const isEnglish = (text: string): boolean => {
  const englishRegex = /[a-zA-Z]/;
  return englishRegex.test(text);
};

// دالة للحصول على CSS class مناسب لاتجاه النص
export const getTextDirectionClass = (text: string): string => {
  if (isEnglish(text) && !isArabic(text)) {
    return 'english-text';
  }
  if (isArabic(text) && isEnglish(text)) {
    return 'mixed-text';
  }
  return 'rtl-text';
};

// دالة لتنسيق الاسم المختلط (عربي وإنجليزي) مع HTML classes
export const formatMixedNameWithClasses = (firstName: string, lastName: string): string => {
  const firstNameClass = getTextDirectionClass(firstName);
  const lastNameClass = getTextDirectionClass(lastName);
  
  return `<span class="${firstNameClass}">${firstName}</span> <span class="${lastNameClass}">${lastName}</span>`;
};

// دالة لتنسيق الاسم المختلط (عربي وإنجليزي)
export const formatMixedName = (firstName: string, lastName: string): string => {
  // إذا كان الاسم الأول عربي والثاني إنجليزي
  if (isArabic(firstName) && isEnglish(lastName)) {
    return `${firstName} ${lastName}`;
  }
  
  // إذا كان الاسم الأول إنجليزي والثاني عربي
  if (isEnglish(firstName) && isArabic(lastName)) {
    return `${firstName} ${lastName}`;
  }
  
  // إذا كان كلاهما عربي
  if (isArabic(firstName) && isArabic(lastName)) {
    return `${firstName} ${lastName}`;
  }
  
  // إذا كان كلاهما إنجليزي
  if (isEnglish(firstName) && isEnglish(lastName)) {
    return `${firstName} ${lastName}`;
  }
  
  // الحالة الافتراضية
  return `${firstName} ${lastName}`;
};

// دالة لتنسيق الاسم مع الترحيب
export const formatWelcomeMessage = (firstName: string, lastName: string): string => {
  const fullName = formatMixedName(firstName, lastName);
  
  // إذا كان الاسم الأول عربي، نستخدم ترحيب عربي
  if (isArabic(firstName)) {
    return `أهلاً بك ${fullName}`;
  }
  
  // إذا كان الاسم الأول إنجليزي، نستخدم ترحيب إنجليزي
  if (isEnglish(firstName)) {
    return `Welcome ${fullName}`;
  }
  
  // افتراضي عربي
  return `أهلاً بك ${fullName}`;
};

// دالة للحصول على اتجاه النص (RTL/LTR) بناءً على اللغة
export const getTextDirection = (text: string): 'rtl' | 'ltr' => {
  return isArabic(text) ? 'rtl' : 'ltr';
};

// دالة لتنسيق الاسم مع الحفظ على الترتيب الصحيح
export const formatDisplayName = (firstName: string, lastName: string): string => {
  // تنظيف الأسماء من المسافات الزائدة
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  
  // إذا كان الاسم الأول عربي والثاني إنجليزي، نحافظ على الترتيب
  if (isArabic(cleanFirstName) && isEnglish(cleanLastName)) {
    return `${cleanFirstName} ${cleanLastName}`;
  }
  
  // إذا كان الاسم الأول إنجليزي والثاني عربي، نحافظ على الترتيب
  if (isEnglish(cleanFirstName) && isArabic(cleanLastName)) {
    return `${cleanFirstName} ${cleanLastName}`;
  }
  
  // الحالات الأخرى - نحافظ على الترتيب الأصلي
  return `${cleanFirstName} ${cleanLastName}`;
};
