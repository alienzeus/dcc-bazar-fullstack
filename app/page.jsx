'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DollarSign, Package, ShoppingCart } from 'lucide-react';
import Loading from '@/components/Loading';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    netProfit: 0,
    totalProducts: 0,
    monthlyData: [],
    stockData: []
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/history?limit=5')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/auth');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!user) {
    return null;
  }

  const COLORS = ['#16a34a', '#facc15', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} sidebarOpen={sidebarOpen} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Sales</p>
              <h2 className="text-2xl font-bold">৳{stats.totalSales.toLocaleString()}</h2>
              <p className="text-green-500 text-sm">+12.5% from last week</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <BarChart size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Orders</p>
              <h2 className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</h2>
              <p className="text-green-500 text-sm">+8.0% from last week</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <ShoppingCart size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">Net Profit</p>
              <h2 className="text-2xl font-bold">৳{stats.netProfit.toLocaleString()}</h2>
              <p className="text-green-500 text-sm">+15.2% from last week</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Products</p>
              <h2 className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</h2>
              <p className="text-red-500 text-sm">-2.5% from last week</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="glass p-6 rounded-2xl border shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Monthly Sales Overview</h3>
              <p className="text-sm text-gray-500">Last update: {new Date().toLocaleDateString()}</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`৳${value}`, 'Sales']} />
                <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Stock Distribution</h3>
              <p className="text-sm text-gray-500">Current</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.stockData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.stockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {stats.stockData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activities</h3>
            <button 
              onClick={() => router.push('/history')}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'create' ? 'bg-green-500' :
                    activity.action === 'update' ? 'bg-blue-500' :
                    activity.action === 'delete' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
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