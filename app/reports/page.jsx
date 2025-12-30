'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Download, Filter, Calendar, 
  FileText, BarChart3, Package, Trash2,
  TrendingUp, FileDown, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Report generation form
  const [reportForm, setReportForm] = useState({
    type: 'financial',
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    customPeriod: false
  });

  const router = useRouter();
  const reportTypes = [
    { value: 'financial', label: 'Financial Report', icon: <TrendingUp size={18} /> },
    { value: 'sales', label: 'Sales Report', icon: <BarChart3 size={18} /> },
    { value: 'inventory', label: 'Inventory Report', icon: <Package size={18} /> }
  ];
  const periods = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];

  useEffect(() => {
    checkAuth();
    fetchReports();
  }, [filterType, filterPeriod]);

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

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterPeriod !== 'all') params.append('period', filterPeriod);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/reports?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const handleGenerateReport = async () => {
    if (!reportForm.startDate || !reportForm.endDate) {
      toast.error('Please select date range');
      return;
    }

    if (reportForm.startDate > reportForm.endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportForm.type,
          period: reportForm.period,
          startDate: reportForm.startDate.toISOString().split('T')[0],
          endDate: reportForm.endDate.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowGenerator(false);
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate report');
      }
    } catch (error) {
      toast.error('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Report deleted successfully');
        fetchReports();
      } else {
        toast.error('Failed to delete report');
      }
    } catch (error) {
      toast.error('Error deleting report');
    }
  };

  const handleExport = async (reportId, format) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/export?format=${format}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV downloaded successfully');
      } else {
        const data = await response.json();
        toast.info(data.message);
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getReportTypeInfo = (type) => {
    const info = reportTypes.find(t => t.value === type);
    return info || { label: type, icon: <FileText size={18} /> };
  };

  const getPeriodLabel = (period) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom'
    };
    return labels[period] || period;
  };

  const formatDateRange = (start, end) => {
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
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
            <h1 className="text-2xl font-bold text-gray-900">Report Generation</h1>
            <p className="text-gray-600">Generate and manage business reports</p>
          </div>
          <button 
            onClick={() => setShowGenerator(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Generate Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchReports()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Report Types</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Periods</option>
              {periods.map(period => (
                <option key={period} value={period}>{getPeriodLabel(period)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const typeInfo = getReportTypeInfo(report.type);
            
            return (
              <div key={report._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-blue-600">
                          {typeInfo.icon}
                        </span>
                      </div>
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                          {getPeriodLabel(report.period)}
                        </span>
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {report.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={14} className="mr-2" />
                      <span>{formatDateRange(report.startDate, report.endDate)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={14} className="mr-2" />
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Generated by: {report.generatedBy?.name || 'System'}
                    </div>
                  </div>
                  
                  {/* Summary Stats */}
                  {report.summary && (
                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      {report.summary.totalIncome !== undefined && (
                        <div>
                          <div className="text-xs text-gray-500">Income</div>
                          <div className="font-bold text-green-600">৳{report.summary.totalIncome?.toLocaleString() || 0}</div>
                        </div>
                      )}
                      {report.summary.totalExpense !== undefined && (
                        <div>
                          <div className="text-xs text-gray-500">Expense</div>
                          <div className="font-bold text-red-600">৳{report.summary.totalExpense?.toLocaleString() || 0}</div>
                        </div>
                      )}
                      {report.summary.netProfit !== undefined && (
                        <div>
                          <div className="text-xs text-gray-500">Net Profit</div>
                          <div className={`font-bold ${report.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ৳{report.summary.netProfit?.toLocaleString() || 0}
                          </div>
                        </div>
                      )}
                      {report.summary.totalSales !== undefined && (
                        <div>
                          <div className="text-xs text-gray-500">Total Sales</div>
                          <div className="font-bold text-blue-600">৳{report.summary.totalSales?.toLocaleString() || 0}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(report._id, 'csv')}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FileDown size={16} />
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport(report._id, 'pdf')}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <FileDown size={16} />
                      PDF
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No reports found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || filterType !== 'all' || filterPeriod !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Generate your first report to get started'
              }
            </p>
            <button
              onClick={() => setShowGenerator(true)}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Generate Report
            </button>
          </div>
        )}

        {/* Report Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generate New Report
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Report Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setReportForm({...reportForm, type: type.value})}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          reportForm.type === type.value 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`p-2 rounded-lg ${
                            reportForm.type === type.value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {type.icon}
                          </span>
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {type.value === 'financial' && 'Income, expenses, and profit analysis'}
                          {type.value === 'sales' && 'Sales performance and trends'}
                          {type.value === 'inventory' && 'Stock levels and inventory value'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Period
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {periods.map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          let startDate, endDate = now;
                          
                          switch (period) {
                            case 'daily':
                              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                              break;
                            case 'weekly':
                              startDate = new Date(now);
                              startDate.setDate(now.getDate() - now.getDay());
                              break;
                            case 'monthly':
                              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                              break;
                            case 'yearly':
                              startDate = new Date(now.getFullYear(), 0, 1);
                              break;
                            case 'custom':
                              // Keep current dates for custom
                              startDate = reportForm.startDate;
                              break;
                          }
                          
                          setReportForm({
                            ...reportForm,
                            period,
                            customPeriod: period === 'custom',
                            startDate: period !== 'custom' ? startDate : reportForm.startDate,
                            endDate: period !== 'custom' ? endDate : reportForm.endDate
                          });
                        }}
                        className={`px-3 py-2 text-sm rounded-lg ${
                          reportForm.period === period
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {getPeriodLabel(period)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <DatePicker
                      selected={reportForm.startDate}
                      onChange={(date) => setReportForm({...reportForm, startDate: date})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      dateFormat="dd/MM/yyyy"
                      disabled={!reportForm.customPeriod && reportForm.period !== 'custom'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <DatePicker
                      selected={reportForm.endDate}
                      onChange={(date) => setReportForm({...reportForm, endDate: date})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      dateFormat="dd/MM/yyyy"
                      disabled={!reportForm.customPeriod && reportForm.period !== 'custom'}
                    />
                  </div>
                </div>

                {/* Preview Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Report Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Report Type:</span>
                      <span className="font-medium">{getReportTypeInfo(reportForm.type).label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Period:</span>
                      <span className="font-medium">{getPeriodLabel(reportForm.period)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Date Range:</span>
                      <span className="font-medium">{formatDateRange(reportForm.startDate, reportForm.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGenerator(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 size={18} />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}