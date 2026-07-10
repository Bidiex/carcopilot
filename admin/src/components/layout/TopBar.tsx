import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Dashboard' }: TopBarProps) {
  const { session } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 flex-shrink-0 transition-colors">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white transition-colors">{title}</h1>
      
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {session?.user?.email}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {session?.user?.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
