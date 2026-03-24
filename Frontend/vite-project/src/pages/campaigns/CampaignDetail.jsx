import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useCampaignStore from '../../store/campaignStore';

const CampaignDetail = () => {
  const { id } = useParams();
  const { currentCampaign, isLoading, fetchCampaignById } = useCampaignStore();

  useEffect(() => {
    if (id) {
      fetchCampaignById(id);
    }
  }, [id, fetchCampaignById]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCampaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Campaign not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="mb-6">
            <span className="badge-primary">{currentCampaign.category}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentCampaign.title}
          </h1>
          
          <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
            <span>By {currentCampaign.createdBy?.fullName}</span>
            <span>•</span>
            <span>{currentCampaign.metrics?.supporters || 0} supporters</span>
          </div>
          
          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 leading-relaxed">
              {currentCampaign.description}
            </p>
          </div>
          
          <div className="border-t pt-6">
            <button className="btn-primary">
              Support This Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;