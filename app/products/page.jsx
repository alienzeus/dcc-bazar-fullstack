'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, Edit, Trash2, 
  Eye, Package, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function ProductsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Error deleting product');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const brands = [...new Set(products.map(p => p.brand))];

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= minStock) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
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
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <button 
            onClick={() => router.push('/products/new')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.minStock);
            
            return (
              <div key={product._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                      {product.title}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                      {product.brand}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    SKU: {product.sku} | Category: {product.category}
                  </div>

                  {/* Pricing and Stock */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        ৳{product.sellPrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Cost: ৳{product.buyPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Stock: {product.stock}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.minStock}
                      </div>
                    </div>
                  </div>

                  {/* Sales Info */}
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>Sales: {product.salesCount || 0}</span>
                    <span>Profit: ৳{((product.sellPrice - product.buyPrice) * (product.salesCount || 0)).toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/products/${product._id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/products/${product._id}/edit`)}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || categoryFilter !== 'all' || brandFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first product'
              }
            </p>
            <button
              onClick={() => router.push('/products/new')}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Product
            </button>
          </div>
        )}
      </main>
    </div>
  );
}