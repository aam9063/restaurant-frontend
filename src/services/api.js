const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = null;
    this.cache = new Map();
    this.cacheTTL = 30 * 1000;

    this.loadApiKeyFromStorage();
  }

  loadApiKeyFromStorage() {
    try {
      const storedApiKey = localStorage.getItem('api_key');
      if (storedApiKey && storedApiKey !== 'null' && storedApiKey !== 'undefined') {
        this.apiKey = storedApiKey;
      }
    } catch (error) {
      console.warn('No se pudo cargar API key desde localStorage:', error);
    }
  }

  saveApiKeyToStorage() {
    try {
      if (this.apiKey) {
        localStorage.setItem('api_key', this.apiKey);
      } else {
        localStorage.removeItem('api_key');
      }
    } catch (error) {
      console.warn('No se pudo guardar API key en localStorage:', error);
    }
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.saveApiKeyToStorage();
  }

  hasValidApiKey() {
    return this.apiKey && this.apiKey !== 'null' && this.apiKey !== 'undefined';
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getCacheKey(url, method = 'GET') {
    return `${method}:${url}`;
  }

  getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  getHeaders(includeContentType = true) {
    const headers = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.hasValidApiKey()) {
      headers['X-API-KEY'] = this.apiKey;
    } else {
      console.warn(' No hay API key válida para incluir en headers');
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = this.getCacheKey(url, method);

    

    if (method === 'GET') {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.method !== 'GET'),
        ...options.headers,
      },
      credentials: 'include',
    };

    

    try {
      const response = await fetch(url, config);

      

      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      if (rateLimitRemaining !== null) {
        window.rateLimitInfo = {
          remaining: parseInt(rateLimitRemaining),
          reset: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null
        };

        if (parseInt(rateLimitRemaining) < 10) {
          console.warn(`Rate limit bajo: ${rateLimitRemaining} requests restantes`);
        }
      }

      if (response.status === 401) {
        console.error(' Error 401: API key inválida o expirada', {
          currentApiKey: this.apiKey ? `${this.apiKey.substring(0, 16)}...` : 'none',
          url: url,
          method: method
        });

        try {
          const errorBody = await response.clone().json();
          console.error('Detalles del error 401:', errorBody);
        } catch {
          console.error('No se pudo obtener detalles del error 401');
        }

        this.setApiKey(null);
        throw new Error('No autorizado');
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryTime = retryAfter ? `${retryAfter} segundos` : '1 hora';
        throw new Error(`Rate limit excedido (200 req/hora). Espera ${retryTime} o usa una nueva API key.`);
      }

      if (response.status === 204) {
        this.clearCache('/restaurants');
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Error ${response.status}:`, data);

        if (response.status === 400) {
          console.error('Error 400 - Detalles completos:', {
            status: response.status,
            statusText: response.statusText,
            data: data,
            url: url,
            method: method
          });

          let errorMessage = 'Error de validación';
          if (data.details && Array.isArray(data.details)) {
            errorMessage = data.details.join(', ');
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          }

          throw new Error(errorMessage);
        }

        throw new Error(data.message || `Error ${response.status}`);
      }


      if (method === 'GET') {
        this.setCachedData(cacheKey, data);
      } else {
        this.clearCache('/restaurants');
      }

      return data;
    } catch (error) {
      console.error(`Error en petición ${method} ${endpoint}:`, error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose.');
      }
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    let url = endpoint;

    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          searchParams.append(key, params[key]);
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request(url);
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiService(); 