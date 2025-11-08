'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, ArrowLeft, User, Mail, Phone, 
  MapPin, Shield, Camera, Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function NewUserPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    permissions: [
      'products:read',
      'orders:read',
      'customers:read',
      'analytics:read'
    ]
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const allPermissions = [
    { key: 'products:read', label: 'View Products' },
    { key: 'products:write', label: 'Create/Edit Products' },
    { key: 'products:delete', label: 'Delete Products' },
    { key: 'orders:read', label: 'View Orders' },
    { key: 'orders:write', label: 'Create/Edit Orders' },
    { key: 'orders:delete', label: 'Delete Orders' },
    { key: 'customers:read', label: 'View Customers' },
    { key: 'customers:write', label: 'Create/Edit Customers' },
    { key: 'customers:delete', label: 'Delete Customers' },
    { key: 'users:read', label: 'View Users' },
    { key: 'users:write', label: 'Create/Edit Users' },
    { key: 'users:delete', label: 'Delete Users' },
    { key: 'analytics:read', label: 'View Analytics' },
    { key: 'settings:write', label: 'Modify Settings' }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.role === 'superadmin') {
          setUser(data.user);
        } else {
          router.push('/');
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

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);

    try {
      // First, create the user
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions
        }),
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to create user');
      }

      // If photo was selected, upload it
      if (photo) {
        const photoFormData = new FormData();
        photoFormData.append('image', photo);

        await fetch(`/api/users/${userData.user._id}/upload-photo`, {
          method: 'POST',
          body: photoFormData,
        });
      }

      toast.success('User created successfully!');
      router.push('/users');
      
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
              <p className="text-gray-600">Add a new admin user to the system</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={20} />
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>

        <form id="user-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info & Photo */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User size={20} />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter position"
                    />
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield size={20} />
                  Security & Access
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Confirm password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin" disabled>Super Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPermissions.map(permission => (
                    <label key={permission.key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Photo Upload */}
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Camera size={20} />
                  Profile Photo
                </h2>
                
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User size={48} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <label 
                    htmlFor="user-photo-upload"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 justify-center cursor-pointer hover:bg-green-700 transition-colors text-sm"
                  >
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      id="user-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>

                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WebP. Max 5MB.
                  </p>

                  {photo && (
                    <p className="text-sm text-green-600 mt-2">
                      Photo selected
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Quick Setup</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      permissions: allPermissions.map(p => p.key)
                    }));
                  }}
                  className="w-full text-blue-700 hover:text-blue-900 text-sm py-1"
                >
                  Select All Permissions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      permissions: []
                    }));
                  }}
                  className="w-full text-blue-700 hover:text-blue-900 text-sm py-1"
                >
                  Clear All Permissions
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}