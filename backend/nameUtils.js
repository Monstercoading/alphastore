// دالة لمعالجة الأسماء العربية والإنجليزية بشكل صحيح

const normalizeName = (name) => {
  if (!name) return '';
  
  // إزالة أي مسافات زائدة
  let normalizedName = name.trim();
  
  // إذا كان الاسم بالعربية، نحافظ عليه كما هو
  if (/[\u0600-\u06FF]/.test(normalizedName)) {
    return normalizedName;
  }
  
  // إذا كان الاسم يحتوي على مسافات (اسم مركب)
  if (normalizedName.includes(' ')) {
    // لكل كلمة، نجعل الحرف الأول كبير
    return normalizedName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  // التأكد من أن الاسم يبدأ بحرف كبير للإنجليزية
  return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1).toLowerCase();
};

const formatGoogleUser = (userData) => {
  // معالجة الاسم الأول
  let firstName = userData.given_name || 'User';
  let lastName = userData.family_name || 'Name';
  
  // تنظيف الأسماء
  firstName = normalizeName(firstName);
  lastName = normalizeName(lastName);
  
  return {
    email: userData.email,
    firstName,
    lastName,
    picture: userData.picture,
    verified: userData.verified_email,
  };
};

module.exports = { formatGoogleUser, normalizeName };
