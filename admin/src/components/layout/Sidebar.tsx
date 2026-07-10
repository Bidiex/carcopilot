import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, Sparkles, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function Sidebar() {
  const { signOut } = useAdminAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Usuarios', path: '/users', icon: Users },
    { name: 'Notificaciones', path: '/notifications', icon: Bell },
    { name: 'Splash Promocional', path: '/promo-splashes', icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col flex-shrink-0 transition-colors">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
          Copiloto <span className="text-primary">Admin</span>
        </h2>
      </div>
      
      <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="mr-3" size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={signOut}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        >
          <LogOut className="mr-3" size={20} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
