import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UtensilsCrossed, User, LogOut, Settings, Key } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, userName, userEmail, logout, isLoading } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    if (!isLoading) {
      await logout();
    }
  };

  const NavLink = ({ to, children, className = '' }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to}
        className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
          isActive 
            ? 'bg-primary-100 text-primary-700' 
            : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
        } ${className}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <Header className="bg-white shadow-soft border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y navegación principal */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-primary-600" />
              <span className="font-display font-bold text-xl text-secondary-800">
                RestaurantApp
              </span>
            </Link>

            {isAuthenticated && (
              <nav className="hidden md:flex space-x-1">
                <NavLink to="/dashboard">Dashboard</NavLink>
              </nav>
            )}
          </div>

          {/* Menú de usuario */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="btn-outline text-sm"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary text-sm"
                >
                  Registrarse
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Información del usuario */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-secondary-800">
                    {userName}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {userEmail}
                  </p>
                </div>

                {/* Avatar con menú desplegable */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 p-2 rounded-lg hover:bg-secondary-100 transition-colors duration-200">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                  </button>

                  {/* Menú desplegable */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-secondary-800">
                          {userName}
                        </p>
                        <p className="text-xs text-secondary-500 truncate">
                          {userEmail}
                        </p>
                      </div>
                      
                      <button 
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-200 disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isLoading ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Navegación móvil */}
          {isAuthenticated && (
            <nav className="md:hidden py-3 border-t border-gray-100">
              <div className="flex space-x-1 overflow-x-auto">
                <NavLink to="/dashboard" className="whitespace-nowrap">Dashboard</NavLink>
              </div>
            </nav>
          )}
      </div>
    </Header>
  );
};

export default Header; 