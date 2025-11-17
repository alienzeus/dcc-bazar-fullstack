"use client";
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
      const response = await fetch('/api/orders');
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
      invoice.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.phone?.includes(searchTerm);
    
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
    if (selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0) {
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
    
    const selectedInvoiceData = invoices.filter(inv => selectedInvoices.includes(inv._id));
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoices</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              padding: 10px;
            }
            
            .a4-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              position: relative;
            }
            
            .invoice-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 15px;
              width: 100%;
              height: 287mm;
              padding: 10px;
            }
            
            .invoice-item {
              border: 1px solid #000;
              padding: 12px;
              page-break-inside: avoid;
              break-inside: avoid;
              background: white;
              display: flex;
              flex-direction: column;
            }
            
            .invoice-header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            
            .invoice-header h2 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .invoice-header h3 {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .invoice-header p {
              font-size: 10px;
            }
            
            .invoice-details {
              margin-bottom: 8px;
            }
            
            .invoice-details p {
              margin: 2px 0;
              font-size: 10px;
            }
            
            .invoice-items {
              flex: 1;
              margin: 8px 0;
            }
            
            .invoice-items table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
            }
            
            .invoice-items th,
            .invoice-items td {
              padding: 3px 2px;
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            
            .invoice-items th {
              font-weight: bold;
              background: #f5f5f5;
            }
            
            .invoice-total {
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: auto;
            }
            
            .invoice-total p {
              margin: 2px 0;
              font-size: 10px;
              display: flex;
              justify-content: space-between;
            }
            
            .invoice-total .total-line {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 2px;
            }
            
            .status-badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
              margin-top: 4px;
            }
            
            .paid { background: #d1fae5; color: #065f46; }
            .due { background: #fee2e2; color: #991b1b; }
            .partial { background: #fef3c7; color: #92400e; }
            
            @media print {
              body {
                padding: 0;
              }
              
              .a4-page {
                width: 100%;
                height: 100%;
              }
              
              .invoice-grid {
                height: 100%;
              }
              
              .invoice-item {
                border: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            
            .page-break {
              page-break-after: always;
              break-after: page;
            }
          </style>
        </head>
        <body>
          <div class="a4-page">
            <div class="invoice-grid">
              ${selectedInvoiceData.map((invoice, index) => {
                const statusClass = invoice.paymentStatus === 'paid' ? 'paid' : 
                                 invoice.paymentStatus === 'due' ? 'due' : 'partial';
                
                return `
                  <div class="invoice-item">
                    <div class="invoice-header">
                      <h2>${invoice.brand || 'N/A'}</h2>
                      <h3>INVOICE</h3>
                      <p>${invoice.orderNumber || 'N/A'}</p>
                    </div>
                    
                    <div class="invoice-details">
                      <p><strong>Customer:</strong> ${invoice.customer?.name || 'N/A'}</p>
                      <p><strong>Phone:</strong> ${invoice.customer?.phone || 'N/A'}</p>
                      <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                      <span class="status-badge ${statusClass}">${invoice.paymentStatus || 'due'}</span>
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
                          ${(invoice.items || []).map(item => `
                            <tr>
                              <td>${item.product?.title || 'N/A'}</td>
                              <td>${item.quantity || 0}</td>
                              <td>৳${(item.price || 0).toLocaleString()}</td>
                              <td>৳${(item.total || 0).toLocaleString()}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                    
                    <div class="invoice-total">
                      <p><span>Subtotal:</span> <span>৳${(invoice.subtotal || 0).toLocaleString()}</span></p>
                      <p><span>Delivery:</span> <span>৳${(invoice.courierCharge || 0).toLocaleString()}</span></p>
                      <p class="total-line"><span>Total:</span> <span>৳${(invoice.totalAmount || 0).toLocaleString()}</span></p>
                      <p><span>Paid:</span> <span>৳${(invoice.paidAmount || 0).toLocaleString()}</span></p>
                      <p><span>Due:</span> <span>৳${(invoice.dueAmount || 0).toLocaleString()}</span></p>
                    </div>
                  </div>
                  ${(index + 1) % 4 === 0 && index !== selectedInvoiceData.length - 1 ? '</div><div class="page-break"></div><div class="a4-page"><div class="invoice-grid">' : ''}
                `;
              }).join('')}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      // printWindow.close(); // Uncomment if you want to auto-close after print
    }, 500);
  };

  const downloadInvoice = (invoice) => {
    const invoiceContent = `
${invoice.brand || 'N/A'} - INVOICE
Order Number: ${invoice.orderNumber || 'N/A'}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Payment Status: ${invoice.paymentStatus || 'due'}

CUSTOMER DETAILS:
Name: ${invoice.customer?.name || 'N/A'}
Phone: ${invoice.customer?.phone || 'N/A'}
Address: ${invoice.customer?.address?.street || 'N/A'}

ITEMS:
${(invoice.items || []).map(item => 
  `• ${item.product?.title || 'N/A'} - ${item.quantity || 0} x ৳${(item.price || 0).toLocaleString()} = ৳${(item.total || 0).toLocaleString()}`
).join('\n')}

SUMMARY:
Subtotal: ৳${(invoice.subtotal || 0).toLocaleString()}
Delivery Charge: ৳${(invoice.courierCharge || 0).toLocaleString()}
Total Amount: ৳${(invoice.totalAmount || 0).toLocaleString()}
Paid Amount: ৳${(invoice.paidAmount || 0).toLocaleString()}
Due Amount: ৳${(invoice.dueAmount || 0).toLocaleString()}

Thank you for your business!
${invoice.brand || 'Store'}
    `.trim();
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.orderNumber || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Invoice downloaded successfully');
  };

  const handleSinglePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice - ${invoice.orderNumber}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #000;
            }
            .invoice {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #000;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            th {
              background: #f5f5f5;
            }
            .total {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .invoice { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>${invoice.brand || 'N/A'}</h1>
              <h2>INVOICE</h2>
              <p>${invoice.orderNumber || 'N/A'}</p>
            </div>
            
            <div class="details">
              <div>
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> ${invoice.customer?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> ${invoice.customer?.phone || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3>Payment Status</h3>
                <p><strong>Status:</strong> ${invoice.paymentStatus || 'due'}</p>
                <p><strong>Total:</strong> ৳${(invoice.totalAmount || 0).toLocaleString()}</p>
                <p><strong>Due:</strong> ৳${(invoice.dueAmount || 0).toLocaleString()}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || []).map(item => `
                  <tr>
                    <td>${item.product?.title || 'N/A'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>৳${(item.price || 0).toLocaleString()}</td>
                    <td>৳${(item.total || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <p><strong>Subtotal:</strong> ৳${(invoice.subtotal || 0).toLocaleString()}</p>
              <p><strong>Delivery Charge:</strong> ৳${(invoice.courierCharge || 0).toLocaleString()}</p>
              <p><strong>Total Amount:</strong> ৳${(invoice.totalAmount || 0).toLocaleString()}</p>
              <p><strong>Paid Amount:</strong> ৳${(invoice.paidAmount || 0).toLocaleString()}</p>
              <p><strong>Due Amount:</strong> ৳${(invoice.dueAmount || 0).toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
              <option value="Go Baby">Go Baby</option>
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
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleSinglePrint(invoice)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => router.push(`/orders/${invoice._id}`)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
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