'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, Package, Check, AlertCircle, 
  Filter, Search, Loader 
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function PathaoSendOrderPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=pending');
      if (response.ok) {
        const data = await response.json();
        // Filter orders that are not already sent to Pathao and have delivery method as pathao
        const pathaoOrders = data.orders.filter(order => 
          !order.pathaoConsignmentId && 
          order.deliveryMethod === 'pathao' &&
          order.status === 'pending'
        );
        setOrders(pathaoOrders);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order._id)));
    }
  };

  const sendToPathao = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order');
      return;
    }

    setSending(true);
    const results = [];

    for (const orderId of selectedOrders) {
      const order = orders.find(o => o._id === orderId);
      if (!order) continue;

      try {
        const response = await fetch('/api/pathao/send-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: order._id }),
        });

        const result = await response.json();
        
        if (response.ok) {
          results.push({
            orderNumber: order.orderNumber,
            success: true,
            consignmentId: result.consignmentId
          });
        } else {
          results.push({
            orderNumber: order.orderNumber,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        results.push({
          orderNumber: order.orderNumber,
          success: false,
          error: 'Network error'
        });
      }
    }

    // Show results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      toast.success(`Successfully sent ${successful.length} orders to Pathao`);
    }
    if (failed.length > 0) {
      toast.error(`Failed to send ${failed.length} orders`);
      console.error('Failed orders:', failed);
    }

    setSending(false);
    setSelectedOrders(new Set());
    fetchOrders(); // Refresh the list
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone.includes(searchTerm);
    
    const matchesBrand = brandFilter === 'all' || order.brand === brandFilter;
    
    return matchesSearch && matchesBrand;
  });

  const getBrandColor = (brand) => {
    return brand === 'Go Baby' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
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
            <h1 className="text-2xl font-bold text-gray-900">Send to Pathao</h1>
            <p className="text-gray-600">Send processing orders to Pathao for delivery</p>
          </div>
          <div className="flex gap-3">
            {selectedOrders.size > 0 && (
              <button
                onClick={sendToPathao}
                disabled={sending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                {sending ? 'Sending...' : `Send ${selectedOrders.size} Orders`}
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Brands</option>
              <option value="DCC Bazar">DCC Bazar</option>
              <option value="Go Baby">Go Baby</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={selectAllOrders}
                className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">
                {selectedOrders.size} of {filteredOrders.length} selected
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Total: {filteredOrders.length} orders ready for Pathao
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order._id)}
                        onChange={() => toggleOrderSelection(order._id)}
                        className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ৳{order.totalAmount?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Due: ৳{order.dueAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBrandColor(order.brand)}`}>
                        {order.brand}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No orders ready for Pathao</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || brandFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'All processing orders with Pathao delivery method will appear here'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}