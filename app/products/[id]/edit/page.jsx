'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function EditProductPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sku: '',
    category: '',
    brand: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
    images: [],
    features: [],
    specifications: {}
  });
  const [newFeature, setNewFeature] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState([]);

// Add this to fetch categories
const fetchCategories = async () => {
  try {
    const response = await fetch('/api/categories');
    if (response.ok) {
      const data = await response.json();
      setCategories(data.categories);
    }
  } catch (error) {
    toast.error('Failed to fetch categories');
  }
};


  useEffect(() => {
    checkAuth();
    fetchProduct();
    fetchCategories();
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
        setFormData({
          title: data.product.title || '',
          description: data.product.description || '',
          sku: data.product.sku || '',
          category: data.product.category || '',
          brand: data.product.brand || '',
          buyPrice: data.product.buyPrice || 0,
          sellPrice: data.product.sellPrice || 0,
          stock: data.product.stock || 0,
          minStock: data.product.minStock || 5,
          images: data.product.images || [],
          features: data.product.features || [],
          specifications: data.product.specifications || {}
        });
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

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);

    try {
      for (const file of files) {
        // Validate file type and size
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
          toast.error('Please select valid image files (JPEG, PNG, WebP)');
          continue;
        }

        if (file.size > maxSize) {
          toast.error('Image size should be less than 5MB');
          continue;
        }

        // Upload image
        const uploadedImage = await uploadImageToCloudinary(file);
        
        // Add to form data
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, uploadedImage]
        }));
      }
      
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare the data for API
      const submitData = {
        title: formData.title,
        description: formData.description,
        sku: formData.sku,
        category: formData.category,
        brand: formData.brand,
        buyPrice: formData.buyPrice,
        sellPrice: formData.sellPrice,
        stock: formData.stock,
        minStock: formData.minStock,
        images: formData.images,
        features: formData.features,
        specifications: formData.specifications
      };

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success('Product updated successfully');
        router.push(`/products/${params.id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update product');
      }
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Calculate profit and margin
  const profit = formData.sellPrice - formData.buyPrice;
  const profitMargin = formData.buyPrice > 0 ? (profit / formData.buyPrice) * 100 : 0;

  if (loading) return <Loading />;
  if (!user || !product) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/products/${params.id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600">{product.title}</p>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
  <select
    required
    value={formData.category}
    onChange={(e) => handleInputChange('category', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
  >
    <option value="">Select Category</option>
    {categories.map(category => (
      <option key={category._id} value={category.name}>
        {category.name} ({category.brand})
      </option>
    ))}
  </select>
</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Product Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <div className="col-span-full text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No images uploaded</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && (
                  <div className="text-sm text-gray-500">Uploading...</div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, WebP. Max 5MB per image.
              </p>
            </div>

            {/* Features */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Features</h2>
              <div className="space-y-2 mb-4">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {formData.features.length === 0 && (
                  <p className="text-gray-500 text-center py-2">No features added</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Enter a feature"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Specifications</h2>
              <div className="space-y-2 mb-4">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{key}:</span>
                    <div className="flex items-center gap-2">
                      <span>{value}</span>
                      <button
                        type="button"
                        onClick={() => removeSpecification(key)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(formData.specifications).length === 0 && (
                  <p className="text-gray-500 text-center py-2">No specifications added</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Specification name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="text"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  placeholder="Specification value"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                type="button"
                onClick={addSpecification}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Specification
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Pricing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.buyPrice}
                    onChange={(e) => handleNumberInputChange('buyPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.sellPrice}
                    onChange={(e) => handleNumberInputChange('sellPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Profit per Unit:</span>
                      <span className="font-semibold">৳{profit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Margin:</span>
                      <span className="font-semibold">{profitMargin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Stock Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => handleNumberInputChange('stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={(e) => handleNumberInputChange('minStock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className={`p-3 rounded-lg ${
                  formData.stock === 0 ? 'bg-red-50 text-red-800' :
                  formData.stock <= formData.minStock ? 'bg-yellow-50 text-yellow-800' :
                  'bg-green-50 text-green-800'
                }`}>
                  <div className="text-sm font-medium">
                    {formData.stock === 0 ? 'Out of Stock' :
                     formData.stock <= formData.minStock ? 'Low Stock' :
                     'In Stock'}
                  </div>
                  <div className="text-xs mt-1">
                    {formData.stock === 0 ? 'No items in stock' :
                     formData.stock <= formData.minStock ? `Only ${formData.stock} items left` :
                     `${formData.stock} items available`}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Product Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product ID:</span>
                  <span className="font-medium">{product._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales:</span>
                  <span className="font-medium">{product.salesCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium text-green-600">
                    ৳{((product.sellPrice || 0) * (product.salesCount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Quick Actions</h3>
              <button
                type="button"
                onClick={() => router.push(`/products/${params.id}`)}
                className="w-full text-blue-700 hover:text-blue-900 text-sm py-1 text-left"
              >
                View Product Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    features: []
                  }));
                }}
                className="w-full text-blue-700 hover:text-blue-900 text-sm py-1 text-left"
              >
                Clear All Features
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    specifications: {}
                  }));
                }}
                className="w-full text-blue-700 hover:text-blue-900 text-sm py-1 text-left"
              >
                Clear All Specifications
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}