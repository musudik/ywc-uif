import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ClientProgress {
  personalDetails: boolean;
  employment: boolean;
  income: boolean;
  expenses: boolean;
  assets: boolean;
  liabilities: boolean;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        setProgress({
          personalDetails: true,
          employment: true,
          income: false,
          expenses: false,
          assets: false,
          liabilities: false,
        });
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your profile..." />;
  }

  const completedCount = progress ? Object.values(progress).filter(Boolean).length : 0;
  const totalForms = 6;
  const completionPercentage = Math.round((completedCount / totalForms) * 100);

  const formSections = [
    {
      title: 'Personal Details',
      description: 'Basic personal and contact information',
      path: '/dashboard/forms/personal-details',
      icon: '👤',
      completed: progress?.personalDetails || false,
    },
    {
      title: 'Employment',
      description: 'Job information and employment history',
      path: '/dashboard/forms/employment',
      icon: '💼',
      completed: progress?.employment || false,
    },
    {
      title: 'Income',
      description: 'Salary, bonuses, and other income sources',
      path: '/dashboard/forms/income',
      icon: '💰',
      completed: progress?.income || false,
    },
    {
      title: 'Expenses',
      description: 'Monthly expenses and recurring costs',
      path: '/dashboard/forms/expenses',
      icon: '💳',
      completed: progress?.expenses || false,
    },
    {
      title: 'Assets',
      description: 'Properties, investments, and valuables',
      path: '/dashboard/forms/assets',
      icon: '🏠',
      completed: progress?.assets || false,
    },
    {
      title: 'Liabilities',
      description: 'Loans, credit cards, and debt obligations',
      path: '/dashboard/forms/liabilities',
      icon: '📄',
      completed: progress?.liabilities || false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Financial Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome, {user?.first_name}! Complete your financial profile to get personalized coaching.
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile Completion
          </h2>
          <span className="text-2xl font-bold" style={{ color: colors.primary }}>
            {completionPercentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${completionPercentage}%`,
              backgroundColor: colors.primary 
            }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount} of {totalForms} sections completed. 
          {completedCount < totalForms && ' Complete all sections to unlock personalized insights.'}
        </p>
      </div>

      {/* Form Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formSections.map((section, index) => (
          <Link
            key={index}
            to={section.path}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 p-6 relative"
          >
            {section.completed && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: section.completed ? '#10B981' : colors.primary }}
              >
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {section.description}
                </p>
                <div className="flex items-center space-x-2">
                  {section.completed ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Completed
                    </span>
                  ) : (
                    <span className="text-sm font-medium" style={{ color: colors.primary }}>
                      Get Started
                    </span>
                  )}
                  <svg 
                    className="w-4 h-4" 
                    style={{ color: section.completed ? '#10B981' : colors.primary }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Next Steps
        </h2>
        
        {completionPercentage < 100 ? (
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Complete the remaining sections to unlock:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Personalized financial analysis</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Customized coaching recommendations</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Goal tracking and progress reports</span>
              </li>
            </ul>
            
            <div className="mt-4">
              {/* Find next incomplete section */}
              {(() => {
                const nextSection = formSections.find(section => !section.completed);
                return nextSection ? (
                  <Link to={nextSection.path}>
                    <Button>Continue with {nextSection.title}</Button>
                  </Link>
                ) : null;
              })()}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Profile Complete!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You've completed all sections. Your coach will review your information and provide personalized recommendations.
            </p>
            <Button variant="outline">
              View Financial Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 