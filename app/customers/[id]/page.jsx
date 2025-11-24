'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Users, Phone, Mail, MapPin, Calendar, ShoppingCart, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function CustomerDetailPage() {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    checkAuth();
    fetchCustomer();
    fetchCustomerOrders();
  }, [params.id]);

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
    }
  };

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      } else {
        toast.error('Failed to fetch customer details');
        router.push('/customers');
      }
    } catch (error) {
      toast.error('Failed to fetch customer details');
      router.push('/customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const response = await fetch(`/api/orders?customerId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer orders');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Customer deleted successfully');
        router.push('/customers');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete customer');
      }
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipCode) parts.push(address.zipCode);
      
      return parts.join(', ');
    }
    
    return '';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'due': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (loading) return <Loading />;
  if (!user || !customer) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
              <p className="text-gray-600">{customer.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push(`/customers/${customer._id}/edit`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Edit size={20} />
              Edit Customer
            </button>
            <button 
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
            >
              <Trash2 size={20} />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Profile */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Customer Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="text-green-600" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                  <p className="text-gray-500">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone size={16} />
                      Phone
                    </label>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                  {customer.email && (
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail size={16} />
                        Email
                      </label>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {customer.address && (
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2">
                        <MapPin size={16} />
                        Address
                      </label>
                      <p className="font-medium">{formatAddress(customer.address)}</p>
                    </div>
                  )}
                  {customer.lastOrder && (
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar size={16} />
                        Last Order
                      </label>
                      <p className="font-medium">{new Date(customer.lastOrder).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="font-medium mt-1">{customer.notes}</p>
                </div>
              )}
            </div>

            {/* Customer Stats */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Customer Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ShoppingCart className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{customer.totalOrders || 0}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600">৳{customer.totalSpent?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ৳{customer.totalOrders > 0 ? Math.round(customer.totalSpent / customer.totalOrders)?.toLocaleString() : 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Order Value</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Calendar className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Last Order</div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{order.orderNumber}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} items • ৳{order.totalAmount?.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <button
                      onClick={() => router.push('/orders')}
                      className="w-full text-center text-blue-600 hover:text-blue-800 py-2 border-t"
                    >
                      View all {orders.length} orders
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No orders found for this customer</p>
                  <button
                    onClick={() => router.push('/orders/new')}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Create First Order
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/orders/new')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                >
                  <ShoppingCart size={20} />
                  Create New Order
                </button>
                <button
                  onClick={() => router.push(`/customers/${customer._id}/edit`)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <Edit size={20} />
                  Edit Customer
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(customer.phone)}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700"
                >
                  <Phone size={20} />
                  Copy Phone Number
                </button>
              </div>
            </div>

            {/* Customer Timeline */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Customer Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Customer Created</p>
                    <p className="text-sm text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {customer.lastOrder && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Last Order Placed</p>
                      <p className="text-sm text-gray-500">{new Date(customer.lastOrder).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Total Orders</p>
                    <p className="text-sm text-gray-500">{customer.totalOrders || 0} orders completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Phone Number</label>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                {customer.email && (
                  <div>
                    <label className="text-sm text-gray-500">Email Address</label>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium">{formatAddress(customer.address)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}