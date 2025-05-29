# YWC Financial Coaching Platform - Frontend

A modern React frontend for the YWC Financial Coaching Platform with role-based access control, responsive design, and comprehensive form management.

## 🚀 Features Implemented

### ✅ Core Infrastructure
- **React 19** with TypeScript and Vite
- **Tailwind CSS v4** for styling
- **Axios** for API communication
- **React Router v7** for navigation
- **Role-based authentication** with JWT tokens

### ✅ Context Management
- **AuthContext**: User authentication and role management
- **ThemeContext**: Role-based themes (Admin=Blue, Coach=Green, Client=Orange)
- **NotificationContext**: Toast notifications and error handling

### ✅ Security Features
- JWT tokens stored in memory (not localStorage)
- Protected routes with authentication guards
- Role-based access control
- Automatic token refresh handling

### ✅ UI Components
- **NotificationContainer**: Toast notification system
- **ProtectedRoute**: Authentication guard component
- **RoleGuard**: Role-based access control component

### ✅ Routing Structure
```
/
├── /auth/login                 # Login page
├── /dashboard                  # Role-based dashboard redirect
│   ├── /admin                  # Admin dashboard
│   ├── /coach                  # Coach dashboard
│   ├── /client                 # Client dashboard
│   ├── /users                  # User management (Admin only)
│   ├── /clients                # Client management (Coach/Admin)
│   └── /forms                  # Financial forms
│       ├── /personal-details
│       ├── /employment
│       ├── /income
│       ├── /expenses
│       ├── /assets
│       └── /liabilities
├── /unauthorized               # Access denied page
└── /404                        # Not found page
```

## 🎨 Role-Based Themes

### Admin Theme (Blue)
- Primary: `#3B82F6`
- Focus on management and oversight
- Full system access

### Coach Theme (Green)
- Primary: `#10B981`
- Focus on client relationship management
- Client creation and form management

### Client Theme (Orange)
- Primary: `#F59E0B`
- Focus on personal financial profile
- Form filling and data management

## 🔐 Role-Based Access Control

### User Roles
1. **ADMIN**
   - Manage all users (ADMIN, COACH, CLIENT)
   - View all data across the platform
   - User and role management

2. **COACH**
   - Create and manage clients
   - Access client financial data
   - Fill forms on behalf of clients

3. **CLIENT**
   - Access and update own financial profile
   - Fill personal financial forms
   - View own data only

4. **GUEST**
   - Public content access only
   - Redirected to login for protected content

## 📊 API Integration

### Services Structure
```
src/services/
├── api.ts              # Base API service with axios
├── authService.ts      # Authentication operations
└── formService.ts      # Form data operations
```

### Supported Endpoints
- **Authentication**: `/auth/login`, `/auth/register`, `/auth/profile`
- **Personal Details**: CRUD operations for personal information
- **Employment**: CRUD operations for employment data
- **Income**: CRUD operations for income details
- **Expenses**: CRUD operations for expense tracking
- **Assets**: CRUD operations for asset management
- **Liabilities**: CRUD operations for liability tracking
- **Person Aggregation**: Complete financial profiles

## 🏗️ Architecture

### Context Providers
```tsx
<AuthProvider>
  <ThemeProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </ThemeProvider>
</AuthProvider>
```

### Type Safety
- Comprehensive TypeScript interfaces
- API response types
- Form data models
- User and role definitions

### State Management
- React Context for global state
- useReducer for complex state logic
- Custom hooks for reusable logic

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:3000`

### Environment Setup
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=YWC Financial Coaching Platform
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development
```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run build
npm run build

# Preview production build
npm run preview
```

## 📱 Responsive Design

- **Mobile-first approach** with Tailwind CSS
- **Adaptive layouts** for different screen sizes
- **Touch-friendly interfaces** for mobile devices
- **Keyboard navigation support** for accessibility

## 🔔 Notification System

- **Success notifications**: Green styling, auto-dismiss
- **Error notifications**: Red styling, longer duration
- **Warning notifications**: Yellow styling, standard duration
- **Info notifications**: Blue styling, standard duration
- **Custom actions**: Optional action buttons in notifications

## 🌙 Dark Mode Support

- **System preference detection**
- **Manual toggle** available
- **Persistent preference** storage
- **Role-specific color schemes** in both light and dark modes

## 🛡️ Security Considerations

- **JWT tokens in memory** (not localStorage)
- **Automatic logout** on token expiration
- **CSRF protection** through proper headers
- **Role-based route protection**
- **API error handling** with proper user feedback

## 🎯 Next Steps

To complete the application, you need to create:

1. **Layout Components**:
   - `RootLayout`, `AuthLayout`, `DashboardLayout`

2. **Page Components**:
   - Login page, dashboard pages, form pages

3. **Form Components**:
   - Dynamic form builders for each financial section

4. **UI Components**:
   - Buttons, inputs, cards, tables, modals

5. **Error Pages**:
   - 404, Unauthorized, Error boundary components

The foundation is solid and follows React best practices with proper TypeScript support, security measures, and scalable architecture.

## 📚 Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript React Documentation](https://react-typescript-cheatsheet.netlify.app/)
- [Axios Documentation](https://axios-http.com/)

## 🤝 Contributing

1. Follow the established patterns for new components
2. Maintain TypeScript types for all new features
3. Use the existing context providers for state management
4. Follow the role-based access control patterns
5. Ensure responsive design principles 