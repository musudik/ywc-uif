import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

// Layout Components
import RootLayout from '../components/layout/RootLayout';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

// Dashboard Pages
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import CoachDashboard from '../pages/dashboards/CoachDashboard';
import ClientDashboard from '../pages/dashboards/ClientDashboard';

// Form Pages
import PersonalDetailsForm from '../pages/forms/PersonalDetailsForm';
import EmploymentForm from '../pages/forms/EmploymentForm';
import IncomeForm from '../pages/forms/IncomeForm';
import ExpensesForm from '../pages/forms/ExpensesForm';
import AssetsForm from '../pages/forms/AssetsForm';
import LiabilitiesForm from '../pages/forms/LiabilitiesForm';

// Client Management (Coach/Admin)
import ClientManagement from '../pages/clients/ClientManagement';
import ClientProfile from '../pages/clients/ClientProfile';
import CreateClient from '../pages/clients/CreateClient';

// Coach Management (Admin only)
import CoachManagement from '../pages/coaches/CoachManagement';

// User Management (Admin only)
import UserManagement from '../pages/users/UserManagement';
import CreateUser from '../pages/users/CreateUser';

// Error Pages
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';

// Route Guards
import ProtectedRoute from '../components/routing/ProtectedRoute';
import RoleGuard from '../components/routing/RoleGuard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            index: true,
            element: <Navigate to="/auth/login" replace />,
          },
        ],
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <RoleDashboardRedirect />,
          },
          // Admin Routes
          {
            path: 'admin',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </RoleGuard>
            ),
          },
          {
            path: 'users',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <UserManagement />
              </RoleGuard>
            ),
          },
          {
            path: 'users/create',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <CreateUser />
              </RoleGuard>
            ),
          },
          {
            path: 'coaches',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <CoachManagement />
              </RoleGuard>
            ),
          },
          // Coach Routes
          {
            path: 'coach',
            element: (
              <RoleGuard allowedRoles={[UserRole.COACH]}>
                <CoachDashboard />
              </RoleGuard>
            ),
          },
          {
            path: 'clients',
            element: (
              <RoleGuard allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <ClientManagement />
              </RoleGuard>
            ),
          },
          {
            path: 'clients/create',
            element: (
              <RoleGuard allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <CreateClient />
              </RoleGuard>
            ),
          },
          {
            path: 'clients/:clientId',
            element: (
              <RoleGuard allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <ClientProfile />
              </RoleGuard>
            ),
          },
          // Client Routes
          {
            path: 'client',
            element: (
              <RoleGuard allowedRoles={[UserRole.CLIENT]}>
                <ClientDashboard />
              </RoleGuard>
            ),
          },
          // Form Routes (Role-sensitive)
          {
            path: 'forms',
            children: [
              {
                path: 'personal-details',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <PersonalDetailsForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'personal-details/:personalId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <PersonalDetailsForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'employment/:personalId?',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <EmploymentForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'income/:personalId?',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <IncomeForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'expenses/:personalId?',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <ExpensesForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'assets/:personalId?',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <AssetsForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'liabilities/:personalId?',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <LiabilitiesForm />
                  </RoleGuard>
                ),
              },
            ],
          },
        ],
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

// Component to redirect to role-specific dashboard
function RoleDashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  const dashboardPath = roleRoutes[user.role];
  return <Navigate to={dashboardPath} replace />;
}

// Export route configuration for role-based navigation
export const roleRoutes = {
  [UserRole.ADMIN]: '/dashboard/admin',
  [UserRole.COACH]: '/dashboard/coach',
  [UserRole.CLIENT]: '/dashboard/client',
  [UserRole.GUEST]: '/auth/login',
};

// Navigation item interface
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavigationItem[];
}

