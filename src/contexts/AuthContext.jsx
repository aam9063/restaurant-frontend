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

  // Configurar listener para cambios en el servicio de autenticación
  useEffect(() => {
    
    const handleAuthChange = ({ user, isAuthenticated }) => {
      console.log('AuthContext: Cambio de autenticación recibido', { user: user?.name, isAuthenticated });
      setUser(user);
      setIsAuthenticated(isAuthenticated);
      setError(null);
      
      // Asegurar que la API key esté configurada si el usuario está autenticado
      if (isAuthenticated && user?.api_key) {
        apiService.setApiKey(user.api_key);
        console.log('AuthContext: API key configurada en apiService');
      } else if (!isAuthenticated) {
        apiService.setApiKey(null);
        console.log('AuthContext: API key removida de apiService');
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
      
      console.log('AuthContext: Verificando estado de autenticación...');
      
      const isAuth = await authService.checkAuth();
      
      if (isAuth) {
        const currentUser = authService.getUser();
        console.log('AuthContext: Usuario autenticado encontrado:', currentUser?.name);
        
        // Asegurar que la API key esté configurada
        if (currentUser?.api_key) {
          apiService.setApiKey(currentUser.api_key);
          console.log('AuthContext: API key configurada correctamente');
        }
        
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        console.log('AuthContext: No hay usuario autenticado');
        setUser(null);
        setIsAuthenticated(false);
        apiService.setApiKey(null);
      }
    } catch (error) {
      console.log('AuthContext: Error en verificación de autenticación:', error.message);
      setUser(null);
      setIsAuthenticated(false);
      setError(null); // No mostrar error por no tener sesión
      apiService.setApiKey(null);
    } finally {
      setIsLoading(false);
      console.log('AuthContext: Verificación de autenticación completada');
    }
  };

  const login = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('AuthContext: Iniciando login para:', email);
      const response = await authService.login(email);
      
      // Verificar que recibimos la API key
      if (response.api_key) {
        console.log('AuthContext: API key recibida en login');
        apiService.setApiKey(response.api_key);
      } else {
        console.warn('AuthContext: No se recibió API key en la respuesta de login');
      }
      
      // El listener del servicio actualizará el estado automáticamente
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
      
      console.log('AuthContext: Iniciando registro para:', userData.email);
      const response = await authService.register(userData);
      
      // Verificar que recibimos la API key
      if (response.api_key) {
        console.log('AuthContext: API key recibida en registro');
        apiService.setApiKey(response.api_key);
      } else {
        console.warn('AuthContext: No se recibió API key en la respuesta de registro');
      }
      
      // El listener del servicio actualizará el estado automáticamente
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
      
      console.log('AuthContext: Iniciando logout');
      await authService.logout();
      
      // El listener del servicio actualizará el estado automáticamente
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      const errorMessage = error.message || 'Error al cerrar sesión';
      console.warn('AuthContext: Error en logout:', errorMessage);
      // No mostrar toast de error para logout, ya que el local funciona
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApiKey = async () => {
    try {
      setError(null);
      
      console.log('AuthContext: Renovando API key');
      const response = await authService.refreshApiKey();
      
      // Actualizar la API key en el servicio
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
        console.log('AuthContext: Nueva API key configurada');
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

  // Verificar si la API key está configurada
  const isApiKeyConfigured = () => {
    return apiService.hasValidApiKey();
  };

  const value = {
    // Estado
    user,
    isAuthenticated: isAuthenticated && isApiKeyConfigured(), // Solo autenticado si hay API key
    isLoading,
    error,
    
    // Acciones
    login,
    register,
    logout,
    refreshApiKey,
    checkAuthStatus,
    clearError,
    
    // Información del usuario
    userEmail: user?.email || '',
    userName: user?.name || '',
    userRoles: user?.roles || [],
    userApiKey: user?.api_key || '',
    isActive: user?.is_active || false,
    
    // Helpers
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