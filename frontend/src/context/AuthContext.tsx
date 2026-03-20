import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAppNavigation } from './NavigationContext';
import { showNotification } from '../assets/notifications';
import { formatWelcomeMessage } from '../utils/nameFormatter';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import { userAPI } from '../services/userAPI';
import { GOOGLE_AUTH_CONFIG, initiateGoogleSignIn } from '../config/googleAuth';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  wallet: number;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  googleLoginSuccess: (user: User) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (user: User) => void;
  isNavigationLoading: boolean;
  state: AuthState;
  addToWallet: (amount: number) => void;
  deductFromWallet: (amount: number) => boolean;
  getWalletBalance: () => number;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; wallet?: number } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_WALLET'; payload: number };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        wallet: action.payload.wallet ?? state.wallet,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        wallet: 0,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_WALLET':
      return { ...state, wallet: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  wallet: parseFloat(localStorage.getItem('alpha_wallet') || '0'),
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useAppNavigation();
  const { navigateWithDelay, redirectWithDelay, isLoading, setIsLoading } = useNavigationWithDelay();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Get fresh user data from API
      const loadUserData = async () => {
        try {
          const user = await userAPI.getCurrentUser();
          if (user) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token },
            });
          } else {
            // Token exists but no user data, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      };

      loadUserData();
    }
  }, []);

  // Load wallet from alpha_wallet on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('alpha_wallet');
    if (savedWallet) {
      dispatch({ type: 'UPDATE_WALLET', payload: parseFloat(savedWallet) });
    }
  }, []);

  // Save wallet to alpha_wallet whenever it changes
  useEffect(() => {
    localStorage.setItem('alpha_wallet', state.wallet.toString());
  }, [state.wallet]);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Check for hardcoded admin credentials
      if (email === 'admin@gmail.com' && password === '3621447a') {
        const adminUser = {
          _id: 'admin-001',
          email: 'admin@gmail.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin' as const
        };
        const token = 'admin-jwt-token';
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: adminUser, token }
        });
        
        showNotification('تم تسجيل دخول الأدمن بنجاح!', 'success');
        navigateWithDelay('/admin', 1500);
        return;
      }

      // التحقق من المستخدمين في localStorage
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = existingUsers.find((u: User) => u.email === email);
      
      if (existingUser) {
        // المستخدم موجود - تسجيل الدخول
        const token = `mock-jwt-token-${existingUser._id}`;
        localStorage.setItem('token', token);
        
        // Get fresh user data from API
        const freshUser = await userAPI.getUserById(existingUser._id);
        const userToUse = freshUser || existingUser;
        
        console.log('Regular login - using user data:', userToUse);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: userToUse, token }
        });
        
        showNotification(formatWelcomeMessage(userToUse.firstName, userToUse.lastName), 'success');
        // الانتقال للصفحة الرئيسية مع تأخير و loading
        navigateWithDelay('/', 2500);
      } else {
        // المستخدم غير موجود - يجب إنشاء حساب أولاً
        throw new Error('هذا الحساب غير موجود. يرجى إنشاء حساب أولاً.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'فشل تسجيل الدخول';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Use the new Google OAuth function
      initiateGoogleSignIn();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'فشل تسجيل الدخول عبر Google';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Create user using API
      const newUser = await userAPI.createUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user'
      });

      const token = `mock-jwt-token-${newUser._id}`;
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: newUser, token }
      });

      // Show success toast for account creation
      showNotification('تم إنشاء الحساب بنجاح!', 'success');
      
      // Then show welcome message
      setTimeout(() => {
        showNotification(formatWelcomeMessage(newUser.firstName, newUser.lastName), 'success');
      }, 1500);
      
      navigateWithDelay('/', 2500);
    } catch (error: any) {
      const errorMessage = error.message || 'فشل إنشاء الحساب';
      
      // Check if error indicates user already exists
      if (error.response?.data?.redirectToLogin || errorMessage.includes('مستخدمة')) {
        showNotification(
          'هذه المعلومات مستخدمة بالفعل. هل لديك حساب؟',
          'error',
          5000,
          () => navigate('/login')
        );
      } else {
        showNotification(errorMessage, 'error');
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const googleLoginSuccess = async (user: User) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const token = `mock-jwt-token-${user._id}`;
      
      // Get the most up-to-date user data from API
      const freshUserData = await userAPI.getUserById(user._id);
      const userToUse = freshUserData || user;
      
      console.log('Google login - using user data:', userToUse);
      
      // Save token and user data to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToUse));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userToUse, token }
      });

      showNotification(formatWelcomeMessage(userToUse.firstName, userToUse.lastName), 'success');
      navigateWithDelay('/', 2500);
    } catch (error: any) {
      const errorMessage = error.message || 'فشل تسجيل الدخول عبر Google';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('users');
    showNotification('تم تسجيل الخروج بنجاح', 'success');
    // الانتقال للصفحة الرئيسية مع تأخير و loading
    redirectWithDelay('/', 2500);
  };

  // تحديث بيانات المستخدم في الحالة
  const updateUser = (updatedUser: User) => {
    if (state.token) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: updatedUser, token: state.token }
      });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Wallet functions
  const addToWallet = (amount: number) => {
    const newBalance = state.wallet + amount;
    dispatch({ type: 'UPDATE_WALLET', payload: newBalance });
    localStorage.setItem('alpha_wallet', newBalance.toString());
  };

  const deductFromWallet = (amount: number): boolean => {
    if (state.wallet >= amount) {
      const newBalance = state.wallet - amount;
      dispatch({ type: 'UPDATE_WALLET', payload: newBalance });
      localStorage.setItem('alpha_wallet', newBalance.toString());
      return true;
    }
    return false;
  };

  const getWalletBalance = () => state.wallet;

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    wallet: state.wallet,
    state,
    login,
    loginWithGoogle,
    googleLoginSuccess,
    register,
    logout,
    clearError,
    updateUser,
    isNavigationLoading: isLoading,
    addToWallet,
    deductFromWallet,
    getWalletBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
