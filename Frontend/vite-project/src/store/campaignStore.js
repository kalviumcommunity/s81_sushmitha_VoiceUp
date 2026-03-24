import { create } from 'zustand';
import api from '../services/api';

const useCampaignStore = create((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  trendingCampaigns: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0
  },

  // Actions
  fetchCampaigns: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/campaigns', { params });
      const { docs, totalPages, currentPage, total } = response.data.data;
      
      set({
        campaigns: docs,
        pagination: { currentPage, totalPages, total },
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch campaigns';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  fetchTrendingCampaigns: async () => {
    try {
      const response = await api.get('/campaigns/trending');
      set({ trendingCampaigns: response.data.data });
      return { success: true };
    } catch (error) {
      console.error('Failed to fetch trending campaigns:', error);
      return { success: false };
    }
  },

  fetchCampaignById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/campaigns/${id}`);
      set({
        currentCampaign: response.data.data,
        isLoading: false,
        error: null
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch campaign';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  createCampaign: async (campaignData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/campaigns', campaignData);
      const newCampaign = response.data.data;
      
      set(state => ({
        campaigns: [newCampaign, ...state.campaigns],
        isLoading: false,
        error: null
      }));

      return { success: true, campaign: newCampaign };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create campaign';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  updateCampaign: async (id, campaignData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/campaigns/${id}`, campaignData);
      const updatedCampaign = response.data.data;
      
      set(state => ({
        campaigns: state.campaigns.map(c => 
          c._id === id ? updatedCampaign : c
        ),
        currentCampaign: state.currentCampaign?._id === id 
          ? updatedCampaign 
          : state.currentCampaign,
        isLoading: false,
        error: null
      }));

      return { success: true, campaign: updatedCampaign };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update campaign';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  deleteCampaign: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/campaigns/${id}`);
      
      set(state => ({
        campaigns: state.campaigns.filter(c => c._id !== id),
        currentCampaign: state.currentCampaign?._id === id 
          ? null 
          : state.currentCampaign,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete campaign';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  supportCampaign: async (id) => {
    try {
      await api.post(`/campaigns/${id}/support`);
      
      // Update campaign metrics locally
      set(state => ({
        campaigns: state.campaigns.map(c => 
          c._id === id 
            ? { ...c, metrics: { ...c.metrics, supporters: (c.metrics.supporters || 0) + 1 } }
            : c
        ),
        currentCampaign: state.currentCampaign?._id === id
          ? { 
              ...state.currentCampaign, 
              metrics: { 
                ...state.currentCampaign.metrics, 
                supporters: (state.currentCampaign.metrics.supporters || 0) + 1 
              }
            }
          : state.currentCampaign
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to support campaign';
      return { success: false, error: errorMessage };
    }
  },

  addCollaborator: async (campaignId, collaboratorData) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/collaborators`, collaboratorData);
      
      set(state => ({
        currentCampaign: state.currentCampaign?._id === campaignId
          ? { ...state.currentCampaign, collaborators: response.data.data }
          : state.currentCampaign
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add collaborator';
      return { success: false, error: errorMessage };
    }
  },

  fetchCampaignAnalytics: async (id) => {
    try {
      const response = await api.get(`/campaigns/${id}/analytics`);
      return { success: true, analytics: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analytics';
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
  
  clearCurrentCampaign: () => set({ currentCampaign: null })
}));

export default useCampaignStore;