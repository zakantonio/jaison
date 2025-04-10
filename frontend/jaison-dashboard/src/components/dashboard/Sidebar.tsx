import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'API Documentation', href: '/dashboard/api-docs', icon: '📄' },
  { name: 'API Testing', href: '/dashboard/api-testing', icon: '🧪' },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: '🔑' },
  { name: 'Examples', href: '/dashboard/examples', icon: '📋' },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="sidebar-overlay">
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          <div className="sidebar sidebar-mobile">
            <div className="sidebar-close">
              <button
                type="button"
                className="sidebar-close-button"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                ✕
              </button>
            </div>
            <div className="sidebar-header">
              <h1 className="sidebar-logo">Jaison</h1>
            </div>
            <div className="sidebar-nav">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                  end={item.href === '/dashboard'}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="sidebar-spacer" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="sidebar desktop-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Jaison</h1>
        </div>
        <div className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              end={item.href === '/dashboard'}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Sidebar toggle button for mobile */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        ☰
      </button>
    </>
  );
};

export default Sidebar;
