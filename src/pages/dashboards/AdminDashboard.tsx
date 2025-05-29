import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalUsers: number;
  totalCoaches: number;
  totalClients: number;
  totalForms: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showInfo } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      try {
        // In real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats({
          totalUsers: 156,
          totalCoaches: 12,
          totalClients: 89,
          totalForms: 342,
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
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: colors.primary,
      link: '/dashboard/users',
    },
    {
      title: 'Coaches',
      value: stats?.totalCoaches || 0,
      icon: '👨‍🏫',
      color: '#10B981',
      link: '/dashboard/users?role=coach',
    },
    {
      title: 'Clients',
      value: stats?.totalClients || 0,
      icon: '👤',
      color: '#F59E0B',
      link: '/dashboard/clients',
    },
    {
      title: 'Forms Completed',
      value: stats?.totalForms || 0,
      icon: '📋',
      color: '#8B5CF6',
      link: '/dashboard/reports',
    },
  ];

  const quickActions = [
    {
      title: 'Create New User',
      description: 'Add a new admin, coach, or client to the system',
      link: '/dashboard/users/create',
      icon: '➕',
    },
    {
      title: 'Manage Users',
      description: 'View and manage all system users',
      link: '/dashboard/users',
      icon: '⚙️',
    },
    {
      title: 'Client Management',
      description: 'Overview of all clients and their coaches',
      link: '/dashboard/clients',
      icon: '📊',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user?.first_name}! Here's what's happening today.
          </p>
        </div>
        <Button
          onClick={() => showInfo('Dashboard Updated', 'Data refreshed successfully')}
          variant="outline"
        >
          Refresh Data
        </Button>
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

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Common administrative tasks
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{action.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { user: 'John Doe', action: 'completed Personal Details form', time: '2 hours ago' },
              { user: 'Jane Smith', action: 'was assigned to Coach Mike', time: '4 hours ago' },
              { user: 'Coach Sarah', action: 'created new client profile', time: '6 hours ago' },
              { user: 'Admin', action: 'updated system settings', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activity.user}
                  </span>{' '}
                  {activity.action}
                  <span className="text-gray-500 ml-2">{activity.time}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 