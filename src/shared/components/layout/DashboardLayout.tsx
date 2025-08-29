import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar onLogout={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 lg:pl-0 pl-16">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
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
