import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { authState, logout } = useAuth();

  return (
    <div className="header">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        ☰
      </button>
      <div className="header-title">
        Jaison Dashboard
      </div>
      <div className="header-actions">
        <div className="header-user">
          <div className="header-user-avatar">👤</div>
          <div className="header-user-name">
            {authState.user?.name || 'User'}
          </div>
          <button
            className="header-dropdown-toggle"
            onClick={logout}
          >
            <span className="sr-only">Sign out</span>
            ▼
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
