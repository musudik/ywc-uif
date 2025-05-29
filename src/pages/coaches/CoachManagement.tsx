import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { User, UserRole } from '../../types';

interface CoachFormData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export default function CoachManagement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CoachFormData>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      // Get all users and filter for coaches
      const coaches = await authService.getAllCoaches();
      setCoaches(coaches);
    } catch (error) {
      showError('Load Failed', 'Failed to load coaches');
      console.error('Failed to load coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('create');
      
      const newCoach = await authService.createUser({
        ...formData,
        role: 'COACH' as UserRole
      });
      
      setCoaches(prev => [...prev, newCoach]);
      setShowCreateModal(false);
      setFormData({ email: '', first_name: '', last_name: '', password: '' });
      showSuccess('Coach Created', 'New coach has been created successfully');
    } catch (error) {
      showError('Creation Failed', error instanceof Error ? error.message : 'Failed to create coach');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) return;

    try {
      setActionLoading('update');
      
      const updatedCoach = await authService.updateUser(selectedCoach.id, {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      
      setCoaches(prev => prev.map(c => c.id === selectedCoach.id ? updatedCoach : c));
      setShowEditModal(false);
      setSelectedCoach(null);
      setFormData({ email: '', first_name: '', last_name: '', password: '' });
      showSuccess('Coach Updated', 'Coach information has been updated successfully');
    } catch (error) {
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update coach');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (coach: User) => {
    try {
      setActionLoading(coach.id);
      
      const newStatus = coach.is_active ? 'inactive' : 'active';
      const updatedCoach = await authService.updateUser(coach.id, {
        is_active: !coach.is_active
      });
      
      setCoaches(prev => prev.map(c => c.id === coach.id ? updatedCoach : c));
      showSuccess(
        'Status Updated', 
        `Coach has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      showError('Status Update Failed', error instanceof Error ? error.message : 'Failed to update coach status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (coach: User) => {
    try {
      setActionLoading(coach.id);
      
      // Generate a temporary password
      const tempPassword = 'TempPass123!';
      await authService.updateUser(coach.id, {
        password: tempPassword
      });
      
      showSuccess(
        'Password Reset', 
        `Password reset successfully. Temporary password: ${tempPassword}`
      );
    } catch (error) {
      showError('Password Reset Failed', error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (coach: User) => {
    setSelectedCoach(coach);
    setFormData({
      email: coach.email,
      first_name: coach.first_name,
      last_name: coach.last_name,
      password: '',
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCoach(null);
    setFormData({ email: '', first_name: '', last_name: '', password: '' });
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading coaches..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Coach Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage all coaches in the system
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Add New Coach
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <TextInput
              label=""
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coaches by name or email..."
            />
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {coaches.length}
              </div>
              <div className="text-gray-500">Total Coaches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {coaches.filter(c => c.is_active).length}
              </div>
              <div className="text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {coaches.filter(c => !c.is_active).length}
              </div>
              <div className="text-gray-500">Inactive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Coaches Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCoaches.map((coach) => (
                <tr key={coach.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {coach.first_name[0]}{coach.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {coach.first_name} {coach.last_name}
                        </div>
                        {/* <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {coach.id}
                        </div> */}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {coach.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      coach.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {coach.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(coach.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(coach)}
                        title="Edit Coach"
                        className="px-2 py-1 h-8 w-8"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant={coach.is_active ? "outline" : "secondary"}
                        onClick={() => handleToggleStatus(coach)}
                        loading={actionLoading === coach.id}
                        title={coach.is_active ? 'Deactivate Coach' : 'Activate Coach'}
                        className="px-2 py-1 h-8 w-8"
                      >
                        {actionLoading === coach.id ? '⏳' : (coach.is_active ? '🟢' : '🔴')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(coach)}
                        loading={actionLoading === coach.id}
                        title="Reset Password"
                        className="px-2 py-1 h-8 w-8"
                      >
                        {actionLoading === coach.id ? '⏳' : '🔑'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCoaches.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No coaches found matching your search.' : 'No coaches found.'}
            </div>
          </div>
        )}
      </div>

      {/* Create Coach Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Coach
              </h3>
            </div>
            <form onSubmit={handleCreateCoach} className="p-6 space-y-4">
              <TextInput
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
              <TextInput
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <TextInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModals}>
                  Cancel
                </Button>
                <Button type="submit" loading={actionLoading === 'create'}>
                  Create Coach
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coach Modal */}
      {showEditModal && selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Coach
              </h3>
            </div>
            <form onSubmit={handleUpdateCoach} className="p-6 space-y-4">
              <TextInput
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
              <TextInput
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModals}>
                  Cancel
                </Button>
                <Button type="submit" loading={actionLoading === 'update'}>
                  Update Coach
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 