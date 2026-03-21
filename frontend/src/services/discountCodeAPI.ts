import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DiscountCode {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumAmount: number;
  maxDiscountAmount?: number;
  applicableProducts: Array<{
    _id: string;
    title: string;
    price?: number;
  }>;
  applicableCategories: string[];
  usageLimit?: number;
  usageCount: number;
  userUsageLimit: number;
  userUsageCount: Array<{
    userId: string;
    count: number;
  }>;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DiscountValidationResult {
  success: boolean;
  code: string;
  description: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  discountPercentage: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface AvailableProduct {
  _id: string;
  title: string;
  price: number;
  category: string;
  platform: string;
}

export interface CreateDiscountCodeData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumAmount?: number;
  maxDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  usageLimit?: number;
  userUsageLimit?: number;
  startDate: string;
  endDate: string;
}

class DiscountCodeAPI {
  // Get all discount codes (admin only)
  async getDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const response = await api.get('/discount-codes');
      return response.data;
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      throw error;
    }
  }

  // Get single discount code (admin only)
  async getDiscountCode(id: string): Promise<DiscountCode> {
    try {
      const response = await api.get(`/discount-codes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discount code:', error);
      throw error;
    }
  }

  // Create discount code (admin only)
  async createDiscountCode(data: CreateDiscountCodeData): Promise<DiscountCode> {
    try {
      const response = await api.post('/discount-codes', data);
      return response.data;
    } catch (error) {
      console.error('Error creating discount code:', error);
      throw error;
    }
  }

  // Update discount code (admin only)
  async updateDiscountCode(id: string, data: Partial<CreateDiscountCodeData>): Promise<DiscountCode> {
    try {
      const response = await api.put(`/discount-codes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating discount code:', error);
      throw error;
    }
  }

  // Delete discount code (admin only)
  async deleteDiscountCode(id: string): Promise<void> {
    try {
      await api.delete(`/discount-codes/${id}`);
    } catch (error) {
      console.error('Error deleting discount code:', error);
      throw error;
    }
  }

  // Validate discount code
  async validateDiscountCode(
    code: string, 
    amount: number, 
    productId?: string, 
    productCategory?: string
  ): Promise<DiscountValidationResult> {
    try {
      const response = await api.post('/discount-codes/validate', {
        code,
        amount,
        productId,
        productCategory
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      console.error('Error validating discount code:', error);
      throw error;
    }
  }

  // Get available products for discount code selection
  async getAvailableProducts(): Promise<AvailableProduct[]> {
    try {
      const response = await api.get('/discount-codes/products/available');
      return response.data;
    } catch (error) {
      console.error('Error fetching available products:', error);
      throw error;
    }
  }
}

export const discountCodeAPI = new DiscountCodeAPI();
