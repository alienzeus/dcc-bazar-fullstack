'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Download, Eye, Printer,
  FileText, Calendar, User, DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function InvoicesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchInvoices();
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

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/orders?status=delivered');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.orders);
      }
    } catch (error) {
      toast.error('Failed to fetch invoices');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || invoice.paymentStatus === statusFilter;
    const matchesBrand = brandFilter === 'all' || invoice.brand === brandFilter;
    
    return matchesSearch && matchesStatus && matchesBrand;
  });

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const selectAllInvoices = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv._id));
    }
  };

  const handlePrintInvoices = () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices to print');
      return;
    }
    
    // Open print window with selected invoices
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoices</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 20px;
            }
            @media print {
              .invoice-grid { 
                grid-template-columns: 1fr 1fr; 
                page-break-inside: avoid;
              }
            }
            .invoice { 
              border: 1px solid #000; 
              padding: 15px; 
              page-break-inside: avoid;
            }
            .invoice-header { text-align: center; margin-bottom: 15px; }
            .invoice-details { margin-bottom: 10px; }
            .invoice-items { margin: 10px 0; }
            .invoice-total { border-top: 1px solid #000; padding-top: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 5px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="invoice-grid">
            ${selectedInvoices.map(invoiceId => {
              const invoice = invoices.find(inv => inv._id === invoiceId);
              if (!invoice) return '';
              
              return `
                <div class="invoice">
                  <div class="invoice-header">
                    <h2>${invoice.brand}</h2>
                    <h3>INVOICE</h3>
                    <p>${invoice.orderNumber}</p>
                  </div>
                  
                  <div class="invoice-details">
                    <p><strong>Customer:</strong> ${invoice.customer?.name}</p>
                    <p><strong>Phone:</strong> ${invoice.customer?.phone}</p>
                    <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div class="invoice-items">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${invoice.items.map(item => `
                          <tr>
                            <td>${item.product?.title || 'N/A'}</td>
                            <td>${item.quantity}</td>
                            <td>৳${item.price}</td>
                            <td>৳${item.total}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                  
                  <div class="invoice-total">
                    <p><strong>Subtotal:</strong> ৳${invoice.subtotal}</p>
                    <p><strong>Delivery:</strong> ৳${invoice.courierCharge || 0}</p>
                    <p><strong>Total:</strong> ৳${invoice.totalAmount}</p>
                    <p><strong>Paid:</strong> ৳${invoice.paidAmount}</p>
                    <p><strong>Due:</strong> ৳${invoice.dueAmount}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const downloadInvoice = (invoice) => {
    // Simple download implementation
    const invoiceContent = `
      ${invoice.brand} - INVOICE
      Order: ${invoice.orderNumber}
      Date: ${new Date(invoice.createdAt).toLocaleDateString()}
      
      Customer: ${invoice.customer?.name}
      Phone: ${invoice.customer?.phone}
      Address: ${invoice.customer?.address?.street || 'N/A'}
      
      ITEMS:
      ${invoice.items.map(item => 
        `${item.product?.title || 'N/A'} - ${item.quantity} x ৳${item.price} = ৳${item.total}`
      ).join('\n')}
      
      Subtotal: ৳${invoice.subtotal}
      Delivery: ৳${invoice.courierCharge || 0}
      Total: ৳${invoice.totalAmount}
      Paid: ৳${invoice.paidAmount}
      Due: ৳${invoice.dueAmount}
      
      Payment Status: ${invoice.paymentStatus}
      Thank you for your business!
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600">Manage and print customer invoices</p>
          </div>
          
          {selectedInvoices.length > 0 && (
            <div className="flex gap-3">
              <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                {selectedInvoices.length} selected
              </span>
              <button 
                onClick={handlePrintInvoices}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <Printer size={20} />
                Print Selected ({selectedInvoices.length})
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="partial">Partial</option>
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Brands</option>
              <option value="DCC Bazar">DCC Bazar</option>
              <option value="Go Daddy">Go Daddy</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={selectAllInvoices}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice._id)}
                        onChange={() => toggleInvoiceSelection(invoice._id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <FileText size={16} />
                          {invoice.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {invoice.brand}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customer?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.customer?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ৳{invoice.totalAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => downloadInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => window.open(`/api/invoices/${invoice._id}/print`, '_blank')}
                          className="text-green-600 hover:text-green-900"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => router.push(`/orders/${invoice._id}`)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter !== 'all' || brandFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Delivered orders will appear here as invoices'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}