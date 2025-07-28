import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import restaurantService from '../../services/restaurants';
import { Plus, Search, Edit, Trash2, MapPin, Phone, Calendar, MoreVertical } from 'lucide-react';
import { LoadingCard } from '../LoadingSpinner';
import toast from 'react-hot-toast';
import RestaurantModal from './RestaurantModal';

const RestaurantList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowModal(true);
      setEditingRestaurant(null);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    loadRestaurants();
  }, [currentPage, searchQuery]);

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      
      let response;
      if (searchQuery.trim()) {
        response = await restaurantService.searchRestaurants({
          search: searchQuery,
          page: currentPage,
          limit: itemsPerPage
        });
      } else {
        response = await restaurantService.getRestaurants(currentPage, itemsPerPage);
      }

      const { restaurants: restaurantList, pagination: paginationData } = 
        restaurantService.formatRestaurantList(response);
      
      setRestaurants(restaurantList);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error al cargar restaurantes:', error);
      toast.error('Error al cargar los restaurantes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadRestaurants();
  };

  const handleCreate = () => {
    setEditingRestaurant(null);
    setShowModal(true);
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar este restaurante?')) {
      return;
    }

    try {
      setDeletingId(id);
      await restaurantService.deleteRestaurant(id);
      toast.success('Restaurante eliminado exitosamente');
      loadRestaurants();
    } catch (error) {
      console.error('Error al eliminar restaurante:', error);
      toast.error(error.message || 'Error al eliminar el restaurante');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSave = async (restaurantData) => {
    try {
      if (editingRestaurant) {
        await restaurantService.updateRestaurant(editingRestaurant.id, restaurantData);
        toast.success('Restaurante actualizado exitosamente');
      } else {
        await restaurantService.createRestaurant(restaurantData);
        toast.success('Restaurante creado exitosamente');
      }
      setShowModal(false);
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (error) {
      console.error('Error al guardar restaurante:', error);
      toast.error(error.message || 'Error al guardar el restaurante');
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-secondary-800 mb-2">
            Restaurantes
          </h1>
          <p className="text-secondary-600">
            Gestiona tu red de restaurantes
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Restaurante</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar restaurantes por nombre, dirección o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Buscar
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
                loadRestaurants();
              }}
              className="btn-outline"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Lista de restaurantes */}
      {isLoading ? (
        <LoadingCard message="Cargando restaurantes..." />
      ) : restaurants.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-2">
            {searchQuery ? 'No se encontraron restaurantes' : 'No hay restaurantes'}
          </h3>
          <p className="text-secondary-600 mb-6">
            {searchQuery
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer restaurante'
            }
          </p>
          {!searchQuery && (
            <button onClick={handleCreate} className="btn-primary">
              Crear primer restaurante
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {restaurants.map((restaurant) => (
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
                        <Calendar className="h-3 w-3" />
                        <span>Creado: {formatDate(restaurant.createdAt)}</span>
                      </div>
                      {restaurant.updatedAt !== restaurant.createdAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Actualizado: {formatDate(restaurant.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id)}
                      disabled={deletingId === restaurant.id}
                      className="p-2 text-secondary-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination?.total || 0)} de {pagination?.total || 0} restaurantes
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
      )}

      {/* Modal */}
      <RestaurantModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRestaurant(null);
        }}
        onSave={handleModalSave}
        restaurant={editingRestaurant}
      />
    </div>
  );
};

export default RestaurantList; 