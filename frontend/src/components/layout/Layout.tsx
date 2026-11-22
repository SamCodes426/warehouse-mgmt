import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <Topbar isCollapsed={isCollapsed} />
      <main
        className={`flex-1 pt-20 pb-12 px-6 lg:px-8 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
