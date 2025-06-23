import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active?: boolean;
  created_at?: string;
  coach_id?: string;
  personal_id?: string;
  user_id?: string;
  applicant_type?: string;
  coach_name?: string;
}

export default function ClientManagement() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [coaches, setCoaches] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const clientsPerPage = 10;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      if (user?.role === 'ADMIN') {
        // For admins, get all users with CLIENT role and load coaches
        const [clientUsers, coachUsers] = await Promise.all([
          authService.getAllClients(),
          authService.getAllCoaches()
        ]);
        
        setCoaches(coachUsers);
        
        // Create a map of coach_id to coach_name for quick lookup
        const coachMap = coachUsers.reduce((map, coach) => {
          map[coach.id] = `${coach.first_name} ${coach.last_name}`;
          return map;
        }, {} as Record<string, string>);
        
        // Transform the data to match our interface
        const clientData = clientUsers.map((client: any) => ({
          id: client.id || client.user_id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          is_active: client.is_active ?? true,
          created_at: client.created_at,
          coach_id: client.coach_id,
          user_id: client.id || client.user_id,
          applicant_type: client.applicant_type,
          coach_name: client.coach_id ? coachMap[client.coach_id] || 'Unknown Coach' : 'No Coach Assigned',
        }));
        
        setClients(clientData);
        setTotalClients(clientData.length);
      } else {
        // For coaches, get their assigned clients
        const coachClients = await authService.getCoachClients(user?.id || '');
        // Transform the data to match our interface
        const clientData = coachClients.map((client: any) => ({
          id: client.personal_id || client.user_id || client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          is_active: true,
          created_at: client.created_at,
          applicant_type: client.applicant_type,
          personal_id: client.personal_id,
          user_id: client.user_id || client.id,
          coach_name: user ? `${user.first_name} ${user.last_name}` : 'You',
        }));
        setClients(clientData);
        setTotalClients(clientData.length);
      }
    } catch (error) {
      showError('Failed to Load Clients', error instanceof Error ? error.message : 'Could not load client data');
      setClients([]);
      setTotalClients(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (client: ClientData) => {
    try {
      setActionLoading(client.id);
      
      const newStatus = client.is_active ? 'inactive' : 'active';
      const updatedClient = await authService.updateUser(client.id, {
        is_active: !client.is_active
      });
      
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active: !c.is_active } : c));
      showSuccess(
        'Status Updated', 
        `Client has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      showError('Status Update Failed', error instanceof Error ? error.message : 'Failed to update client status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (client: ClientData) => {
    try {
      setActionLoading(client.id);
      
      // Generate a temporary password
      const tempPassword = 'TempPass123!';
      await authService.updateUser(client.id, {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.coach_name && client.coach_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const startIndex = (currentPage - 1) * clientsPerPage;
  const endIndex = startIndex + clientsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading clients..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'ADMIN' ? 'All Clients' : 'My Clients'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and view client information and progress.
          </p>
        </div>
        <Link to="/dashboard/clients/create">
          <Button>Add New Client</Button>
        </Link>
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
              placeholder={user?.role === 'ADMIN' 
                ? "Search clients by name, email, or coach..." 
                : "Search clients by name or email..."
              }
            />
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {clients.length}
              </div>
              <div className="text-gray-500">Total Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {clients.filter(c => c.is_active).length}
              </div>
              <div className="text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {clients.filter(c => !c.is_active).length}
              </div>
              <div className="text-gray-500">Inactive</div>
            </div>
          </div>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No Clients Found' : 'No Clients Yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? 'No clients found matching your search criteria.'
                : user?.role === 'ADMIN' 
                  ? 'No clients have been registered in the system yet.' 
                  : 'You don\'t have any clients assigned to you yet.'
              }
            </p>
            {!searchTerm && (
              <div className="flex justify-center space-x-3">
                <Link to="/dashboard/clients/create">
                  <Button>Create New Client</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Client List ({filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'})
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} of {filteredClients.length}
              </div>
            </div>
          </div>
          
          {/* Clients Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
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
                  {user?.role === 'ADMIN' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Coach
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {client.first_name[0]}{client.last_name[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.first_name} {client.last_name}
                          </div>
                          {/* <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {client.id}
                          </div> */}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(client.created_at)}
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {client.coach_name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/dashboard/clients/${client.personal_id || client.id}`}
                          title="View Client"
                        >
                          <Button size="sm" variant="outline" className="px-2 py-1 h-8 w-8">
                            👁️
                          </Button>
                        </Link>
                        <Link
                          to={`/dashboard/forms/personal-details/${client.personal_id || client.id}`}
                          title="Edit Client"
                        >
                          <Button size="sm" variant="outline" className="px-2 py-1 h-8 w-8">
                            ✏️
                          </Button>
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <>
                            <Button
                              size="sm"
                              variant={client.is_active ? "outline" : "secondary"}
                              onClick={() => handleToggleStatus(client)}
                              loading={actionLoading === client.id}
                              title={client.is_active ? 'Deactivate Client' : 'Activate Client'}
                              className="px-2 py-1 h-8 w-8"
                            >
                              {actionLoading === client.id ? '⏳' : (client.is_active ? '🟢' : '🔴')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(client)}
                              loading={actionLoading === client.id}
                              title="Reset Password"
                              className="px-2 py-1 h-8 w-8"
                            >
                              {actionLoading === client.id ? '⏳' : '🔑'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredClients.length)}</span> of{' '}
                    <span className="font-medium">{filteredClients.length}</span> results
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="px-3 py-1"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 