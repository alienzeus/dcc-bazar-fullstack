'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Tag, X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function CategoriesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: 'Go Baby'
  });
  const [formLoading, setFormLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      brand: 'Go Baby'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      brand: category.brand
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setFormLoading(true);

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory._id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingCategory 
            ? 'Category updated successfully' 
            : 'Category created successfully'
        );
        resetForm();
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to save category');
      }
    } catch (error) {
      toast.error('Error saving category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Category deleted successfully');
        fetchCategories();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus, categoryName) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      });

      if (response.ok) {
        toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchCategories();
      } else {
        toast.error('Failed to update category status');
      }
    } catch (error) {
      toast.error('Error updating category status');
    }
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={user} onLogout={() => {}} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={user} />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage product categories</p>
          </div>
          <button 
            onClick={handleCreate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {/* Category Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Go Baby">Go Baby</option>
                    <option value="DCC Bazar">DCC Bazar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter category description (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {formLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories by name, description, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div 
              key={category._id} 
              className={`bg-white rounded-lg shadow-sm border p-4 ${
                !category.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    category.brand === 'Go Baby' 
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      category.brand === 'Go Baby'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {category.brand}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(category._id, category.isActive, category.name)}
                    className={`p-1 text-xs ${
                      category.isActive 
                        ? 'text-yellow-600 hover:text-yellow-900' 
                        : 'text-green-600 hover:text-green-900'
                    }`}
                    title={category.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {category.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(category._id, category.name)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {category.description && (
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  Status: 
                  <span className={`ml-1 ${
                    category.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </span>
                <span>
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No categories found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first category'}
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Category
            </button>
          </div>
        )}
      </main>
    </div>
  );
}