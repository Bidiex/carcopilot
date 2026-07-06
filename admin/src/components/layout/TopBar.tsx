import { useAdminAuth } from '../../context/AdminAuthContext';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Dashboard' }: TopBarProps) {
  const { session } = useAdminAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-600">
          {session?.user?.email}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {session?.user?.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
