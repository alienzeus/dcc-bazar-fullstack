'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, User, Shield, Bell, Lock, 
  Smartphone, Globe, CreditCard, Camera, Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Loading from '@/components/Loading';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    position: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: false,
    lowStockAlerts: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setProfileData({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            position: data.user.position || ''
          });
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

  const handleImageUpload = async (event) => {
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

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/users/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile photo updated successfully');
        setUser(prev => ({ ...prev, photo: data.photo }));
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      toast.error('Error uploading photo');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully');
        setUser(prev => ({ ...prev, ...profileData }));
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('An error occurred while updating password');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'security', label: 'Security', icon: Lock },
                  { id: 'preferences', label: 'Preferences', icon: Bell },
                  { id: 'device', label: 'Device Info', icon: Smartphone }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Profile Photo Section */}
                  <div className="lg:w-1/3">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                          {user.photo ? (
                            <img
                              src={user.photo.url}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-green-600 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <label 
                          htmlFor="photo-upload"
                          className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 transition-colors"
                        >
                          <Camera size={16} />
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>

                      <div className="mt-4">
                        <label 
                          htmlFor="photo-upload-full"
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 justify-center cursor-pointer hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Upload size={16} />
                          {uploading ? 'Uploading...' : 'Change Photo'}
                          <input
                            id="photo-upload-full"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG, WebP. Max 5MB.
                      </p>
                    </div>
                  </div>

                  {/* Profile Form Section */}
                  <div className="lg:w-2/3">
                    <form onSubmit={handleProfileUpdate}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            value={profileData.position}
                            onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                            placeholder="Enter your position"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                        >
                          <Save size={18} />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                    >
                      <Lock size={18} />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <form onSubmit={handlePreferencesUpdate}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Receive browser notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications}
                          onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Updates</h4>
                        <p className="text-sm text-gray-500">Receive email notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailUpdates}
                          onChange={(e) => setPreferences(prev => ({ ...prev, emailUpdates: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Low Stock Alerts</h4>
                        <p className="text-sm text-gray-500">Get notified when stock is low</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.lowStockAlerts}
                          onChange={(e) => setPreferences(prev => ({ ...prev, lowStockAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              )}

              {/* Device Info Tab */}
              {activeTab === 'device' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Device Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Last Login:</span>
                        <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IP Address:</span>
                        <span>{user.deviceInfo?.ip || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>User Agent:</span>
                        <span className="text-xs">{user.deviceInfo?.userAgent || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
                    <p className="text-sm text-yellow-700">
                      For your security, regularly update your password and avoid using public devices to access your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}