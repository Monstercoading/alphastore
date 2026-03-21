import { toast } from 'react-hot-toast';

// Success toast
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 6000,
    position: 'top-center',
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

// Error toast
export const showErrorToast = (message: string, duration: number = 6000) => {
  toast.error(message, {
    duration,
    position: 'top-center',
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

// Toast with action callback
export const showToastWithAction = (
  message: string, 
  actionText: string, 
  onAction: () => void
) => {
  const toastId = toast(
    message + ' ' + actionText,
    {
      duration: 8000,
      position: 'top-center',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        padding: '16px',
        borderRadius: '8px',
        minWidth: '300px',
        cursor: 'pointer',
      },
    }
  );
  
  // Auto-execute action after 7 seconds
  setTimeout(() => {
    onAction();
    toast.dismiss(toastId);
  }, 7000);
};

// Loading toast
export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'top-center',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

// Dismiss toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Welcome message formatter
export const formatWelcomeMessage = (firstName: string, lastName: string) => {
  return `مرحباً ${firstName} ${lastName}! تم تسجيل الدخول بنجاح`;
};
