'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Calendar, User, 
  Plus, Edit, Trash2, LogIn, Settings
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function HistoryPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchHistory();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
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

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
      }
    } catch (error) {
      toast.error('Failed to fetch history');
    }
  };

  const filteredHistory = history.filter(entry => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || entry.resource === resourceFilter;
    
    const matchesDate = !dateFilter || 
      new Date(entry.createdAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    
    // If user is not superadmin, only show their own actions
    const matchesUser = user?.role === 'superadmin' || entry.user?._id === user?.id;
    
    return matchesSearch && matchesAction && matchesResource && matchesDate && matchesUser;
  });

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <Plus size={16} className="text-green-600" />;
      case 'update': return <Edit size={16} className="text-blue-600" />;
      case 'delete': return <Trash2 size={16} className="text-red-600" />;
      case 'login': return <LogIn size={16} className="text-purple-600" />;
      case 'password_change': return <Settings size={16} className="text-orange-600" />;
      default: return <Edit size={16} className="text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'password_change': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={() => {}} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">History Log</h1>
            <p className="text-gray-600">Track all system activities and changes</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="password_change">Password Change</option>
            </select>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Resources</option>
              <option value="product">Products</option>
              <option value="order">Orders</option>
              <option value="customer">Customers</option>
              <option value="user">Users</option>
              <option value="payment">Payments</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredHistory.map((entry) => (
                <div key={entry._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Action Icon */}
                    <div className="flex-shrink-0">
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(entry.action)}`}>
                          {entry.action}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {entry.resource}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {entry.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{entry.user?.name || 'System'}</span>
                        </div>
                        {entry.ip && (
                          <span>IP: {entry.ip}</span>
                        )}
                      </div>

                      {/* Changes Display (for update actions) */}
                      {entry.oldData && entry.newData && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium text-gray-700">
                              View Changes
                            </summary>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-red-600 mb-1">Before:</h4>
                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(entry.oldData, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h4 className="font-medium text-green-600 mb-1">After:</h4>
                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(entry.newData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No history found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || actionFilter !== 'all' || resourceFilter !== 'all' || dateFilter
                  ? 'Try adjusting your search or filters'
                  : 'System activities will appear here'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}