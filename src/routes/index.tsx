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
import FamilyDetailsForm from '../pages/forms/FamilyDetailsForm';
import EmploymentForm from '../pages/forms/EmploymentForm';
import IncomeForm from '../pages/forms/IncomeForm';
import ExpensesForm from '../pages/forms/ExpensesForm';
import AssetsForm from '../pages/forms/AssetsForm';
import LiabilitiesForm from '../pages/forms/LiabilitiesForm';

// Dynamic Form Pages
import FormsList from '../pages/clients/forms/FormsList';
import DynamicForm from '../pages/clients/forms/DynamicForm';
import DualApplicantForm from '../pages/clients/forms/DualApplicantForm';
import DocumentUploadSingle from '../pages/clients/forms/DocumentUploadSingle';
import DocumentUploadDual from '../pages/clients/forms/DocumentUploadDual';

// Client Management (Coach/Admin)
import ClientManagement from '../pages/clients/ClientManagement';
import ClientProfile from '../pages/clients/ClientProfile';
import CreateClient from '../pages/clients/CreateClient';

// Coach Management (Admin only)
import CoachManagement from '../pages/coaches/CoachManagement';

// User Management (Admin only)
import UserManagement from '../pages/users/UserManagement';
import CreateUser from '../pages/users/CreateUser';

// Admin Tools
import FormConfigTool from '../pages/admin/FormConfigTool';

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
            path: 'admin/form-config',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <FormConfigTool />
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
              // Dynamic Form Routes (New)
              {
                index: true,
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <FormsList />
                  </RoleGuard>
                ),
              },
              {
                path: 'dynamic/new/:configId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DynamicForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'dynamic/:submissionId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DynamicForm />
                  </RoleGuard>
                ),
              },
              // Edit routes for dynamic forms
              {
                path: 'dynamic/edit/:submissionId/:configId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DynamicForm />
                  </RoleGuard>
                ),
              },
              // Dual Applicant Form Routes
              {
                path: 'dual-applicant/new/:configId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DualApplicantForm />
                  </RoleGuard>
                ),
              },
              {
                path: 'dual-applicant/:submissionId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DualApplicantForm />
                  </RoleGuard>
                ),
              },
              // Edit routes for dual applicant forms
              {
                path: 'dual-applicant/edit/:submissionId/:configId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DualApplicantForm />
                  </RoleGuard>
                ),
              },
              // Document Upload Routes
              {
                path: 'documents/single/:submissionId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DocumentUploadSingle />
                  </RoleGuard>
                ),
              },
              {
                path: 'documents/single/new',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DocumentUploadSingle />
                  </RoleGuard>
                ),
              },
              {
                path: 'documents/dual/:submissionId',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DocumentUploadDual />
                  </RoleGuard>
                ),
              },
              {
                path: 'documents/dual/new',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <DocumentUploadDual />
                  </RoleGuard>
                ),
              },
              // Existing Form Routes
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
                path: 'family-details/:personalId?',
                element: (
                  <RoleGuard allowedRoles={[UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN]}>
                    <FamilyDetailsForm />
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
        id: 'forms-management',
        label: 'Forms Management',
        path: '/dashboard/forms',
        icon: 'document-text',
        roles: [UserRole.ADMIN],
        children: [
          {
            id: 'available-forms',
            label: 'Available Forms',
            path: '/dashboard/forms',
            icon: 'document-text',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'form-config-tool',
            label: 'Form Configuration',
            path: '/dashboard/admin/form-config',
            icon: 'cog',
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
        id: 'forms',
        label: 'Forms',
        path: '/dashboard/forms',
        icon: 'document-text',
        roles: [UserRole.COACH],
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
            id: 'family-details',
            label: 'Family Information',
            path: '/dashboard/forms/family-details',
            icon: 'users',
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
            id: 'available-forms',
            label: 'Available Forms',
            path: '/dashboard/forms',
            icon: 'document-text',
            roles: [UserRole.CLIENT],
          }
        ],
      },
    ],
    [UserRole.GUEST]: [],
  };

  return [...baseItems, ...(roleSpecificItems[userRole] || [])];
}; 