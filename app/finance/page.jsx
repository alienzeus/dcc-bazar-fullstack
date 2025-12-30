'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit, Trash2, 
  Download, Filter, Calendar, ArrowUp, ArrowDown,
  DollarSign, TrendingUp, TrendingDown, Wallet, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import dynamic from 'next/dynamic';

// Dynamically import DatePicker to avoid SSR issues
const DatePicker = dynamic(() => import('react-datepicker').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
});

import "react-datepicker/dist/react-datepicker.css";

export default function FinancePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [categories, setCategories] = useState(['Sales', 'Purchase', 'Salary', 'Rent', 'Utilities', 'Marketing', 'Maintenance', 'Other']);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [period, setPeriod] = useState('today');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    reason: '',
    description: '',
    paymentMethod: 'cash',
    brand: 'Go Baby',
    date: new Date()
  });

  const router = useRouter();
  const paymentMethods = ['cash', 'bank', 'mobile_banking', 'card', 'other'];
  const brands = ['Go Baby', 'DCC Bazar', 'both', 'other'];
  const transactionTypes = ['income', 'expense'];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [period, dateRange, filterType, filterCategory, filterBrand, filterPayment]);

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

  const fetchTransactions = async () => {
    setIsFiltering(true);
    try {
      let url = '/api/transactions?';
      const params = new URLSearchParams();
      
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterBrand !== 'all') params.append('brand', filterBrand);
      if (filterPayment !== 'all') params.append('paymentMethod', filterPayment);
      if (searchTerm) params.append('search', searchTerm);
      
      // Apply date range based on period
      const now = new Date();
      let start, end;
      
      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'custom':
          if (startDate && endDate) {
            // Ensure valid dates
            if (startDate.toString() !== 'Invalid Date' && endDate.toString() !== 'Invalid Date') {
              start = startDate;
              end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
            }
          }
          break;
      }
      
      // Only add date params if we have valid dates
      if (start && end && start.toString() !== 'Invalid Date' && end.toString() !== 'Invalid Date') {
        params.append('startDate', start.toISOString());
        params.append('endDate', end.toISOString());
      }

      const response = await fetch(url + params.toString());
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || { totalIncome: 0, totalExpense: 0, balance: 0 });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      const url = editingTransaction ? `/api/transactions/${editingTransaction._id}` : '/api/transactions';
      const method = editingTransaction ? 'PUT' : 'POST';
      
      // Format date properly
      const submissionData = {
        ...formData,
        date: formData.date.toISOString(),
        amount: parseFloat(formData.amount)
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        toast.success(editingTransaction ? 'Transaction updated!' : 'Transaction added!');
        setShowModal(false);
        setEditingTransaction(null);
        setFormData({
          type: 'income',
          category: '',
          amount: '',
          reason: '',
          description: '',
          paymentMethod: 'cash',
          brand: 'Go Baby',
          date: new Date()
        });
        fetchTransactions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save transaction');
      }
    } catch (error) {
      toast.error('Error saving transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      reason: transaction.reason,
      description: transaction.description || '',
      paymentMethod: transaction.paymentMethod,
      brand: transaction.brand,
      date: new Date(transaction.date)
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Transaction deleted successfully');
        fetchTransactions();
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error) {
      toast.error('Error deleting transaction');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterBrand !== 'all') params.append('brand', filterBrand);
      
      // Add date range for export
      const now = new Date();
      let start, end;
      
      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'custom':
          if (startDate && endDate && startDate.toString() !== 'Invalid Date' && endDate.toString() !== 'Invalid Date') {
            start = startDate;
            end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
          }
          break;
      }
      
      if (start && end && start.toString() !== 'Invalid Date' && end.toString() !== 'Invalid Date') {
        params.append('startDate', start.toISOString());
        params.append('endDate', end.toISOString());
      }

      const response = await fetch(`/api/transactions/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${filterType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export started successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    }
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? <ArrowUp className="inline mr-1" size={16} /> : <ArrowDown className="inline mr-1" size={16} />;
  };

  const handleClearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterBrand('all');
    setFilterPayment('all');
    setSearchTerm('');
    setPeriod('today');
    setDateRange([null, null]);
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={() => {}} />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Header user={user} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
            <p className="text-gray-600">Track income and expenses</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleExport}
              disabled={isFiltering}
              className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              <span className="hidden md:inline">Export CSV</span>
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Add Transaction</span>
              <span className="md:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">৳{summary.totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-full">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${summary.totalIncome + summary.totalExpense > 0 ? (summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expense</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">৳{summary.totalExpense.toLocaleString()}</p>
              </div>
              <div className="p-2 md:p-3 bg-red-100 rounded-full">
                <TrendingDown className="text-red-600" size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${summary.totalIncome + summary.totalExpense > 0 ? (summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className={`text-xl md:text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{summary.balance.toLocaleString()}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                <Wallet className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${summary.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by reason, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Types</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Payments</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-4">
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                if (e.target.value !== 'custom') {
                  setDateRange([null, null]);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {period === 'custom' && (
              <div className="md:col-span-3">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => {
                    setDateRange(update);
                  }}
                  isClearable={true}
                  placeholderText="Select date range"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            )}
            
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleSearch}
                disabled={isFiltering}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFiltering ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Filter size={18} />
                )}
                {isFiltering ? 'Loading...' : 'Apply Filters'}
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {new Date(transaction.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.referenceNo}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {getTypeIcon(transaction.type)}
                        {transaction.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{transaction.reason}</div>
                        {transaction.description && (
                          <div className="text-xs text-gray-500 mt-1">{transaction.description}</div>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${getTypeColor(transaction.type)}`}>
                      ৳{parseFloat(transaction.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {transaction.brand}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first transaction'
                }
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Transaction
              </button>
            </div>
          )}
        </div>

        {/* Modal for Add/Edit Transaction */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
                    setFormData({
                      type: 'income',
                      category: '',
                      amount: '',
                      reason: '',
                      description: '',
                      paymentMethod: 'cash',
                      brand: 'Go Baby',
                      date: new Date()
                    });
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <div className="flex space-x-4">
                        {transactionTypes.map(type => (
                          <label key={type} className="flex items-center">
                            <input
                              type="radio"
                              name="type"
                              value={type}
                              checked={formData.type === type}
                              onChange={(e) => setFormData({...formData, type: e.target.value})}
                              className="mr-2"
                            />
                            <span className={type === 'income' ? 'text-green-600' : 'text-red-600'}>
                              {type.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        {paymentMethods.map(method => (
                          <option key={method} value={method}>{method.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        {brands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <DatePicker
                        selected={formData.date}
                        onChange={(date) => setFormData({...formData, date})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason *
                      </label>
                      <input
                        type="text"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter reason for transaction"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows="3"
                        placeholder="Additional details about this transaction"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTransaction(null);
                      setFormData({
                        type: 'income',
                        category: '',
                        amount: '',
                        reason: '',
                        description: '',
                        paymentMethod: 'cash',
                        brand: 'Go Baby',
                        date: new Date()
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingTransaction ? 'Update' : 'Save'} Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}