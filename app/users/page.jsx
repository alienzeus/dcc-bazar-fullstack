'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit, Trash2, User, 
  Shield, Mail, Phone, MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function UsersPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          // Only superadmin can access this page
          if (data.user.role !== 'superadmin') {
            router.push('/');
            return;
          }
        } else {
          router.push('/auth');
        }
      } else {
        router.push('/auth');
      }
    } catch (error) {
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;
  if (!user || user.role !== 'superadmin') return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={() => {}} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and permissions</p>
          </div>
          <button 
            onClick={() => router.push('/users/new')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position & Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {userItem.photo ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={userItem.photo.url}
                              alt={userItem.name}
                            />
                          ) : (
                            <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {userItem.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userItem.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userItem.position}</div>
                      <div className="text-sm text-gray-500 capitalize flex items-center gap-1">
                        <Shield size={14} />
                        {userItem.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.lastLogin 
                        ? new Date(userItem.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => router.push(`/users/${userItem._id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit size={16} />
                        </button>
                        {userItem.role !== 'superadmin' && (
                          <button 
                            onClick={() => handleDelete(userItem._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first user'
                }
              </p>
              <button
                onClick={() => router.push('/users/new')}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add User
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}