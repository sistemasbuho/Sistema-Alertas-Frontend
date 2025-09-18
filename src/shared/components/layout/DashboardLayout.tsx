import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@shared/contexts/AuthContext';
import { useToast } from '@shared/contexts/ToastContext';
import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleLogout = () => {
    try {
      logout();
      showSuccess('Sesión cerrada', 'Has cerrado sesión exitosamente');
      navigate('/login');
    } catch (error) {
      console.error('Error durante logout:', error);
      showError(
        'Error al cerrar sesión',
        'Hubo un problema al cerrar la sesión'
      );
      navigate('/login');
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 lg:pl-0 pl-16">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              {title.toLowerCase().includes('alert') && (
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