// Navigation items based on role
export const getNavigationItems = (userRole: UserRole): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: roleRoutes[userRole],
      icon: 'home',
      roles: [UserRole.ADMIN, UserRole.COACH, UserRole.CLIENT],
    },
  ];

  const roleSpecificItems: Record<UserRole, NavigationItem[]> = {
    [UserRole.ADMIN]: [
      {
        id: 'platform-management',
        label: 'Platform Management',
        path: '/dashboard/users',
        icon: 'cog',
        roles: [UserRole.ADMIN],
        children: [
          {
            id: 'coaches',
            label: 'Coaches',
            path: '/dashboard/coaches',
            icon: 'coach',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'clients',
            label: 'Clients',
            path: '/dashboard/clients',
            icon: 'user-group',
            roles: [UserRole.ADMIN],
          },
        ],
      },
      {
        id: 'client-oversight',
        label: 'Client Oversight',
        path: '/dashboard/clients',
        icon: 'user-group',
        roles: [UserRole.ADMIN],
        children: [
          {
            id: 'all-clients',
            label: 'All Clients',
            path: '/dashboard/clients',
            icon: 'users',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'create-client',
            label: 'Add New Client',
            path: '/dashboard/clients/create',
            icon: 'user-plus',
            roles: [UserRole.ADMIN],
          },
        ],
      },
      {
        id: 'reports-analytics',
        label: 'Reports & Analytics',
        path: '/dashboard/reports',
        icon: 'chart-bar',
        roles: [UserRole.ADMIN],
        children: [
          {
            id: 'platform-analytics',
            label: 'Platform Analytics',
            path: '/dashboard/reports/platform',
            icon: 'chart-line',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'user-reports',
            label: 'User Reports',
            path: '/dashboard/reports/users',
            icon: 'document-chart-bar',
            roles: [UserRole.ADMIN],
          },
        ],
      },
    ],
    [UserRole.COACH]: [
      {
        id: 'client-management',
        label: 'Client Management',
        path: '/dashboard/clients',
        icon: 'user-group',
        roles: [UserRole.COACH],
        children: [
          {
            id: 'my-clients',
            label: 'My Clients',
            path: '/dashboard/clients',
            icon: 'users',
            roles: [UserRole.COACH],
          },
          {
            id: 'add-client',
            label: 'Add New Client',
            path: '/dashboard/clients/create',
            icon: 'user-plus',
            roles: [UserRole.COACH],
          },
        ],
      },
      {
        id: 'coaching-tools',
        label: 'Coaching Tools',
        path: '/dashboard/tools',
        icon: 'wrench-screwdriver',
        roles: [UserRole.COACH],
        children: [
          {
            id: 'financial-planning',
            label: 'Financial Planning',
            path: '/dashboard/tools/planning',
            icon: 'calculator',
            roles: [UserRole.COACH],
          },
          {
            id: 'goal-tracking',
            label: 'Goal Tracking',
            path: '/dashboard/tools/goals',
            icon: 'flag',
            roles: [UserRole.COACH],
          },
          {
            id: 'client-progress',
            label: 'Client Progress',
            path: '/dashboard/tools/progress',
            icon: 'chart-line',
            roles: [UserRole.COACH],
          },
        ],
      },
      {
        id: 'resources',
        label: 'Resources',
        path: '/dashboard/resources',
        icon: 'book-open',
        roles: [UserRole.COACH],
        children: [
          {
            id: 'financial-guides',
            label: 'Financial Guides',
            path: '/dashboard/resources/guides',
            icon: 'document-text',
            roles: [UserRole.COACH],
          },
          {
            id: 'templates',
            label: 'Templates',
            path: '/dashboard/resources/templates',
            icon: 'document-duplicate',
            roles: [UserRole.COACH],
          },
        ],
      },
    ],
    [UserRole.CLIENT]: [
      {
        id: 'financial-profile',
        label: 'Profile',
        path: '/dashboard/forms/personal-details',
        icon: 'identification',
        roles: [UserRole.CLIENT],
        children: [
          {
            id: 'personal-details',
            label: 'Personal Information',
            path: '/dashboard/forms/personal-details',
            icon: 'user',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'employment',
            label: 'Employment Details',
            path: '/dashboard/forms/employment',
            icon: 'briefcase',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'income',
            label: 'Income Sources',
            path: '/dashboard/forms/income',
            icon: 'banknotes',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'expenses',
            label: 'Monthly Expenses',
            path: '/dashboard/forms/expenses',
            icon: 'credit-card',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'assets',
            label: 'Assets & Investments',
            path: '/dashboard/forms/assets',
            icon: 'building-library',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'liabilities',
            label: 'Debts & Liabilities',
            path: '/dashboard/forms/liabilities',
            icon: 'document-minus',
            roles: [UserRole.CLIENT],
          },
        ],
      },
      {
        id: 'forms  ',
        label: 'Forms',
        path: '/dashboard/forms',
        icon: 'document-text',
        roles: [UserRole.CLIENT],
        children: [
          {
            id: 'self-disclosure',
            label: 'Self Disclosure',
            path: '/dashboard/forms/self-disclosure',
            icon: 'user-circle',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'loans',
            label: 'Loans',
            path: '/dashboard/forms/loans',
            icon: 'calendar',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'insurance',
            label: 'Insurance',
            path: '/dashboard/forms/insurance',
            icon: 'chart-line',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'taxes',
            label: 'Taxes',
            path: '/dashboard/forms/taxes',
            icon: 'chart-line',
            roles: [UserRole.CLIENT],
          },
        ],
      },
      {
        id: 'financial-overview',
        label: 'Financial Overview',
        path: '/dashboard/overview',
        icon: 'chart-pie',
        roles: [UserRole.CLIENT],
        children: [
          {
            id: 'net-worth',
            label: 'Net Worth Summary',
            path: '/dashboard/overview/net-worth',
            icon: 'scale',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'budget-analysis',
            label: 'Budget Analysis',
            path: '/dashboard/overview/budget',
            icon: 'calculator',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'cash-flow',
            label: 'Cash Flow',
            path: '/dashboard/overview/cash-flow',
            icon: 'arrow-trending-up',
            roles: [UserRole.CLIENT],
          },
        ],
      },
      {
        id: 'goals-planning',
        label: 'Goals & Planning',
        path: '/dashboard/planning',
        icon: 'flag',
        roles: [UserRole.CLIENT],
        children: [
          {
            id: 'financial-goals',
            label: 'Financial Goals',
            path: '/dashboard/planning/goals',
            icon: 'trophy',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'retirement-planning',
            label: 'Retirement Planning',
            path: '/dashboard/planning/retirement',
            icon: 'home-modern',
            roles: [UserRole.CLIENT],
          },
          {
            id: 'debt-payoff',
            label: 'Debt Payoff Strategy',
            path: '/dashboard/planning/debt',
            icon: 'arrow-down-circle',
            roles: [UserRole.CLIENT],
          },
        ],
      },
    ],
    [UserRole.GUEST]: [],
  };

  return [...baseItems, ...(roleSpecificItems[userRole] || [])];
}; 