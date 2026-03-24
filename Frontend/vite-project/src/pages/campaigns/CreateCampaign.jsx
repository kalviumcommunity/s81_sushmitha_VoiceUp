import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useCampaignStore from '../../store/campaignStore';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { createCampaign, isLoading } = useCampaignStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const categories = [
    'climate', 'education', 'health', 'equality', 'governance', 
    'environment', 'social-justice', 'human-rights', 'other'
  ];

  const onSubmit = async (data) => {
    const result = await createCampaign(data);
    
    if (result.success) {
      toast.success('Campaign created successfully!');
      navigate(`/campaigns/${result.campaign._id}`);
    } else {
      toast.error(result.error || 'Failed to create campaign');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-600 mt-2">Start a new advocacy campaign to drive change</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Title
            </label>
            <input
              {...register('title', {
                required: 'Title is required',
                maxLength: { value: 200, message: 'Title must be less than 200 characters' }
              })}
              type="text"
              className="input-field"
              placeholder="Enter a compelling campaign title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                maxLength: { value: 5000, message: 'Description must be less than 5000 characters' }
              })}
              rows={6}
              className="input-field"
              placeholder="Describe your campaign, its goals, and why it matters..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="input-field"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              {...register('targetAudience', {
                required: 'Target audience is required',
                maxLength: { value: 500, message: 'Target audience must be less than 500 characters' }
              })}
              type="text"
              className="input-field"
              placeholder="Who are you trying to reach? (e.g., Local government, School boards, etc.)"
            />
            {errors.targetAudience && (
              <p className="mt-1 text-sm text-red-600">{errors.targetAudience.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;