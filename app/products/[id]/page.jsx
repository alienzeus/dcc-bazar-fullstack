'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Package, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function ProductDetailPage() {
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    checkAuth();
    fetchProduct();
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

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        toast.error('Failed to fetch product details');
        router.push('/products');
      }
    } catch (error) {
      toast.error('Failed to fetch product details');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        router.push('/products');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= minStock) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const calculateProfit = () => {
    if (!product) return 0;
    return (product.sellPrice - product.buyPrice) * (product.salesCount || 0);
  };

  const calculateProfitMargin = () => {
    if (!product || product.buyPrice === 0) return 0;
    return ((product.sellPrice - product.buyPrice) / product.buyPrice) * 100;
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
  if (!user || !product) return null;

  const stockStatus = getStockStatus(product.stock, product.minStock);

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/products')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
              <p className="text-gray-600">{product.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push(`/products/${product._id}/edit`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Edit size={20} />
              Edit Product
            </button>
            <button 
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
            >
              <Trash2 size={20} />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Product Images</h2>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url || image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No images available</p>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Title</label>
                    <p className="font-medium text-lg">{product.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Description</label>
                    <p className="font-medium">{product.description || 'No description'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Category</label>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Brand</label>
                    <p className="font-medium">{product.brand}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">SKU</label>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Created</label>
                    <p className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Last Updated</label>
                    <p className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Pricing Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Buy Price:</span>
                  <span className="font-medium">৳{product.buyPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sell Price:</span>
                  <span className="font-medium text-green-600">৳{product.sellPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">Profit per Unit:</span>
                  <span className="font-bold text-blue-600">
                    ৳{(product.sellPrice - product.buyPrice)?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className="font-medium text-blue-600">
                    {calculateProfitMargin().toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Stock Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className={`font-medium ${
                    product.stock === 0 ? 'text-red-600' : 
                    product.stock <= product.minStock ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {product.stock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Stock:</span>
                  <span className="font-medium">{product.minStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Sales Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales:</span>
                  <span className="font-medium">{product.salesCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium text-green-600">
                    ৳{((product.sellPrice || 0) * (product.salesCount || 0))?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">Total Profit:</span>
                  <span className="font-bold text-blue-600">
                    ৳{calculateProfit()?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
              <div className="space-y-2">
                {product.features && product.features.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">Features</label>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">Specifications</label>
                    <div className="text-sm mt-1 space-y-1">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}