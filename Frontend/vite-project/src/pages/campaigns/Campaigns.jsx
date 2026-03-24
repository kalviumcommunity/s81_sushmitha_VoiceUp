import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import useCampaignStore from '../../store/campaignStore';
import useAuthStore from '../../store/authStore';

const Campaigns = () => {
  const { campaigns, isLoading, fetchCampaigns } = useCampaignStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchCampaigns({
      search: searchTerm,
      category: selectedCategory,
      status: 'active'
    });
  }, [fetchCampaigns, searchTerm, selectedCategory]);

  const categories = [
    'climate', 'education', 'health', 'equality', 'governance', 
    'environment', 'social-justice', 'human-rights', 'other'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-2">Discover and support advocacy campaigns</p>
          </div>
          {user && ['Advocate', 'Organizer', 'Admin'].includes(user.role) && (
            <Link
              to="/campaigns/create"
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Campaigns
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by title, description..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="input-field"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading campaigns...</p>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="card-hover">
                <div className="flex items-center justify-between mb-4">
                  <span className="badge-primary">{campaign.category}</span>
                  <span className="text-sm text-gray-500">
                    {campaign.metrics?.supporters || 0} supporters
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Link 
                    to={`/campaigns/${campaign._id}`}
                    className="hover:text-primary-600 transition-colors duration-200"
                  >
                    {campaign.title}
                  </Link>
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {campaign.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {campaign.createdBy?.fullName}
                    </span>
                  </div>
                  <Link
                    to={`/campaigns/${campaign._id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Learn More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No campaigns found</p>
            {user && ['Advocate', 'Organizer', 'Admin'].includes(user.role) && (
              <Link
                to="/campaigns/create"
                className="btn-primary inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create the First Campaign
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;