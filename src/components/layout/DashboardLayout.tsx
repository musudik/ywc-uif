import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNavigationItems } from '../../routes';
import { APP_CONFIG } from '../../config/constants';
import Button from '../ui/Button';
import YWCLogo from '../../assets/YWC.png';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleMode, colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  const navigationItems = user ? getNavigationItems(user.role) : [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (itemId: string) => {
    setActiveDropdown(activeDropdown === itemId ? null : itemId);
    setProfileDropdownOpen(false);
    setLanguageDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    setActiveDropdown(null);
    setLanguageDropdownOpen(false);
  };

  const toggleLanguageDropdown = () => {
    setLanguageDropdownOpen(!languageDropdownOpen);
    setActiveDropdown(null);
    setProfileDropdownOpen(false);
  };

  const handleLanguageChange = (language: typeof languages[0]) => {
    setCurrentLanguage(language);
    setLanguageDropdownOpen(false);
    // Here you would implement actual language switching logic
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text 
      }}
    >
      {/* Professional Top Navigation Bar */}
      <nav 
        className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300"
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        {/* Top Bar with Logo and Actions - Center Aligned */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo Section */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <Link to="/dashboard" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <img 
                      src={YWCLogo} 
                      alt="Your Wealth Coach"
                      className="w-10 h-10 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-200"
                      style={{ 
                        filter: mode === 'dark' ? 'brightness(1.1)' : 'brightness(1)',
                      }}
                    />
                    <div 
                      className="absolute -inset-1 rounded-xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-200"
                      style={{ background: `linear-gradient(45deg, ${colors.primary}, ${colors.accent})` }}
                    ></div>
                  </div>
                  <div className="hidden sm:block">
                    <div 
                      className="text-xl font-lexend font-bold tracking-tight"
                      style={{ color: colors.text }}
                    >
                      {APP_CONFIG.NAME}
                    </div>
                    <div 
                      className="text-xs font-medium tracking-wide"
                      style={{ color: colors.textSecondary }}
                    >
                      {APP_CONFIG.WEBSITE}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Language Selector */}
                <div className="relative" ref={languageRef}>
                  <button
                    onClick={toggleLanguageDropdown}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
                    style={{ 
                      backgroundColor: languageDropdownOpen ? colors.surfaceHover : 'transparent',
                      color: colors.text
                    }}
                  >
                    <span className="text-lg">{currentLanguage.flag}</span>
                    <span className="hidden sm:block text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Language Dropdown */}
                  {languageDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 animate-in slide-in-from-top-5 duration-200"
                      style={{ 
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      }}
                    >
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => handleLanguageChange(language)}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm transition-colors duration-150"
                          style={{ 
                            color: currentLanguage.code === language.code ? colors.primary : colors.text,
                            backgroundColor: currentLanguage.code === language.code ? colors.primaryLight : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            if (currentLanguage.code !== language.code) {
                              e.currentTarget.style.backgroundColor = colors.surfaceHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentLanguage.code !== language.code) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <span className="text-lg">{language.flag}</span>
                          <span className="font-medium">{language.name}</span>
                          {currentLanguage.code === language.code && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleMode}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: colors.surfaceHover,
                    color: colors.textSecondary
                  }}
                  aria-label="Toggle theme"
                >
                  {mode === 'light' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>

                {/* Google-style Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center space-x-3 p-1 rounded-full transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: profileDropdownOpen ? colors.surfaceHover : 'transparent' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md ring-2 ring-white/20"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border py-4 z-50 animate-in slide-in-from-top-5 duration-200"
                      style={{ 
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      }}
                    >
                      {/* Profile Header */}
                      <div className="px-4 pb-4 border-b" style={{ borderColor: colors.border }}>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
                            style={{ backgroundColor: colors.primary }}
                          >
                            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold" style={{ color: colors.text }}>
                              {user?.first_name} {user?.last_name}
                            </h3>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                              {user?.email}
                            </p>
                            <div 
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-1"
                              style={{ 
                                backgroundColor: colors.primaryLight,
                                color: colors.primary
                              }}
                            >
                              {user?.role}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/dashboard/profile"
                          className="flex items-center space-x-3 px-4 py-2 text-sm transition-colors duration-150"
                          style={{ color: colors.text }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/dashboard/settings"
                          className="flex items-center space-x-3 px-4 py-2 text-sm transition-colors duration-150"
                          style={{ color: colors.text }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Account Settings</span>
                        </Link>

                        <div className="border-t my-2" style={{ borderColor: colors.border }}></div>

                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-sm w-full text-left transition-colors duration-150"
                          style={{ color: colors.text }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2.5 rounded-xl transition-all duration-200"
                  style={{ 
                    backgroundColor: colors.surfaceHover,
                    color: colors.textSecondary
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Menu Bar - Center Aligned */}
        <div 
          className="border-t hidden lg:block"
          style={{ borderColor: colors.border }}
        >
          <div className="w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-start space-x-1 h-14" ref={dropdownRef}>
                {navigationItems.map((item) => (
                  <div key={item.id} className="relative">
                    {item.children && item.children.length > 0 ? (
                      // Dropdown Menu Item
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(item.id)}
                          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeDropdown === item.id ? 'shadow-md' : 'hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: isActiveRoute(item.path) || activeDropdown === item.id ? colors.primaryLight : 'transparent',
                            color: isActiveRoute(item.path) || activeDropdown === item.id ? colors.primary : colors.text
                          }}
                          onMouseEnter={(e) => {
                            if (!isActiveRoute(item.path) && activeDropdown !== item.id) {
                              e.currentTarget.style.backgroundColor = colors.surfaceHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActiveRoute(item.path) && activeDropdown !== item.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <span className="font-medium">{item.label}</span>
                          <svg 
                            className={`ml-2 w-4 h-4 transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Mega Menu Dropdown */}
                        {activeDropdown === item.id && (
                          <div 
                            className="absolute top-full left-0 mt-1 w-64 rounded-xl shadow-xl border py-3 z-50 animate-in slide-in-from-top-5 duration-200"
                            style={{ 
                              backgroundColor: colors.surface,
                              borderColor: colors.border
                            }}
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                to={child.path}
                                className="flex items-center px-4 py-3 text-sm transition-colors duration-150"
                                style={{ 
                                  color: isActiveRoute(child.path) ? colors.primary : colors.text,
                                  backgroundColor: isActiveRoute(child.path) ? colors.primaryLight : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActiveRoute(child.path)) {
                                    e.currentTarget.style.backgroundColor = colors.surfaceHover;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActiveRoute(child.path)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setMobileMenuOpen(false);
                                }}
                              >
                                <span className="font-medium">{child.label}</span>
                                {isActiveRoute(child.path) && (
                                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular Menu Item
                      <Link
                        to={item.path}
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm"
                        style={{
                          backgroundColor: isActiveRoute(item.path) ? colors.primaryLight : 'transparent',
                          color: isActiveRoute(item.path) ? colors.primary : colors.text
                        }}
                        onMouseEnter={(e) => {
                          if (!isActiveRoute(item.path)) {
                            e.currentTarget.style.backgroundColor = colors.surfaceHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActiveRoute(item.path)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden border-t"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <div className="px-4 pt-4 pb-6 space-y-3 max-w-7xl mx-auto">
              {/* Mobile User Info */}
              <div 
                className="flex items-center space-x-3 p-4 rounded-xl border"
                style={{ 
                  backgroundColor: colors.surfaceHover,
                  borderColor: colors.border
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.text }}>
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs font-medium tracking-wide uppercase" style={{ color: colors.primary }}>
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* Mobile Navigation Items */}
              {navigationItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  {item.children && item.children.length > 0 ? (
                    <>
                      <div 
                        className="text-sm font-semibold px-3 py-1 uppercase tracking-wide"
                        style={{ color: colors.textSecondary }}
                      >
                        {item.label}
                      </div>
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          to={child.path}
                          className="block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                          style={{
                            backgroundColor: isActiveRoute(child.path) ? colors.primaryLight : 'transparent',
                            color: isActiveRoute(child.path) ? colors.primary : colors.text
                          }}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className="block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: isActiveRoute(item.path) ? colors.primaryLight : 'transparent',
                        color: isActiveRoute(item.path) ? colors.primary : colors.text
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile Actions */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: colors.border }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full font-medium"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            className="rounded-2xl shadow-lg border overflow-hidden"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <div className="p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 