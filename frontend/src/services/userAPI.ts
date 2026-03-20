// Mock API for user management
// In a real app, this would connect to a backend

export interface User {
  _id: string;
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

      // In a real app, you would validate the token with the backend
      // For now, we'll just return the user from storage
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
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

  // Create new user
  async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const users = this.getUsersFromStorage();
      
      // Check if user already exists
      if (users.find(u => u.email === userData.email)) {
        throw new Error('User already exists');
      }

      const newUser: User = {
        ...userData,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsersToStorage(users);

      // Also save as current user
      this.saveCurrentUserToStorage(newUser);

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
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
