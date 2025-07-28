const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = null;
    // Sistema de caché simple con TTL de 30 segundos
    this.cache = new Map();
    this.cacheTTL = 30 * 1000; // 30 segundos
    
    // Intentar recuperar API key de localStorage como respaldo
    this.loadApiKeyFromStorage();
  }

  // Cargar API key desde localStorage como respaldo
  loadApiKeyFromStorage() {
    try {
      const storedApiKey = localStorage.getItem('api_key');
      if (storedApiKey && storedApiKey !== 'null' && storedApiKey !== 'undefined') {
        this.apiKey = storedApiKey;
        console.log('🔑 API key cargada desde localStorage');
      }
    } catch (error) {
      console.warn('No se pudo cargar API key desde localStorage:', error);
    }
  }

  // Guardar API key en localStorage como respaldo
  saveApiKeyToStorage() {
    try {
      if (this.apiKey) {
        localStorage.setItem('api_key', this.apiKey);
        console.log('🔑 API key guardada en localStorage');
      } else {
        localStorage.removeItem('api_key');
        console.log('🔑 API key removida de localStorage');
      }
    } catch (error) {
      console.warn('No se pudo guardar API key en localStorage:', error);
    }
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.saveApiKeyToStorage();
    console.log('🔑 API key configurada:', apiKey ? '✅' : '❌');
  }

  // Verificar si tenemos una API key válida
  hasValidApiKey() {
    return this.apiKey && this.apiKey !== 'null' && this.apiKey !== 'undefined';
  }

  // Limpiar caché manualmente (útil después de crear/editar/eliminar)
  clearCache(pattern = null) {
    if (pattern) {
      // Limpiar solo las URLs que coincidan con el patrón
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpiar todo el caché
      this.cache.clear();
    }
  }

  // Generar clave de caché
  getCacheKey(url, method = 'GET') {
    return `${method}:${url}`;
  }

  // Verificar si hay datos en caché válidos
  getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  // Guardar datos en caché
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
      console.log('🔑 Incluyendo API key en headers');
    } else {
      console.warn('⚠️ No hay API key válida para incluir en headers');
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = this.getCacheKey(url, method);
    
    console.log(`🌐 Petición: ${method} ${endpoint}`, {
      hasApiKey: this.hasValidApiKey(),
      apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 16)}...` : 'none',
      apiKeyLength: this.apiKey ? this.apiKey.length : 0
    });
    
    // Solo usar caché para peticiones GET
    if (method === 'GET') {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`🔄 Cache hit para: ${method} ${endpoint}`);
        return cachedData;
      }
    }
    
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.method !== 'GET'),
        ...options.headers,
      },
      credentials: 'include', // Para cookies HttpOnly
    };

    // Log de headers para debugging
    console.log('📤 Headers enviados:', {
      ...config.headers,
      'X-API-KEY': config.headers['X-API-KEY'] ? `${config.headers['X-API-KEY'].substring(0, 16)}...` : 'none'
    });

    try {
      const response = await fetch(url, config);
      
      console.log(`📥 Respuesta recibida: ${response.status} ${response.statusText}`, {
        url: url,
        method: method
      });
      
      // Log de headers de respuesta para debugging
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('📥 Headers de respuesta:', responseHeaders);
      
      // Verificar rate limiting y almacenar info
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      // Almacenar info global de rate limit (lo usará el Dashboard)
      if (rateLimitRemaining !== null) {
        window.rateLimitInfo = {
          remaining: parseInt(rateLimitRemaining),
          reset: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null
        };
        
        if (parseInt(rateLimitRemaining) < 10) {
          console.warn(`Rate limit bajo: ${rateLimitRemaining} requests restantes`);
        }
      }

      // Si es un 401, limpiar la API key y el storage
      if (response.status === 401) {
        console.error('❌ Error 401: API key inválida o expirada', {
          currentApiKey: this.apiKey ? `${this.apiKey.substring(0, 16)}...` : 'none',
          url: url,
          method: method
        });
        
        // Obtener el cuerpo de la respuesta para más detalles
                 try {
           const errorBody = await response.clone().json();
           console.error('❌ Detalles del error 401:', errorBody);
         } catch {
           console.error('❌ No se pudo obtener detalles del error 401');
         }
        
        this.setApiKey(null);
        throw new Error('No autorizado');
      }

      // Si es un 429, mostrar mensaje de rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryTime = retryAfter ? `${retryAfter} segundos` : '1 hora';
        throw new Error(`Rate limit excedido (200 req/hora). Espera ${retryTime} o usa una nueva API key.`);
      }

      // Para DELETE exitoso sin contenido
      if (response.status === 204) {
        // Limpiar caché relacionado después de eliminar
        this.clearCache('/restaurants');
        return { success: true };
      }

      const data = await response.json();
      console.log(`📄 Datos de respuesta para ${method} ${endpoint}:`, data);

      if (!response.ok) {
        console.error(`❌ Error ${response.status}:`, data);
        
        // Para errores 400, mostrar más detalles
        if (response.status === 400) {
          console.error('Error 400 - Detalles completos:', {
            status: response.status,
            statusText: response.statusText,
            data: data,
            url: url,
            method: method
          });
          
          // Buscar el mensaje de error más específico
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

      console.log(`✅ Petición exitosa: ${method} ${endpoint}`);

      // Guardar en caché solo las peticiones GET exitosas
      if (method === 'GET') {
        this.setCachedData(cacheKey, data);
      } else {
        // Para POST/PUT/PATCH/DELETE, limpiar caché relacionado
        this.clearCache('/restaurants');
      }

      return data;
    } catch (error) {
      console.error(`💥 Error en petición ${method} ${endpoint}:`, error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose.');
      }
      throw error;
    }
  }

  // Métodos HTTP
  async get(endpoint, params = {}) {
    // Construir URL con parámetros sin duplicar la base URL
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