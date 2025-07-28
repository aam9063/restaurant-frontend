import React, { useState, useEffect } from 'react';
import restaurantService from '../../services/restaurants';
import { Search, Filter, Calendar, ArrowUpDown, X, MapPin, Phone, Clock } from 'lucide-react';
import { LoadingCard } from '../LoadingSpinner';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useState({
    search: '',
    name: '',
    address: '',
    phone: '',
    created_from: '',
    created_to: '',
    updated_from: '',
    updated_to: '',
    order_by: 'created_at',
    order_direction: 'DESC'
  });
  
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickResults, setQuickResults] = useState([]);

  const itemsPerPage = 12;

  useEffect(() => {
    // Realizar búsqueda automática si hay parámetros
    if (hasActiveFilters()) {
      performSearch();
    }
  }, [currentPage]);

  const hasActiveFilters = () => {
    return Object.values(searchParams).some(value => value !== '' && value !== 'created_at' && value !== 'DESC');
  };

  const performSearch = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        ...searchParams,
        page: currentPage,
        limit: itemsPerPage
      };

      // Limpiar parámetros vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await restaurantService.searchRestaurants(params);
      const { restaurants, pagination: paginationData } = 
        restaurantService.formatRestaurantList(response);
      
      setResults(restaurants);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error('Error al realizar la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch();
  };

  const handleQuickSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setQuickResults([]);
      return;
    }

    try {
      const response = await restaurantService.quickSearch(query, 8);
      setQuickResults(response.results || []);
    } catch (error) {
      console.error('Error en búsqueda rápida:', error);
      setQuickResults([]);
    }
  };

  const clearAllFilters = () => {
    setSearchParams({
      search: '',
      name: '',
      address: '',
      phone: '',
      created_from: '',
      created_to: '',
      updated_from: '',
      updated_to: '',
      order_by: 'created_at',
      order_direction: 'DESC'
    });
    setResults([]);
    setPagination(null);
    setCurrentPage(1);
  };

  const handleParamChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const totalPages = pagination?.pages || Math.ceil((pagination?.total || 0) / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-secondary-800 mb-2">
          Búsqueda Avanzada
        </h1>
        <p className="text-secondary-600">
          Encuentra restaurantes con filtros específicos
        </p>
      </div>

      {/* Búsqueda rápida */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">
          🚀 Búsqueda Rápida
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Búsqueda rápida (autocompletado)..."
            value={quickSearchQuery}
            onChange={(e) => {
              setQuickSearchQuery(e.target.value);
              handleQuickSearch(e.target.value);
            }}
            className="input pl-10"
          />
        </div>
        
        {/* Resultados de búsqueda rápida */}
        {quickResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-secondary-600 mb-2">
              Resultados rápidos ({quickResults.length}):
            </p>
            {quickResults.map((restaurant) => (
              <div
                key={restaurant.id}
                className="p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  setSearchParams(prev => ({ ...prev, search: restaurant.name }));
                  setQuickSearchQuery('');
                  setQuickResults([]);
                }}
              >
                <h4 className="font-medium text-secondary-800">{restaurant.name}</h4>
                <p className="text-sm text-secondary-600">{restaurant.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario de búsqueda avanzada */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-800">
            🔍 Búsqueda Avanzada
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Búsqueda general */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Búsqueda General
            </label>
            <input
              type="text"
              placeholder="Buscar en nombre, dirección y teléfono..."
              value={searchParams.search}
              onChange={(e) => handleParamChange('search', e.target.value)}
              className="input"
            />
          </div>

          {/* Filtros específicos */}
          {showFilters && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Nombre específico
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={searchParams.name}
                  onChange={(e) => handleParamChange('name', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Dirección específica
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por dirección..."
                  value={searchParams.address}
                  onChange={(e) => handleParamChange('address', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Teléfono específico
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por teléfono..."
                  value={searchParams.phone}
                  onChange={(e) => handleParamChange('phone', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Ordenar por
                </label>
                <div className="flex space-x-2">
                  <select
                    value={searchParams.order_by}
                    onChange={(e) => handleParamChange('order_by', e.target.value)}
                    className="input flex-1"
                  >
                    <option value="created_at">Fecha de creación</option>
                    <option value="updated_at">Fecha de actualización</option>
                    <option value="name">Nombre</option>
                    <option value="address">Dirección</option>
                  </select>
                  <select
                    value={searchParams.order_direction}
                    onChange={(e) => handleParamChange('order_direction', e.target.value)}
                    className="input"
                  >
                    <option value="DESC">Descendente</option>
                    <option value="ASC">Ascendente</option>
                  </select>
                </div>
              </div>

              {/* Filtros de fecha */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-secondary-700 mb-3">
                  📅 Filtros de Fecha
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">
                      Creado desde
                    </label>
                    <input
                      type="date"
                      value={searchParams.created_from}
                      onChange={(e) => handleParamChange('created_from', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">
                      Creado hasta
                    </label>
                    <input
                      type="date"
                      value={searchParams.created_to}
                      onChange={(e) => handleParamChange('created_to', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">
                      Actualizado desde
                    </label>
                    <input
                      type="date"
                      value={searchParams.updated_from}
                      onChange={(e) => handleParamChange('updated_from', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">
                      Actualizado hasta
                    </label>
                    <input
                      type="date"
                      value={searchParams.updated_to}
                      onChange={(e) => handleParamChange('updated_to', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </button>
            {hasActiveFilters() && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn-outline flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Resultados */}
      {isLoading ? (
        <LoadingCard message="Buscando restaurantes..." />
      ) : results.length === 0 && hasActiveFilters() ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-secondary-600 mb-6">
            Intenta ajustar los filtros de búsqueda
          </p>
          <button onClick={clearAllFilters} className="btn-outline">
            Limpiar filtros
          </button>
        </div>
      ) : results.length > 0 ? (
        <>
          {/* Información de resultados */}
          <div className="mb-4">
            <p className="text-sm text-secondary-600">
              Se encontraron <strong>{pagination?.total || 0}</strong> restaurantes
            </p>
          </div>

          {/* Lista de resultados */}
          <div className="grid gap-4 mb-6">
            {results.map((restaurant) => (
              <div key={restaurant.id} className="card p-6 hover:shadow-medium transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                      {restaurant.name}
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center space-x-2 text-secondary-600">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{restaurant.address}</span>
                      </div>
                      
                      {restaurant.phone && (
                        <div className="flex items-center space-x-2 text-secondary-600">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{restaurant.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-secondary-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Creado: {formatDate(restaurant.createdAt)}</span>
                      </div>
                      {restaurant.updatedAt !== restaurant.createdAt && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Actualizado: {formatDate(restaurant.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination?.total || 0)} de {pagination?.total || 0} resultados
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="text-sm text-secondary-600">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-accent-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-2">
            🔍 Busca restaurantes
          </h3>
          <p className="text-secondary-600">
            Usa los filtros de arriba para encontrar restaurantes específicos
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage; 