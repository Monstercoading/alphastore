// ملف الإشعارات الصوتية والمرئية

// إنشاء أصوات بسيطة باستخدام Web Audio API
const createSound = (frequency, duration, type = 'sine') => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
  
  return audioContext;
};

// الأصوات المختلفة
export const playSuccessSound = () => {
  try {
    // صوت نجاح - نغمتين متصاعدتين
    createSound(523.25, 0.1); // C5
    setTimeout(() => createSound(659.25, 0.15), 100); // E5
  } catch (error) {
    console.log('Sound play failed:', error);
  }
};

export const playErrorSound = () => {
  try {
    // صوت خطأ - نغمة منخفضة
    createSound(220, 0.2, 'sawtooth'); // A3
  } catch (error) {
    console.log('Sound play failed:', error);
  }
};

export const playWarningSound = () => {
  try {
    // صوت تحذير - نغمة متوسطة
    createSound(440, 0.15, 'triangle'); // A4
  } catch (error) {
    console.log('Sound play failed:', error);
  }
};

// دالة الإشعار الرئيسية
export const showNotification = (message, type = 'success') => {
  // تشغيل الصوت المناسب
  switch (type) {
    case 'success':
      playSuccessSound();
      break;
    case 'error':
      playErrorSound();
      break;
    case 'warning':
      playWarningSound();
      break;
  }
  
  // إنشاء عنصر الإشعار
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
      </div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">×</button>
  `;
  
  // إضافة الـ CSS
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    min-width: 300px;
    max-width: 400px;
    transform: translateX(-400px);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  `;
  
  // إضافة الإشعار للصفحة
  document.body.appendChild(notification);
  
  // إظهار الإشعار مع تأثير حركي
  setTimeout(() => {
    notification.style.transform = 'translateX(0) scale(1)';
  }, 100);
  
  // إزالة الإشعار بعد 5 ثواني
  setTimeout(() => {
    notification.style.transform = 'translateX(-400px) scale(0.8)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
  
  // إضافة زر الإغلاق
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      opacity: 0.8;
    `;
    
    closeBtn.addEventListener('click', () => {
      notification.style.transform = 'translateX(-400px) scale(0.8)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      closeBtn.style.opacity = '1';
      closeBtn.style.transform = 'scale(1.1)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'none';
      closeBtn.style.opacity = '0.8';
      closeBtn.style.transform = 'scale(1)';
    });
  }
  
  // إضافة تأثيرات للـ content
  const content = notification.querySelector('.notification-content');
  if (content) {
    content.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;
  }
  
  const icon = notification.querySelector('.notification-icon');
  if (icon) {
    icon.style.cssText = `
      font-size: 18px;
      flex-shrink: 0;
    `;
  }
  
  const messageEl = notification.querySelector('.notification-message');
  if (messageEl) {
    messageEl.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
  }
};
