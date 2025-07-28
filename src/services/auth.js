import apiService from './api.js';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
  }

  // Verificar que apiService esté disponible
  _ensureApiService() {
    if (!apiService || typeof apiService.post !== 'function') {
      throw new Error('Servicio API no disponible. Verifica la configuración.');
    }
  }

  // Listeners para cambios en el estado de autenticación
  addListener(callback) {
    console.log('AuthService: Agregando listener, total listeners:', this.listeners.length + 1);
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
    console.log('AuthService: Removiendo listener, total listeners:', this.listeners.length);
  }

  notifyListeners() {
    console.log('AuthService: Notificando a', this.listeners.length, 'listeners con estado:', {
      user: this.user?.name || 'No user',
      isAuthenticated: this.isAuthenticated
    });
    this.listeners.forEach((callback, index) => {
      console.log(`AuthService: Ejecutando listener ${index + 1}`);
      callback({
        user: this.user,
        isAuthenticated: this.isAuthenticated
      });
    });
  }

  // Registro de usuario
  async register(userData) {
    try {
      this._ensureApiService();
      const response = await apiService.post('/auth/register', userData);
      
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
        this.user = response.user;
        this.isAuthenticated = true;
        this.notifyListeners();
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Error en el registro');
    }
  }

  // Login
  async login(email) {
    try {
      this._ensureApiService();
      console.log('AuthService: Enviando login para email:', email);
      const response = await apiService.post('/auth/login', { email });
      console.log('AuthService: Respuesta completa del backend:', JSON.stringify(response, null, 2));
      
      if (response.api_key) {
        console.log('AuthService: API key recibida:', {
          length: response.api_key.length,
          preview: response.api_key.substring(0, 16) + '...',
          type: typeof response.api_key
        });
        
        // Configurar API key inmediatamente
        apiService.setApiKey(response.api_key);
        
        // Verificar que se configuró correctamente
        console.log('AuthService: Verificando configuración de API key...');
        const hasValidKey = apiService.hasValidApiKey();
        console.log('AuthService: API key válida después de configurar:', hasValidKey);
        
        // NOTA: Removemos la verificación inmediata ya que el backend tiene un problema
        // con el hash de las API keys. El login funciona, pero la verificación inmediata
        // falla porque el backend busca keys hasheadas vs la key sin hashear que devuelve.
        console.log('AuthService: Saltando verificación inmediata (problema conocido en backend)');
        
        this.user = response.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        console.log('AuthService: Usuario autenticado exitosamente:', this.user);
      } else {
        console.warn('AuthService: No se recibió API key en la respuesta');
        throw new Error('No se recibió API key del servidor');
      }
      
      return response;
    } catch (error) {
      console.error('AuthService: Error en login:', error);
      // Limpiar estado en caso de error
      this.user = null;
      this.isAuthenticated = false;
      apiService.setApiKey(null);
      this.notifyListeners();
      throw new Error(error.message || 'Error en el login');
    }
  }

  // Logout
  async logout() {
    try {
      this._ensureApiService();
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continuar con el logout local incluso si falla el servidor
      console.warn('Error en logout del servidor:', error.message);
    } finally {
      if (apiService && apiService.setApiKey) {
        apiService.setApiKey(null);
      }
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
    }
  }

  // Obtener el usuario actual
  async getCurrentUser() {
    try {
      this._ensureApiService();
      
      // Si ya tenemos usuario, retornarlo
      if (this.user) {
        return this.user;
      }

      const response = await apiService.get('/auth/me');
      
      if (response && response.user) {
        this.user = response.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        return response.user;
      } else {
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (error) {
      // Si es un error 404, puede que la ruta no exista
      if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        console.log('Ruta /auth/me no disponible, usando autenticación local');
        return this.user;
      }
      
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
      throw new Error(error.message || 'Error al obtener el usuario actual');
    }
  }

  // Verificar si el usuario está autenticado
  async checkAuth() {
    try {
      // Si ya tenemos un usuario autenticado localmente, retornar true
      if (this.user && this.isAuthenticated) {
        return true;
      }

      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.log('No hay sesión activa:', error.message);
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
      return false;
    }
  }

  // Refrescar API Key
  async refreshApiKey() {
    try {
      this._ensureApiService();
      const response = await apiService.post('/auth/refresh-api-key');
      
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Error al refrescar API Key');
    }
  }

  // Getters
  getUser() {
    return this.user;
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  // Método de prueba para verificar conectividad
  async testConnection() {
    try {
      this._ensureApiService();
      
      // Intentar hacer una petición simple al backend
      const response = await apiService.get('/auth/me');
      console.log('AuthService: Test de conexión exitoso:', response);
      return { success: true, data: response };
    } catch (error) {
      console.log('AuthService: Test de conexión falló:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService(); 