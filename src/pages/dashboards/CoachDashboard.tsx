import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface CoachStats {
  totalClients: number;
  activeClients: number;
  completedForms: number;
  pendingReviews: number;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showInfo } = useNotification();
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setStats({
          totalClients: 23,
          activeClients: 18,
          completedForms: 67,
          pendingReviews: 5,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: '👥',
      color: colors.primary,
      link: '/dashboard/clients',
    },
    {
      title: 'Active This Month',
      value: stats?.activeClients || 0,
      icon: '🟢',
      color: '#10B981',
      link: '/dashboard/clients?status=active',
    },
    {
      title: 'Forms Completed',
      value: stats?.completedForms || 0,
      icon: '📋',
      color: '#F59E0B',
      link: '/dashboard/forms',
    },
    {
      title: 'Pending Reviews',
      value: stats?.pendingReviews || 0,
      icon: '⏰',
      color: '#EF4444',
      link: '/dashboard/reviews',
    },
  ];

  const recentClients = [
    { name: 'Alice Johnson', lastActivity: '2 hours ago', status: 'active', progress: 85 },
    { name: 'Bob Smith', lastActivity: '1 day ago', status: 'pending', progress: 60 },
    { name: 'Carol Davis', lastActivity: '3 days ago', status: 'completed', progress: 100 },
    { name: 'David Wilson', lastActivity: '1 week ago', status: 'inactive', progress: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Coach Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user?.first_name}! Here's your client overview.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => showInfo('Data Synced', 'Client data updated successfully')}
            variant="outline"
          >
            Sync Data
          </Button>
          <Link to="/dashboard/clients/create">
            <Button>Add New Client</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Clients */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Clients
            </h2>
            <Link to="/dashboard/clients">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last activity: {client.lastActivity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.progress}% Complete
                    </p>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${client.progress}%`,
                          backgroundColor: colors.primary 
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    client.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    client.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    client.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link to="/dashboard/clients/create" className="block">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">➕</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Add New Client</span>
                </div>
              </div>
            </Link>
            <Link to="/dashboard/forms/personal-details" className="block">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📝</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Create Form</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            This Week
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Forms Completed</span>
              <span className="font-medium text-gray-900 dark:text-white">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Client Meetings</span>
              <span className="font-medium text-gray-900 dark:text-white">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">New Clients</span>
              <span className="font-medium text-gray-900 dark:text-white">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 