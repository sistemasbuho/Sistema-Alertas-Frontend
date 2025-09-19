import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@shared/components/ui/Button';
import ThemeToggle from '@shared/components/ui/ThemeToggle';
import {
  BellIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  onLogout: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: 'Ingestion',
      path: '/ingestion',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
          />
        </svg>
      ),
    },
    {
      name: 'Consulta de Datos',
      path: '/consulta-datos',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: 'Proyecto',
      path: '/proyecto',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      name: 'Historial',
      path: '/historial',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          collapsed ? 'lg:w-16' : 'lg:w-64'
        } ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}
      >
        <div
          className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BellIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            {!collapsed && (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Alertas
              </h1>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2">
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:block p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Colapsar sidebar"
                >
                  <ChevronDoubleLeftIcon className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {collapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Expandir sidebar"
            >
              <ChevronDoubleRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <nav className="flex-1 px-2 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-2' : 'px-4'
              } py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <span className={collapsed ? '' : 'mr-3'}>{item.icon}</span>
              {!collapsed && item.name}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {!collapsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tema
              </span>
              <ThemeToggle />
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          )}
          {collapsed ? (
            <button
              onClick={onLogout}
              className="w-full p-1 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              title="Cerrar Sesión"
            >
              <ArrowRightCircleIcon className="w-12 h-6 text-gray-700 dark:text-gray-300 stroke-2" />
            </button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full"
            >
              Cerrar Sesión
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
