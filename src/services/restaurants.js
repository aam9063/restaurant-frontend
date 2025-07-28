import apiService from './api.js';

class RestaurantService {
  // Obtener todos los restaurantes con paginación optimizada
  async getRestaurants(page = 1, itemsPerPage = 10) {
    try {
      const params = {
        page,
        itemsPerPage: Math.min(itemsPerPage, 100) // Máximo 100 por página
      };
      
      // La URL ahora incluye los parámetros, así el caché funcionará correctamente
      return await apiService.get('/restaurants', params);
    } catch (error) {
      throw new Error(error.message || 'Error al obtener restaurantes');
    }
  }

  // Obtener un restaurante por ID
  async getRestaurant(id) {
    try {
      return await apiService.get(`/restaurants/${id}`);
    } catch (error) {
      throw new Error(error.message || 'Error al obtener restaurante');
    }
  }

  // Crear un nuevo restaurante
  async createRestaurant(restaurantData) {
    try {
      const { name, address, phone } = restaurantData;
      
      if (!name || !address) {
        throw new Error('Nombre y dirección son requeridos');
      }
      
      const result = await apiService.post('/restaurants', {
        name: name.trim(),
        address: address.trim(),
        phone: phone?.trim() || ''
      });
      
      // Limpiar caché después de crear
      apiService.clearCache('/restaurants');
      
      return result;
    } catch (error) {
      throw new Error(error.message || 'Error al crear restaurante');
    }
  }

  // Actualizar un restaurante (PUT - actualización completa)
  async updateRestaurant(id, restaurantData) {
    try {
      const { name, address, phone } = restaurantData;
      
      if (!name || !address) {
        throw new Error('Nombre y dirección son requeridos');
      }
      
      const result = await apiService.put(`/restaurants/${id}`, {
        name: name.trim(),
        address: address.trim(),
        phone: phone?.trim() || ''
      });
      
      // Limpiar caché después de actualizar
      apiService.clearCache('/restaurants');
      
      return result;
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar restaurante');
    }
  }

  // Actualizar parcialmente un restaurante (PATCH)
  async patchRestaurant(id, changes) {
    try {
      const cleanChanges = {};
      
      if (changes.name !== undefined) {
        cleanChanges.name = changes.name.trim();
      }
      if (changes.address !== undefined) {
        cleanChanges.address = changes.address.trim();
      }
      if (changes.phone !== undefined) {
        cleanChanges.phone = changes.phone.trim();
      }
      
      const result = await apiService.patch(`/restaurants/${id}`, cleanChanges);
      
      // Limpiar caché después de actualizar
      apiService.clearCache('/restaurants');
      
      return result;
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar restaurante');
    }
  }

  // Eliminar un restaurante
  async deleteRestaurant(id) {
    try {
      const result = await apiService.delete(`/restaurants/${id}`);
      
      // Limpiar caché después de eliminar
      apiService.clearCache('/restaurants');
      
      return result;
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar restaurante');
    }
  }

  // Búsqueda avanzada de restaurantes
  async searchRestaurants(searchParams = {}) {
    try {
      const params = {};
      
      // Búsqueda general
      if (searchParams.search) {
        params.search = searchParams.search.trim();
      }
      
      // Filtros específicos
      if (searchParams.name) {
        params.name = searchParams.name.trim();
      }
      if (searchParams.address) {
        params.address = searchParams.address.trim();
      }
      if (searchParams.phone) {
        params.phone = searchParams.phone.trim();
      }
      
      // Filtros de fecha
      if (searchParams.created_from) {
        params.created_from = searchParams.created_from;
      }
      if (searchParams.created_to) {
        params.created_to = searchParams.created_to;
      }
      if (searchParams.updated_from) {
        params.updated_from = searchParams.updated_from;
      }
      if (searchParams.updated_to) {
        params.updated_to = searchParams.updated_to;
      }
      
      // Ordenamiento
      if (searchParams.order_by) {
        params.order_by = searchParams.order_by;
      }
      if (searchParams.order_direction) {
        params.order_direction = searchParams.order_direction;
      }
      
      // Paginación
      if (searchParams.page) {
        params.page = searchParams.page;
      }
      if (searchParams.limit) {
        params.limit = Math.min(searchParams.limit, 100);
      }
      
      return await apiService.get('/restaurants/search', params);
    } catch (error) {
      throw new Error(error.message || 'Error en la búsqueda');
    }
  }

