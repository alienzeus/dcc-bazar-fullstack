'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit, Trash2, Eye, 
  Users, Phone, Mail, MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function CustomersPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (error) {
      toast.error('Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer database</p>
          </div>
          <button 
            onClick={() => router.push('/customers/new')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Customer Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="text-green-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {customer.totalOrders || 0} orders
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address?.street && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="mt-0.5" />
                      <span className="flex-1">{customer.address.street}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      ৳{customer.totalSpent?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-500">Total Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {customer.totalOrders || 0}
                    </div>
                    <div className="text-xs text-gray-500">Total Orders</div>
                  </div>
                </div>

                {/* Last Order */}
                {customer.lastOrder && (
                  <div className="text-xs text-gray-500 mb-4">
                    Last order: {new Date(customer.lastOrder).toLocaleDateString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/customers/${customer._id}`)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/customers/${customer._id}/edit`)}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer._id)}
                    className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No customers found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first customer'
              }
            </p>
            <button
              onClick={() => router.push('/customers/new')}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Customer
            </button>
          </div>
        )}
      </main>
    </div>
  );
}