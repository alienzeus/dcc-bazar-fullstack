'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Download,
  Filter,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Loading from '@/components/Loading';

const COLORS = ['#16a34a', '#facc15', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

// Helper function to format address
const formatAddress = (address) => {
  if (!address) return 'N/A';
  
  if (typeof address === 'string') return address;
  
  if (typeof address === 'object') {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  
  return 'N/A';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Amount') ? `৳${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0
    },
    recentOrders: [],
    charts: {
      dailySummary: [],
      paymentSummary: [],
      brandSummary: []
    },
    period: {
      type: 'today'
    }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState({
    salesGrowth: 12.5,
    orderGrowth: 8.0,
    profitGrowth: 15.2,
    customerGrowth: 5.5
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
    fetchRecentActivities();
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
      console.error('Auth check failed:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (period = filterPeriod, customStart = startDate, customEnd = endDate) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      
      if (period === 'custom' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      }

      const response = await fetch(`/api/dashboard?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/history?limit=6');
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const handleFilterApply = () => {
    fetchDashboardData(filterPeriod, startDate, endDate);
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ period: filterPeriod });
      
      if (filterPeriod === 'custom' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/export/orders?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `orders-${filterPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
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

  const getGrowthColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  if (loading && !dashboardData.summary.totalOrders) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <Header user={user} sidebarOpen={sidebarOpen} />

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filterPeriod === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilterApply}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Filter size={16} />
                Apply Filters
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders Table - Moved to top */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 text-lg">Recent Orders</h3>
            <span className="text-sm text-gray-500">
              Showing {dashboardData.recentOrders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SL No</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order No</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Area</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentOrders.slice(0, 10).map((order, index) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{index + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-sm">{order.customer?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">{order.customer?.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">
                      {formatAddress(order.customer?.address)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="font-medium">৳{order.totalAmount}</div>
                      <div className="text-xs text-gray-500">
                        Paid: ৳{order.paidAmount} | Due: ৳{order.dueAmount}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">{order.deliveryMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {dashboardData.recentOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders found for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm mb-1 font-medium">Total Sales</p>
                <h2 className="text-2xl font-bold text-gray-900">৳{dashboardData.summary.totalSales.toLocaleString()}</h2>
                <div className="flex items-center gap-1 mt-2">
                  {getGrowthIcon(growthMetrics.salesGrowth)}
                  <span className={`text-sm font-medium ${getGrowthColor(growthMetrics.salesGrowth)}`}>
                    {growthMetrics.salesGrowth}% from last week
                  </span>
                </div>
              </div>
              <div className="bg-green-600 p-3 rounded-full text-white">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm mb-1 font-medium">Total Orders</p>
                <h2 className="text-2xl font-bold text-gray-900">{dashboardData.summary.totalOrders.toLocaleString()}</h2>
                <div className="flex items-center gap-1 mt-2">
                  {getGrowthIcon(growthMetrics.orderGrowth)}
                  <span className={`text-sm font-medium ${getGrowthColor(growthMetrics.orderGrowth)}`}>
                    {growthMetrics.orderGrowth}% from last week
                  </span>
                </div>
              </div>
              <div className="bg-blue-600 p-3 rounded-full text-white">
                <ShoppingCart size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-sm border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm mb-1 font-medium">Delivered</p>
                <h2 className="text-2xl font-bold text-gray-900">{dashboardData.summary.deliveredOrders.toLocaleString()}</h2>
                <p className="text-gray-600 text-sm mt-2">
                  {dashboardData.summary.totalOrders > 0 
                    ? Math.round((dashboardData.summary.deliveredOrders / dashboardData.summary.totalOrders) * 100)
                    : 0
                  }% success rate
                </p>
              </div>
              <div className="bg-purple-600 p-3 rounded-full text-white">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-sm border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm mb-1 font-medium">Pending</p>
                <h2 className="text-2xl font-bold text-gray-900">{dashboardData.summary.pendingOrders.toLocaleString()}</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Processing & pending delivery
                </p>
              </div>
              <div className="bg-orange-600 p-3 rounded-full text-white">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Sales Performance</h3>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp size={16} />
                <span>Overall Growth: {growthMetrics.salesGrowth}%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dashboardData.charts.dailySummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="totalSales" 
                  fill="url(#colorSales)" 
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Bar 
                  dataKey="orderCount" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                  opacity={0.7}
                />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Payment & Brand Distribution */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.charts.paymentSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="total"
                  >
                    {dashboardData.charts.paymentSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`৳${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {dashboardData.charts.paymentSummary.map((item, index) => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    ></div>
                    <span className="text-xs text-gray-600 capitalize">{item._id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Delivered', value: dashboardData.summary.deliveredOrders, color: '#16a34a' },
                  { name: 'Pending', value: dashboardData.summary.pendingOrders, color: '#f59e0b' },
                  { name: 'Cancelled', value: dashboardData.summary.cancelledOrders, color: '#ef4444' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                  >
                    {[
                      { name: 'Delivered', value: dashboardData.summary.deliveredOrders, color: '#16a34a' },
                      { name: 'Pending', value: dashboardData.summary.pendingOrders, color: '#f59e0b' },
                      { name: 'Cancelled', value: dashboardData.summary.cancelledOrders, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activities</h3>
            <button 
              onClick={() => router.push('/history')}
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <Activity size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'create' ? 'bg-green-500' :
                    activity.action === 'update' ? 'bg-blue-500' :
                    activity.action === 'delete' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}