  // Búsqueda rápida para autocompletado
  async quickSearch(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return { results: [], count: 0, query: '' };
      }
      
      const params = {
        q: query.trim(),
        limit: Math.min(limit, 50)
      };
      
      return await apiService.get('/restaurants/quick-search', params);
    } catch (error) {
      throw new Error(error.message || 'Error en búsqueda rápida');
    }
  }

  // Encontrar restaurantes similares
  async getSimilarRestaurants(id, limit = 5) {
    try {
      const params = {
        limit: Math.min(limit, 20)
      };
      
      return await apiService.get(`/restaurants/${id}/similar`, params);
    } catch (error) {
      throw new Error(error.message || 'Error al obtener restaurantes similares');
    }
  }

  // Utilidades para formatear datos
  formatRestaurant(restaurant) {
    if (!restaurant) return null;
    
    return {
      id: restaurant.id,
      name: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      createdAt: restaurant.createdAt || restaurant.created_at,
      updatedAt: restaurant.updatedAt || restaurant.updated_at,
    };
  }

  // Formatear respuesta de lista con paginación mejorada
  formatRestaurantList(response) {
    if (!response) return { restaurants: [], total: 0, pagination: null };
    
    // Formato API Platform (hydra) - El más confiable
    if (response['hydra:member']) {
      return {
        restaurants: response['hydra:member'].map(r => this.formatRestaurant(r)),
        total: response['hydra:totalItems'] || 0,
        pagination: {
          hasMore: response['hydra:view'] && response['hydra:view']['hydra:next'],
          currentPage: response['hydra:view'] ? this.extractPageFromUrl(response['hydra:view']['@id']) : 1,
          itemsInCurrentPage: response['hydra:member'].length
        }
      };
    }
    
    // Formato búsqueda personalizada  
    if (response.results) {
      return {
        restaurants: response.results.map(r => this.formatRestaurant(r)),
        total: response.pagination?.total || response.count || 0,
        pagination: response.pagination || null
      };
    }
    
    // Caso especial: Si viene con total separado (formato personalizado)
    if (response.data && response.total !== undefined) {
      return {
        restaurants: response.data.map(r => this.formatRestaurant(r)),
        total: response.total,
        pagination: response.pagination || null
      };
    }
    
    // Si viene como array directo pero con totalItems separado
    if (Array.isArray(response) && response.totalItems !== undefined) {
      return {
        restaurants: response.map(r => this.formatRestaurant(r)),
        total: response.totalItems,
        pagination: null
      };
    }
    
    // Formato directo (API devuelve array sin metadatos) - MEJORADO
    if (Array.isArray(response)) {
      const pageSize = 10; // itemsPerPage por defecto
      const currentPageItems = response.length;
      
      // Lógica mejorada: Si hay exactamente pageSize elementos, 
      // es probable que haya más páginas, pero solo lo confirmamos si hay datos
      const hasMorePages = currentPageItems === pageSize && currentPageItems > 0;
      
      return {
        restaurants: response.map(r => this.formatRestaurant(r)),
        total: currentPageItems, // Se actualizará con lógica inteligente en Dashboard
        pagination: {
          hasMore: hasMorePages,
          itemsInCurrentPage: currentPageItems,
          isDirectArray: true // Flag para identificar este formato
        }
      };
    }
    
    return {
      restaurants: [],
      total: 0,
      pagination: null
    };
  }

  // Extraer número de página de URL hydra
  extractPageFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return parseInt(urlObj.searchParams.get('page')) || 1;
    } catch {
      return 1;
    }
  }

  // Limpiar caché manualmente (útil para refresh manual)
  clearCache() {
    apiService.clearCache('/restaurants');
  }
}

export default new RestaurantService(); 