import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import type { UserRole } from '../../types';

export default function CreateClient() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<Array<{ 
    id: string; 
    first_name: string; 
    last_name: string; 
  }>>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    coach_id: user?.role === 'COACH' ? user.id : '', // Auto-assign for coaches
  });

  // Load available coaches for ADMIN users
  useEffect(() => {
    const loadCoaches = async () => {
      if (user?.role === 'ADMIN') {
        try {
          const coaches = await authService.getAllCoaches();
          setAvailableCoaches(coaches);
        } catch (error) {
          console.log('Could not load available coaches:', error);
        }
      }
    };

    loadCoaches();
  }, [user?.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      showError('Validation Error', 'Please fill in all required fields.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Password and confirm password do not match.');
      return false;
    }

    if (formData.password.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters long.');
      return false;
    }

    if (!formData.coach_id) {
      if (user?.role === 'ADMIN') {
        showError('Coach Required', 'Please select a coach to assign this client to.');
        return false;
      } else if (user?.role === 'COACH') {
        // Auto-assign for coaches
        setFormData(prev => ({ ...prev, coach_id: user.id }));
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'CLIENT' as UserRole,
        coach_id: formData.coach_id,
      };

      await authService.register(registrationData);
      
      showSuccess(
        'Client Created Successfully', 
        `${formData.first_name} ${formData.last_name} has been registered as a new client.`
      );
      
      // Navigate back to client management or dashboard
      navigate('/dashboard/clients');
    } catch (error) {
      showError(
        'Registration Failed', 
        error instanceof Error ? error.message : 'Failed to create client account'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Client
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Add a new client to your coaching roster.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              placeholder="Enter client's first name"
            />

            <TextInput
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              placeholder="Enter client's last name"
            />
          </div>

          {/* Account Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-4">
              <TextInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter client's email address"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password (min. 6 characters)"
                />

                <TextInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          {/* Coach Assignment */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Coach Assignment
            </h3>
            
            {user?.role === 'COACH' ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-blue-500 text-xl mr-3">👤</div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Assigned Coach: {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      This client will be automatically assigned to you.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned Coach <span className="text-red-500">*</span>
                </label>
                <select
                  name="coach_id"
                  value={formData.coach_id}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a coach</option>
                  {availableCoaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.first_name} {coach.last_name}
                    </option>
                  ))}
                </select>
                {!formData.coach_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Please select a coach to assign this client to.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={loading}
            >
              Create Client Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 