'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, ArrowLeft, User, Mail, Phone, 
  Shield, Camera, Upload, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function EditUserPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    isActive: true,
    permissions: []
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const router = useRouter();
  const params = useParams();

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
    fetchUser();
  }, [params.id]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.role === 'superadmin') {
          setCurrentUser(data.user);
        } else {
          router.push('/');
        }
      } else {
        router.push('/auth');
      }
    } catch (error) {
      router.push('/auth');
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          position: data.user.position || '',
          password: '',
          confirmPassword: '',
          role: data.user.role || 'admin',
          isActive: data.user.isActive !== undefined ? data.user.isActive : true,
          permissions: data.user.permissions || []
        });
        if (data.user.photo?.url) {
          setPhotoPreview(data.user.photo.url);
        }
      } else {
        toast.error('Failed to fetch user details');
        router.push('/users');
      }
    } catch (error) {
      toast.error('Failed to fetch user details');
      router.push('/users');
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
    
    // Validate passwords if provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare update data
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        role: formData.role,
        isActive: formData.isActive,
        permissions: formData.permissions
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Update user
      const userResponse = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to update user');
      }

      // If photo was selected, upload it
      // In the handleSubmit function, update the photo upload part:
if (photo) {
  setUploading(true);
  const photoFormData = new FormData();
  photoFormData.append('image', photo);
  photoFormData.append('userId', params.id); // Add userId to form data

  const uploadResponse = await fetch(`/api/users/upload-photo`, {
    method: 'POST',
    body: photoFormData,
  });

  if (!uploadResponse.ok) {
    const uploadError = await uploadResponse.json();
    throw new Error(uploadError.error || 'Failed to upload photo');
  }
  setUploading(false);
}

      toast.success('User updated successfully!');
      router.push('/users');
      
    } catch (error) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) return <Loading />;
  if (!currentUser || !user) return null;

  return (
    <div className="flex min-h-screen text-gray-800 bg-gray-50">
      <Sidebar user={currentUser} onLogout={() => {}} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header user={currentUser} />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/users')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">{user.name}</p>
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
              disabled={submitting || uploading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={20} />
              {submitting ? 'Saving...' : 'Save Changes'}
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
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
                      onChange={(e) => handleInputChange('email', e.target.value)}
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
                      onChange={(e) => handleInputChange('phone', e.target.value)}
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
                      onChange={(e) => handleInputChange('position', e.target.value)}
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
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={user.role === 'superadmin'} // Prevent changing superadmin role
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                    {user.role === 'superadmin' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Super admin role cannot be changed
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={user.role === 'superadmin'} // Prevent deactivating superadmin
                    >
                      <option value={true}>Active</option>
                      <option value={false}>Inactive</option>
                    </select>
                    {user.role === 'superadmin' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Super admin cannot be deactivated
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                      placeholder="Leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Only fill password fields if you want to change the password. 
                    Leave them blank to keep the current password.
                  </p>
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
                        disabled={user.role === 'superadmin'} // Superadmin has all permissions
                      />
                      <span className={`text-sm ${user.role === 'superadmin' ? 'text-gray-400' : 'text-gray-700'}`}>
                        {permission.label}
                      </span>
                    </label>
                  ))}
                </div>
                {user.role === 'superadmin' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Super admin users have all permissions by default.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Photo Upload & User Info */}
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
                          alt="Profile"
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
                    {uploading ? 'Uploading...' : 'Change Photo'}
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
                      New photo selected
                    </p>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">User Information</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-medium">{user._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-medium">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Logins:</span>
                    <span className="font-medium">{user.loginCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Quick Actions</h3>
                <button
                  type="button"
                  onClick={() => {
                    if (user.role !== 'superadmin') {
                      setFormData(prev => ({
                        ...prev,
                        permissions: allPermissions.map(p => p.key)
                      }));
                    }
                  }}
                  className="w-full text-blue-700 hover:text-blue-900 text-sm py-1 disabled:text-gray-400"
                  disabled={user.role === 'superadmin'}
                >
                  Select All Permissions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (user.role !== 'superadmin') {
                      setFormData(prev => ({
                        ...prev,
                        permissions: []
                      }));
                    }
                  }}
                  className="w-full text-blue-700 hover:text-blue-900 text-sm py-1 disabled:text-gray-400"
                  disabled={user.role === 'superadmin'}
                >
                  Clear All Permissions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      password: '',
                      confirmPassword: ''
                    }));
                  }}
                  className="w-full text-blue-700 hover:text-blue-900 text-sm py-1"
                >
                  Clear Password Fields
                </button>
              </div>

              {/* Danger Zone */}
              {user.role !== 'superadmin' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                        try {
                          const response = await fetch(`/api/users/${params.id}`, {
                            method: 'DELETE',
                          });

                          if (response.ok) {
                            toast.success('User deleted successfully');
                            router.push('/users');
                          } else {
                            const data = await response.json();
                            toast.error(data.error || 'Failed to delete user');
                          }
                        } catch (error) {
                          toast.error('Failed to delete user');
                        }
                      }
                    }}
                    className="w-full text-red-700 hover:text-red-900 text-sm py-2 border border-red-300 rounded hover:bg-red-100"
                  >
                    Delete User
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}