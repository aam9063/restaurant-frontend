import React, { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import authService from '../services/auth.js';
import apiService from '../services/api.js';
import toast from 'react-hot-toast';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const handleAuthChange = ({ user, isAuthenticated }) => {
      setUser(user);
      setIsAuthenticated(isAuthenticated);
      setError(null);
      
      if (isAuthenticated && user?.api_key) {
        apiService.setApiKey(user.api_key);
      } else if (!isAuthenticated) {
        apiService.setApiKey(null);
      }
    };

    authService.addListener(handleAuthChange);

    return () => {
      authService.removeListener(handleAuthChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      
      const isAuth = await authService.checkAuth();
      
      if (isAuth) {
        const currentUser = authService.getUser();
        
        // Asegurar que la API key esté configurada
        if (currentUser?.api_key) {
          apiService.setApiKey(currentUser.api_key);
        }
        
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        apiService.setApiKey(null);
      }
    } catch (error) {
      console.error('AuthContext: Error en checkAuthStatus:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      apiService.setApiKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(email);
      
      // Verificar que recibimos la API key
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
      } else {
        console.warn('AuthContext: No se recibió API key en la respuesta de login');
      }
      
      toast.success(`¡Bienvenido, ${response.user.name}!`);
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error en el login';
      console.error('AuthContext: Error en login:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      // Verificar que recibimos la API key
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
      } else {
        console.warn('AuthContext: No se recibió API key en la respuesta de registro');
      }
      
      toast.success(`¡Cuenta creada exitosamente! Bienvenido, ${response.user.name}!`);
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error en el registro';
      console.error('AuthContext: Error en registro:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.logout();
      
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      const errorMessage = error.message || 'Error al cerrar sesión';
      console.warn('AuthContext: Error en logout:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApiKey = async () => {
    try {
      setError(null);
      
      const response = await authService.refreshApiKey();
      
      // Actualizar la API key en el servicio
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
      }
      
      toast.success('API Key renovada exitosamente');
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al renovar API Key';
      console.error('AuthContext: Error al renovar API key:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const isApiKeyConfigured = () => {
    return apiService.hasValidApiKey();
  };

  const value = {
    user,
    isAuthenticated: isAuthenticated && isApiKeyConfigured(), 
    isLoading,
    error,
    
    login,
    register,
    logout,
    refreshApiKey,
    checkAuthStatus,
    clearError,
    
    userEmail: user?.email || '',
    userName: user?.name || '',
    userRoles: user?.roles || [],
    userApiKey: user?.api_key || '',
    isActive: user?.is_active || false,
    
    hasRole: (role) => user?.roles?.includes(role) || false,
    isAdmin: user?.roles?.includes('ROLE_ADMIN') || false,
    isApiKeyConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 