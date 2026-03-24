import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MegaphoneIcon, 
  UsersIcon, 
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import useCampaignStore from '../store/campaignStore';

const Home = () => {
  const { trendingCampaigns, fetchTrendingCampaigns } = useCampaignStore();
  const [stats, setStats] = useState({
    campaigns: 1250,
    signatures: 45000,
    events: 320,
    users: 8500
  });

  useEffect(() => {
    fetchTrendingCampaigns();
  }, [fetchTrendingCampaigns]);

  const features = [
    {
      name: 'Create Campaigns',
      description: 'Launch powerful advocacy campaigns that mobilize communities and drive real change.',
      icon: MegaphoneIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    },
    {
      name: 'Collect Signatures',
      description: 'Gather petition signatures with real-time tracking and milestone celebrations.',
      icon: DocumentTextIcon,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100'
    },
    {
      name: 'Organize Events',
      description: 'Plan and manage advocacy events with built-in registration and attendance tracking.',
      icon: CalendarDaysIcon,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100'
    },
    {
      name: 'Build Community',
      description: 'Connect with like-minded advocates and collaborate on causes that matter.',
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const impactStats = [
    { label: 'Active Campaigns', value: stats.campaigns, icon: MegaphoneIcon },
    { label: 'Petition Signatures', value: stats.signatures, icon: DocumentTextIcon },
    { label: 'Events Organized', value: stats.events, icon: CalendarDaysIcon },
    { label: 'Community Members', value: stats.users, icon: UsersIcon }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Amplify Your Voice for
              <span className="block text-yellow-300">Positive Change</span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of advocates creating campaigns, collecting signatures, and organizing events 
              to drive meaningful social impact in their communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-primary-700 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-lg"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/campaigns"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-lg text-white hover:bg-white hover:text-primary-700 transition-colors duration-200"
              >
                Explore Campaigns
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float">
          <SparklesIcon className="h-8 w-8 text-yellow-300 opacity-60" />
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <TrophyIcon className="h-10 w-10 text-yellow-300 opacity-60" />
        </div>
        <div className="absolute bottom-20 left-20 animate-float" style={{ animationDelay: '2s' }}>
          <HeartIcon className="h-6 w-6 text-pink-300 opacity-60" />
        </div>
      </div>

      {/* Impact Stats */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Growing Impact</h2>
            <p className="text-lg text-gray-600">Together, we're making a difference across the globe</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {impactStats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <stat.icon className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Drive Change
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides powerful tools to help you organize, mobilize, and measure your impact
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card-hover text-center">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 ${feature.bgColor} rounded-full`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.name}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Campaigns */}
      {trendingCampaigns.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending Campaigns</h2>
                <p className="text-lg text-gray-600">Join these popular movements making waves</p>
              </div>
              <Link
                to="/campaigns"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Campaigns
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingCampaigns.slice(0, 3).map((campaign) => (
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
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Make Your Voice Heard?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our community of changemakers and start creating the impact you want to see in the world.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-primary-700 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-lg"
            >
              Start Your First Campaign
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;