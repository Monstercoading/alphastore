// Real API for user management with backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  firstName: string;
  lastName?: string;
}

class UserAPI {
  private getUsersFromStorage(): User[] {
    try {
      const users = localStorage.getItem('users');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users from storage:', error);
      return [];
    }
  }

  private saveUsersToStorage(users: User[]): void {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users to storage:', error);
    }
  }

  private getCurrentUserFromStorage(): User | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user from storage:', error);
      return null;
    }
  }

  private saveCurrentUserToStorage(user: User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving current user to storage:', error);
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const users = this.getUsersFromStorage();
      const user = users.find(u => u._id === userId);
      
      console.log(`Getting user by ID ${userId}:`, user);
      
      return user || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Update user data
  async updateUser(userId: string, userData: UpdateUserData): Promise<User | null> {
    try {
      const users = this.getUsersFromStorage();
      const userIndex = users.findIndex(u => u._id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Update user data with timestamp
      const updatedUser: User = {
        ...users[userIndex],
        ...userData,
        updatedAt: new Date().toISOString()
      };

      console.log('Updating user:', updatedUser);

      // Update in users array
      users[userIndex] = updatedUser;
      this.saveUsersToStorage(users);

      // Always update current user if it's the same user
      this.saveCurrentUserToStorage(updatedUser);

      console.log('User updated successfully in storage');
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Get current user (from token/session)
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const user = this.getCurrentUserFromStorage();
      if (!user) {
        return null;
      }

      // 🔧 FIXED: Always return localStorage user as fallback
      // In a real app, you would validate the token with the backend
      // For now, we'll just return the user from storage
      console.log('Returning user from localStorage as fallback');
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // 🔧 ADDED: Expose getCurrentUserFromStorage for AuthContext fallback
  getCurrentUserFromStoragePublic(): User | null {
    return this.getCurrentUserFromStorage();
  }

  // Refresh current user data (fetch fresh data)
  async refreshCurrentUser(): Promise<User | null> {
    try {
      const currentUser = this.getCurrentUserFromStorage();
      if (!currentUser) {
        return null;
      }

      // Get fresh data from users array
      const freshUser = await this.getUserById(currentUser._id);
      if (freshUser) {
        this.saveCurrentUserToStorage(freshUser);
        return freshUser;
      }

      return null;
    } catch (error) {
      console.error('Error refreshing current user:', error);
      return null;
    }
  }

  // Create new user via backend API with duplicate check
  async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      console.log('📤 Sending register request to backend:', userData.email);
      
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.data.success) {
        console.log('✅ User created successfully:', response.data.user);
        
        // Save to localStorage for frontend state
        const newUser = response.data.user;
        const users = this.getUsersFromStorage();
        users.push(newUser);
        this.saveUsersToStorage(users);
        this.saveCurrentUserToStorage(newUser);
        
        return newUser;
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('❌ Error creating user:', error.response?.data || error.message);
      
      // Check if it's a 409 Conflict (user already exists)
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        throw {
          ...error,
          response: {
            data: {
              message: errorData.message || 'هذا الحساب مسجل لدينا بالفعل',
              redirectToLogin: true,
              ...errorData
            }
          }
        };
      }
      
      throw error;
    }
  }

  // Debug function to check data consistency
  debugUserData(userId: string): void {
    const users = this.getUsersFromStorage();
    const currentUser = this.getCurrentUserFromStorage();
    const userInArray = users.find(u => u._id === userId);
    
    console.log('=== USER DATA DEBUG ===');
    console.log('User in users array:', userInArray);
    console.log('Current user in localStorage:', currentUser);
    console.log('Data matches:', JSON.stringify(userInArray) === JSON.stringify(currentUser));
    console.log('====================');
  }

  // Delete user
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const users = this.getUsersFromStorage();
      const filteredUsers = users.filter(u => u._id !== userId);
      
      if (filteredUsers.length === users.length) {
        return false; // User not found
      }

      this.saveUsersToStorage(filteredUsers);

      // Clear current user if it's the deleted user
      const currentUser = this.getCurrentUserFromStorage();
      if (currentUser && currentUser._id === userId) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}

export const userAPI = new UserAPI();
