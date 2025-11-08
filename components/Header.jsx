'use client';
import { Bell, Search } from 'lucide-react';
import { useState } from 'react';

export default function Header({ user, sidebarOpen }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-semibold">Hi, {user?.name} 👋</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none w-64 border-gray-300"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <button className="text-gray-500 hover:text-gray-700 relative">
          <Bell size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
            {user?.photo ? (
              <img src={user.photo.url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-green-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.position || user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}