import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (phoneNumber, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', {
            phoneNumber,
            password
          });

          const { user, accessToken, refreshToken } = response.data.data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Set token for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          
          const { user, accessToken, refreshToken } = response.data.data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Set token for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch (error) {
          console.error('Logout error:', error);
        }

        // Clear state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        });

        // Remove token from API headers
        delete api.defaults.headers.common['Authorization'];
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          set({
            accessToken,
            refreshToken: newRefreshToken
          });

          // Update API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          return false;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/profile', profileData);
          const updatedUser = response.data.data.user;
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed';
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          return { success: false, error: errorMessage };
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          const user = response.data.data.user;
          
          set({ user });
          return { success: true };
        } catch (error) {
          console.error('Fetch profile error:', error);
          return { success: false };
        }
      },

      clearError: () => set({ error: null }),

      // Initialize auth state from stored tokens
      initialize: () => {
        const { accessToken } = get();
        if (accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          // Optionally fetch fresh profile data
          get().fetchProfile();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;