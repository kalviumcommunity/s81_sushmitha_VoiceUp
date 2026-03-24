import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MegaphoneIcon, 
  DocumentTextIcon,
  CalendarDaysIcon,
  TrophyIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';
import useCampaignStore from '../store/campaignStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { campaigns, fetchCampaigns } = useCampaignStore();

  useEffect(() => {
    fetchCampaigns({ createdBy: user?.id });
  }, [fetchCampaigns, user?.id]);

  const stats = [
    { 
      name: 'Impact Points', 
      value: user?.impactPoints || 0, 
      icon: TrophyIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    { 
      name: 'Campaigns Created', 
      value: campaigns.length, 
      icon: MegaphoneIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    },
    { 
      name: 'Petitions Signed', 
      value: 0, 
      icon: DocumentTextIcon,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100'
    },
    { 
      name: 'Events Attended', 
      value: 0, 
      icon: CalendarDaysIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const quickActions = [
    {
      name: 'Create Campaign',
      description: 'Start a new advocacy campaign',
      href: '/campaigns/create',
      icon: MegaphoneIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      available: ['Advocate', 'Organizer', 'Admin'].includes(user?.role)
    },
    {
      name: 'Create Petition',
      description: 'Launch a petition for signatures',
      href: '/petitions/create',
      icon: DocumentTextIcon,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
      available: ['Advocate', 'Organizer', 'Admin'].includes(user?.role)
    },
    {
      name: 'Organize Event',
      description: 'Plan an advocacy event',
      href: '/events/create',
      icon: CalendarDaysIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      available: ['Organizer', 'Admin'].includes(user?.role)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your advocacy efforts
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.filter(action => action.available).map((action) => (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                  >
                    <div className={`p-2 ${action.bgColor} rounded-lg`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{action.name}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
                <Link
                  to="/campaigns"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              
              {campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                        <span className={`badge ${
                          campaign.status === 'active' ? 'badge-secondary' : 'badge-primary'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {campaign.metrics?.supporters || 0} supporters
                        </span>
                        <Link
                          to={`/campaigns/${campaign._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MegaphoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You haven't created any campaigns yet</p>
                  {['Advocate', 'Organizer', 'Admin'].includes(user?.role) && (
                    <Link
                      to="/campaigns/create"
                      className="btn-primary inline-flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;