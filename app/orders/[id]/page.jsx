'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Download, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function OrderDetailPage() {
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    checkAuth();
    fetchOrder();
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

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        toast.error('Failed to fetch order details');
        router.push('/orders');
      }
    } catch (error) {
      toast.error('Failed to fetch order details');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    
    // If address is a string, return it directly
    if (typeof address === 'string') return address;
    
    // If address is an object, format it
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
  if (!user || !order) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push(`/orders/${order._id}/edit`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Edit size={20} />
              Edit Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Order Number</label>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Brand</label>
                  <p className="font-medium capitalize">{order.brand}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Payment Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Order Date</label>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Delivery Method</label>
                  <p className="font-medium capitalize">{order.deliveryMethod?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.product?.images?.[0] && (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product?.title}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">৳{item.price?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Total: ৳{item.total?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{order.customer?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{order.customer?.phone}</p>
                </div>
                {order.customer?.email && (
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{order.customer.email}</p>
                  </div>
                )}
                {order.customer?.address && (
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium">{formatAddress(order.customer.address)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">৳{order.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courier Charge:</span>
                  <span className="font-medium">৳{order.courierCharge?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">Total Amount:</span>
                  <span className="font-bold">৳{order.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">৳{order.paidAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">Due Amount:</span>
                  <span className="font-bold text-red-600">৳{order.dueAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">{order.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {order.deliveryPerson && (order.deliveryPerson.name || order.deliveryPerson.phone) && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
                <div className="space-y-2">
                  {order.deliveryPerson.name && (
                    <div>
                      <label className="text-sm text-gray-500">Delivery Person</label>
                      <p className="font-medium">{order.deliveryPerson.name}</p>
                    </div>
                  )}
                  {order.deliveryPerson.phone && (
                    <div>
                      <label className="text-sm text-gray-500">Contact Number</label>
                      <p className="font-medium">{order.deliveryPerson.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}