import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkAdminHealth } from '../services/api';

const Dashboard: React.FC = () => {
  const { authState } = useAuth();
  const [apiStatus, setApiStatus] = useState<{ status: string; version: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const status = await checkAdminHealth();
        setApiStatus(status);
      } catch (err) {
        setError('Could not connect to API server');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiStatus();
  }, []);

  const cards = [
    {
      title: 'API Documentation',
      description: 'Learn how to integrate with our API',
      icon: '📄',
      href: '/dashboard/api-docs',
      color: '#3b82f6',
    },
    {
      title: 'API Testing',
      description: 'Test the API with your own images',
      icon: '🧪',
      href: '/dashboard/api-testing',
      color: '#10b981',
    },
    {
      title: 'API Keys',
      description: 'Manage your API keys',
      icon: '🔑',
      href: '/dashboard/api-keys',
      color: '#8b5cf6',
    },
    {
      title: 'Examples',
      description: 'View example use cases',
      icon: '📋',
      href: '/dashboard/examples',
      color: '#f59e0b',
    },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, <span className="font-medium">{authState.user?.name || 'User'}</span>
          </p>
        </div>
      </div>

      {/* API Status */}
      <div className="dashboard-section">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">API Status</h3>
            <p className="dashboard-card-description">
              Current status of the OCR API service
            </p>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="spinner mx-auto"></div>
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="auth-form-error">
                  <h3 className="auth-form-error-message">{error}</h3>
                  <p>Please check your API connection and try again.</p>
                </div>
              </div>
            ) : (
              <div className="dashboard-table">
                <div className="flex py-2 border-b">
                  <div className="w-1/3 font-medium">Status</div>
                  <div className="w-2/3">
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: '#d1fae5',
                      color: '#065f46'
                    }}>
                      {apiStatus?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex py-2 border-b">
                  <div className="w-1/3 font-medium">Version</div>
                  <div className="w-2/3">
                    {apiStatus?.version || 'Unknown'}
                  </div>
                </div>
                <div className="flex py-2">
                  <div className="w-1/3 font-medium">API URL</div>
                  <div className="w-2/3">
                    {process.env.REACT_APP_API_URL || 'http://localhost:8421'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Quick Links</h2>
        </div>
        <div className="dashboard-stats">
          {cards.map((card) => (
            <div
              key={card.title}
              className="dashboard-stat-card"
            >
              <div className="flex items-center mb-4">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.375rem',
                  backgroundColor: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.25rem',
                  marginRight: '0.75rem'
                }}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-medium">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t">
                <Link
                  to={card.href}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                >
                  View
                  <span className="ml-1">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
