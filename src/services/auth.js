import apiService from './api.js';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
  }

  _ensureApiService() {
    if (!apiService || typeof apiService.post !== 'function') {
      throw new Error('Servicio API no disponible. Verifica la configuración.');
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback, index) => {
    console.log(`AuthService: Ejecutando listener ${index + 1}`);
      callback({
        user: this.user,
        isAuthenticated: this.isAuthenticated
      });
    });
  }

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

  async login(email) {
    try {
      this._ensureApiService();
      const response = await apiService.post('/auth/login', { email });
      if (response.api_key) {
        apiService.setApiKey(response.api_key);
        apiService.hasValidApiKey();
        this.user = response.user;
        this.isAuthenticated = true;
        this.notifyListeners();
      } else {
        console.warn('AuthService: No se recibió API key en la respuesta');
        throw new Error('No se recibió API key del servidor');
      }
      
      return response;
    } catch (error) {
      console.error('AuthService: Error en login:', error);
      this.user = null;
      this.isAuthenticated = false;
      apiService.setApiKey(null);
      this.notifyListeners();
      throw new Error(error.message || 'Error en el login');
    }
  }

  async logout() {
    try {
      this._ensureApiService();
      await apiService.post('/auth/logout');
    } catch (error) {
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

  async getCurrentUser() {
    try {
      this._ensureApiService();
      
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
      if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        return this.user;
      }
      
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
      throw new Error(error.message || 'Error al obtener el usuario actual');
    }
  }

  async checkAuth() {
    try {
      if (this.user && this.isAuthenticated) {
        return true;
      }

      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.error('AuthService: Error en checkAuth:', error);
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
      return false;
    }
  }

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

  getUser() {
    return this.user;
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  async testConnection() {
    try {
      this._ensureApiService();
      
      const response = await apiService.get('/auth/me');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService(); 