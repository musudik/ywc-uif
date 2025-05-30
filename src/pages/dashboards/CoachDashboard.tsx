import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';
import { formService } from '../../services/formService';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface CoachStats {
  totalClients: number;
  activeClients: number;
  completedForms: number;
  pendingReviews: number;
}

interface ClientProgress {
  personal_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  applicant_type: string;
  last_activity: string;
  status: string;
  progress: number;
  completedSections: number;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showInfo, showError } = useNotification();
  const { t } = useLanguage();
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [recentClients, setRecentClients] = useState<ClientProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load coach's clients
      const clients = await authService.getCoachClients();
      
      // Calculate progress for each client
      const clientsWithProgress = await Promise.all(
        clients.map(async (client) => {
          try {
            const progressStatus = {
              personalDetails: false,
              familyDetails: false,
              employment: false,
              income: false,
              expenses: false,
              assets: false,
              liabilities: false,
            };

            const userId = client.user_id;

            // Check Personal Details
            try {
              await formService.getPersonalDetailsById(userId);
              progressStatus.personalDetails = true;
            } catch (error) {
              console.log('Personal details not found');
            }

            // Check Family Details
            try {
              const familyMembers = await formService.getFamilyMembersByUserId(userId);
              progressStatus.familyDetails = familyMembers && familyMembers.length > 0;
            } catch (error) {
              console.log('Family details not found');
            }

            // Check Employment
            try {
              const employment = await formService.getEmploymentById(userId);
              progressStatus.employment = employment ? true : false;
            } catch (error) {
              console.log('Employment details not found');
            }

            // Check Income
            try {
              const income = await formService.getIncomeById(userId);
              progressStatus.income = income ? true : false;
            } catch (error) {
              console.log('Income details not found');
            }

            // Check Expenses
            try {
              const expenses = await formService.getExpensesById(userId);
              progressStatus.expenses = expenses ? true : false;
            } catch (error) {
              console.log('Expenses details not found');
            }

            // Check Assets
            try {
              const assets = await formService.getAssetById(userId);
              progressStatus.assets = assets ? true : false;
            } catch (error) {
              console.log('Assets details not found');
            }

            // Check Liabilities
            try {
              const liabilities = await formService.getLiabilityById(userId);
              progressStatus.liabilities = liabilities ? true : false;
            } catch (error) {
              console.log('Liabilities details not found');
            }


            const completedSections = Object.values(progressStatus).filter(Boolean).length;
            const progressPercentage = Math.round((completedSections / 7) * 100);

            // Determine status based on progress
            let status = 'inactive';
            if (progressPercentage === 100) {
              status = 'completed';
            } else if (progressPercentage > 0) {
              status = 'active';
            } else {
              status = 'pending';
            }

            // Calculate last activity (mock for now, should come from actual activity data)
            const createdDate = new Date(client.created_at);
            const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            let lastActivity = '';
            if (daysSinceCreated === 0) {
              lastActivity = 'Today';
            } else if (daysSinceCreated === 1) {
              lastActivity = '1 day ago';
            } else if (daysSinceCreated < 7) {
              lastActivity = `${daysSinceCreated} days ago`;
            } else if (daysSinceCreated < 30) {
              lastActivity = `${Math.floor(daysSinceCreated / 7)} week${Math.floor(daysSinceCreated / 7) > 1 ? 's' : ''} ago`;
            } else {
              lastActivity = `${Math.floor(daysSinceCreated / 30)} month${Math.floor(daysSinceCreated / 30) > 1 ? 's' : ''} ago`;
            }

            return {
              personal_id: client.personal_id,
              first_name: client.first_name,
              last_name: client.last_name,
              email: client.email,
              created_at: client.created_at,
              applicant_type: client.applicant_type,
              last_activity: lastActivity,
              status,
              progress: progressPercentage,
              completedSections,
            };
          } catch (error) {
            console.error('Error calculating progress for client:', client.personal_id, error);
            return {
              personal_id: client.personal_id,
              first_name: client.first_name,
              last_name: client.last_name,
              email: client.email,
              created_at: client.created_at,
              applicant_type: client.applicant_type,
              last_activity: 'Unknown',
              status: 'inactive',
              progress: 0,
              completedSections: 0,
            };
          }
        })
      );

      // Sort by most recent activity
      clientsWithProgress.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Take only the first 4 for recent clients display
      setRecentClients(clientsWithProgress.slice(0, 4));

      // Calculate stats
      const totalClients = clientsWithProgress.length;
      const activeClients = clientsWithProgress.filter(c => c.status === 'active' || c.status === 'completed').length;
      const completedForms = clientsWithProgress.reduce((sum, client) => sum + client.completedSections, 0);
      const pendingReviews = clientsWithProgress.filter(c => c.status === 'completed').length;

      setStats({
        totalClients,
        activeClients,
        completedForms,
        pendingReviews,
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showError(t('notifications.loadFailed'), t('notifications.loadFailed'));
      // Set empty data on error
      setRecentClients([]);
      setStats({
        totalClients: 0,
        activeClients: 0,
        completedForms: 0,
        pendingReviews: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text={t('common.loading')} />;
  }

  const statCards = [
    {
      title: t('dashboard.coach.totalClients'),
      value: stats?.totalClients || 0,
      icon: '👥',
      color: colors.primary,
      link: '/dashboard/clients',
    },
    {
      title: t('dashboard.coach.activeThisMonth'),
      value: stats?.activeClients || 0,
      icon: '🟢',
      color: '#10B981',
      link: '/dashboard/clients?status=active',
    },
    {
      title: t('dashboard.coach.formsCompleted'),
      value: stats?.completedForms || 0,
      icon: '📋',
      color: '#F59E0B',
      link: '/dashboard/forms',
    },
    {
      title: t('dashboard.coach.pendingReviews'),
      value: stats?.pendingReviews || 0,
      icon: '⏰',
      color: '#EF4444',
      link: '/dashboard/reviews',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.coach.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('dashboard.coach.welcome', { name: user?.first_name || 'Coach' })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              loadDashboardData();
              showInfo(t('dashboard.coach.dataSynced'), t('dashboard.coach.dataSyncedMessage'));
            }}
            variant="outline"
          >
            {t('dashboard.coach.syncData')}
          </Button>
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
              {t('dashboard.coach.recentClients')}
            </h2>
            <Link to="/dashboard/clients">
              <Button variant="ghost" size="sm">{t('common.view')} All</Button>
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentClients.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('dashboard.coach.noClientsYet')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('dashboard.coach.noClientsMessage')}
              </p>
              <Link to="/dashboard/clients/create">
                <Button>{t('dashboard.coach.addFirstClient')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-10 h-10 flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {client.first_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('dashboard.coach.lastActivity')}: {client.last_activity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('dashboard.coach.percentComplete', { percent: client.progress.toString() })}
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
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.coach.quickActions')}
          </h3>
          <div className="space-y-3">
            <Link to="/dashboard/clients/create" className="block">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">➕</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.coach.addNewClient')}</span>
                </div>
              </div>
            </Link>
            <Link to="/dashboard/forms/personal-details" className="block">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📝</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.coach.createForm')}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.coach.thisWeek')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.coach.formsCompleted')}</span>
              <span className="font-medium text-gray-900 dark:text-white">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.coach.clientMeetings')}</span>
              <span className="font-medium text-gray-900 dark:text-white">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.coach.newClients')}</span>
              <span className="font-medium text-gray-900 dark:text-white">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 