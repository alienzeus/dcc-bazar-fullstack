'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Minus, Search, X, Save, ArrowLeft,
  ShoppingCart, User, Package, DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function NewOrderPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    customer: {
      name: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    items: [],
    courierCharge: 0,
    deliveryMethod: 'pathao',
    deliveryPerson: {
      name: '',
      phone: ''
    },
    paymentMethod: 'cash',
    paidAmount: 0,
    brand: 'DCC Bazar',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products.slice(0, 10));
    }
  }, [productSearch, products]);

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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setFilteredProducts(data.products.slice(0, 10));
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const handleCustomerSearch = (phone) => {
    const customer = customers.find(c => c.phone === phone);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || {}
        }
      }));
    }
  };

  const addProduct = (product) => {
    const existingItem = formData.items.find(item => item.product._id === product._id);
    
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product,
            quantity: 1,
            price: product.sellPrice,
            total: product.sellPrice
          }
        ]
      }));
    }
    
    setShowProductSearch(false);
    setProductSearch('');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product._id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    }));
  };

  const removeItem = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product._id !== productId)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal + (formData.courierCharge || 0);
    const dueAmount = totalAmount - (formData.paidAmount || 0);

    return { subtotal, totalAmount, dueAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { subtotal, totalAmount, dueAmount } = calculateTotals();

      const orderData = {
        ...formData,
        subtotal,
        totalAmount,
        dueAmount,
        items: formData.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Order created successfully!');
        router.push('/orders');
      } else {
        toast.error(data.error || 'Failed to create order');
      }
    } catch (error) {
      toast.error('An error occurred while creating the order');
    } finally {
      setSubmitting(false);
    }
  };

  const { subtotal, totalAmount, dueAmount } = calculateTotals();

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={() => {}} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
              <p className="text-gray-600">Create a new customer order</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="order-form"
              disabled={submitting || formData.items.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>

        <form id="order-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Delivery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={20} />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer.phone}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        customer: { ...prev.customer, phone: e.target.value }
                      }));
                      if (e.target.value.length >= 11) {
                        handleCustomerSearch(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer: { ...prev.customer, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.customer.address.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer: { 
                        ...prev.customer, 
                        address: { ...prev.customer.address, street: e.target.value }
                      }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter delivery address"
                  />
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package size={20} />
                  Order Items
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                >
                  <Plus size={20} />
                  Add Product
                </button>
              </div>

              {/* Product Search Modal */}
              {showProductSearch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Select Products</h3>
                      <button
                        onClick={() => {
                          setShowProductSearch(false);
                          setProductSearch('');
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by name or SKU..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addProduct(product)}
                        >
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-gray-500">SKU: {product.sku} | Stock: {product.stock}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">৳{product.sellPrice}</p>
                            <p className="text-sm text-gray-500">Buy: ৳{product.buyPrice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items List */}
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={item.product._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {item.product.images?.[0] && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.title}</p>
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center px-2 py-1 border rounded">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="text-right min-w-24">
                        <p className="font-semibold">৳{item.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">৳{item.price} each</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeItem(item.product._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No products added yet</p>
                    <button
                      type="button"
                      onClick={() => setShowProductSearch(true)}
                      className="mt-2 text-green-600 hover:text-green-700"
                    >
                      Click here to add products
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart size={20} />
                Order Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="DCC Bazar">DCC Bazar</option>
                    <option value="Go Baby">Go Baby</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={formData.deliveryMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="pathao">Pathao</option>
                    <option value="delivery_person">Delivery Person</option>
                    <option value="pickup">Customer Pickup</option>
                  </select>
                </div>

                {formData.deliveryMethod === 'delivery_person' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Person Name
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryPerson.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          deliveryPerson: { ...prev.deliveryPerson, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryPerson.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          deliveryPerson: { ...prev.deliveryPerson, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Courier Charge
                  </label>
                  <input
                    type="number"
                    value={formData.courierCharge}
                    onChange={(e) => setFormData(prev => ({ ...prev, courierCharge: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bkash">bKash</option>
                    <option value="nogod">Nagad</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Order Summary
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courier Charge:</span>
                  <span>৳{formData.courierCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>৳{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span>৳{formData.paidAmount.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between text-lg font-semibold border-t pt-2 ${
                  dueAmount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  <span>Due Amount:</span>
                  <span>৳{dueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}