'use client';
import { 
  BarChart, ShoppingCart, Package, Users, 
  DollarSign, Wallet, Settings, LogOut,
  Menu 
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { icon: BarChart, label: 'Dashboard', href: '/', permission: 'analytics:read' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders', permission: 'orders:read' },
    { icon: Package, label: 'Products', href: '/products', permission: 'products:read' },
    { icon: Users, label: 'Customers', href: '/customers', permission: 'customers:read' },
    { icon: DollarSign, label: 'Invoices', href: '/invoices', permission: 'orders:read' },
    { icon: Wallet, label: 'History Log', href: '/history', permission: 'analytics:read' },
  ];

  if (user?.role === 'superadmin') {
    menuItems.push({ 
      icon: Users, 
      label: 'User Management', 
      href: '/users', 
      permission: 'users:read' 
    });
  }

  menuItems.push({ icon: Settings, label: 'Settings', href: '/settings', permission: 'settings:write' });

  const hasPermission = (permission) => {
    if (user?.role === 'superadmin') return true;
    return user?.permissions?.includes(permission);
  };

  return (
    <aside className={`sidebar bg-white border-r p-5 flex flex-col ${sidebarOpen ? 'w-64' : 'w-24'} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-10">
        <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          {sidebarOpen && <span className="logo-text">DCC Bazar</span>}
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-green-600 p-1 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-left transition-colors ${
                isActive 
                  ? 'bg-green-50 text-green-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              {sidebarOpen && <span className="nav-text">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 w-full text-left text-gray-700"
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="nav-text">Logout</span>}
        </button>
      </div>
    </aside>
  );
}