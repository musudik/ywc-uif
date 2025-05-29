import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { roleRoutes } from '../../routes';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showError('Validation Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      showError('Login Failed', error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Please sign in to continue.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <TextInput
            label="Email address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <TextInput
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>

        <div>
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={!email || !password}
          >
            Sign in
          </Button>
        </div>
      </form>

      {/* Demo accounts info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Demo Accounts
        </h3>
        <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">Admin:</span>
            <span>admin@ywc.com / admin123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Coach:</span>
            <span>coach@ywc.com / coach123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Client:</span>
            <span>client@ywc.com / client123</span>
          </div>
        </div>
      </div>
    </div>
  );
} 