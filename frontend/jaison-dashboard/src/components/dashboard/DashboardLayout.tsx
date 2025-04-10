import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="main-content">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="dashboard-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
