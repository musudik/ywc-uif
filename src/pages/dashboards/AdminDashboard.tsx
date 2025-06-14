import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalCoaches: number;
  totalClients: number;
  totalForms: number;
}

interface RecentActivity {
  user: string;
  action: string;
  time: string;
  type: 'client' | 'coach' | 'form' | 'system';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showInfo, showError } = useNotification();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all users, coaches, and clients
      const [allCoaches, allClients] = await Promise.all([
        authService.getAllCoaches(), 
        authService.getAllClients()
      ]);

      // Calculate total completed forms across all clients
      let totalCompletedForms = 0;
      const activities: RecentActivity[] = [];

      // Process each client to count forms and create activity entries
      for (const client of allClients) {
        try {
          const userId = client.id; // Use client.id directly
          let clientCompletedForms = 0;
          
          // Check each form section
          const formChecks = [
            { service: () => formService.getPersonalDetailsById(userId), name: t('dashboard.client.personalInfo') },
            { service: () => formService.getFamilyMembersByUserId(userId), name: t('dashboard.client.familyInfo') },
            { service: () => formService.getEmploymentById(userId), name: t('dashboard.client.employmentDetails') },
            { service: () => formService.getIncomeById(userId), name: t('dashboard.client.incomeDetails') },
            { service: () => formService.getExpensesByUserId(userId), name: t('dashboard.client.monthlyExpenses') },
            { service: () => formService.getAssetById(userId), name: t('dashboard.client.assetsInvestments') },
            { service: () => formService.getLiabilityById(userId), name: t('dashboard.client.debtsLiabilities') }
          ];

          for (const formCheck of formChecks) {
            try {
              const result = await formCheck.service();
              // Special handling for family details which returns an array
              if (formCheck.name === 'Family Details') {
                if (result && Array.isArray(result) && result.length > 0) {
                  clientCompletedForms++;
                  
                  // Add to recent activities (only for recently created clients)
                  // Since we don't have created_at in the client object, we'll skip time-based filtering for now
                  activities.push({
                    user: `${client.first_name} ${client.last_name}`,
                    action: t('dashboard.admin.completedForm', { formName: formCheck.name }),
                    time: t('dashboard.admin.recently'),
                    type: 'form'
                  });
                }
              } else {
                // For other forms, just check if result exists
                clientCompletedForms++;
                
                // Add to recent activities (only for recently created clients)
                // Since we don't have created_at in the client object, we'll skip time-based filtering for now
                activities.push({
                  user: `${client.first_name} ${client.last_name}`,
                  action: t('dashboard.admin.completedForm', { formName: formCheck.name }),
                  time: t('dashboard.admin.recently'),
                  type: 'form'
                });
              }
            } catch (error) {
              // Form not completed, continue
            }
          }
          
          totalCompletedForms += clientCompletedForms;
        } catch (error) {
          console.error('Error processing client:', client.id, error);
        }
      }

      // Add coach creation activities (with safety check)
      allCoaches.forEach(coach => {
        if ('created_at' in coach && coach.created_at && typeof coach.created_at === 'string') {
          const coachCreatedDate = new Date(coach.created_at);
          const daysSinceCreated = Math.floor((Date.now() - coachCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreated <= 7) {
            activities.push({
              user: t('dashboard.admin.admin'),
              action: t('dashboard.admin.createdCoachAccount', { coachName: `${coach.first_name} ${coach.last_name}` }),
              time: daysSinceCreated === 0 ? t('dashboard.admin.today') : 
                    daysSinceCreated === 1 ? t('dashboard.admin.oneDayAgo') : 
                    t('dashboard.admin.daysAgo', { days: daysSinceCreated.toString() }),
              type: 'coach'
            });
          }
        }
      });

      // Add client creation activities (with safety check)
      allClients.forEach(client => {
        // Since clients from getAllClients might not have created_at, we'll add a generic activity
        activities.push({
          user: t('dashboard.admin.system'),
          action: t('dashboard.admin.clientRegistered', { clientName: `${client.first_name} ${client.last_name}` }),
          time: t('dashboard.admin.recently'),
          type: 'client'
        });
      });

      // Limit activities to avoid too many entries
      const limitedActivities = activities.slice(0, 6);

      setStats({
        totalCoaches: allCoaches.length,
        totalClients: allClients.length,
        totalForms: totalCompletedForms,
      });

      setRecentActivities(limitedActivities);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showError(t('notifications.loadFailed'), t('notifications.loadFailed'));
      // Set empty data on error
      setStats({
        totalCoaches: 0,
        totalClients: 0,
        totalForms: 0,
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text={t('common.loading')} />;
  }

  const statCards = [
    {
      title: t('dashboard.admin.totalCoaches'),
      value: stats?.totalCoaches || 0,
      icon: '👨‍🏫',
      color: '#10B981',
      link: '/dashboard/users?role=COACH',
    },
    {
      title: t('dashboard.admin.totalClients'),
      value: stats?.totalClients || 0,
      icon: '👤',
      color: '#F59E0B',
      link: '/dashboard/clients',
    },
    {
      title: t('dashboard.admin.formsCompleted'),
      value: stats?.totalForms || 0,
      icon: '📋',
      color: '#8B5CF6',
      link: '/dashboard/reports',
    },
  ];

  const quickActions = [
    {
      title: t('dashboard.admin.manageCoaches'),
      description: t('dashboard.admin.manageCoachesDesc'),
      link: '/dashboard/coaches',
      icon: '👨‍🏫',
    },
    {
      title: t('dashboard.admin.clientManagement'),
      description: t('dashboard.admin.clientManagementDesc'),
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
            {t('dashboard.admin.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('dashboard.admin.welcome', { name: user?.first_name || 'Admin' })}
          </p>
        </div>
        <Button
          onClick={() => {
            loadDashboardData();
            showInfo(t('dashboard.admin.refreshData'), t('dashboard.admin.refreshData'));
          }}
          variant="outline"
        >
          {t('dashboard.admin.refreshData')}
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
            {t('dashboard.admin.quickActions')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.admin.quickActions')}
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
            {t('dashboard.admin.recentActivity')}
          </h2>
        </div>
        <div className="p-6">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('dashboard.admin.noRecentActivity')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.admin.noActivityMessage')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
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
          )}
        </div>
      </div>
    </div>
  );
} 