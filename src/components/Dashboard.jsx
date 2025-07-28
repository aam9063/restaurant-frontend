import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import restaurantService from '../services/restaurants';
import { UtensilsCrossed, Plus, Pencil, Trash2, MapPin, Phone, User, LogOut } from 'lucide-react';
import { LoadingCard } from './LoadingSpinner';
import RestaurantModal from './restaurants/RestaurantModal';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { userName, userEmail, logout, isAuthenticated, isApiKeyConfigured, isLoading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Función para cargar restaurantes
  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      console.log('Dashboard: Iniciando carga de restaurantes...');
      
      const response = await restaurantService.getRestaurants(1, 20);
      console.log('Dashboard: Respuesta recibida:', response);
      
      const { restaurants: restaurantsList } = restaurantService.formatRestaurantList(response);
      console.log('Dashboard: Restaurantes formateados:', restaurantsList);
      
      setRestaurants(restaurantsList);
      toast.success(`${restaurantsList.length} restaurantes cargados`);
    } catch (error) {
      console.error('Dashboard: Error al cargar restaurantes:', error);
      
      if (error.message.includes('Rate limit excedido')) {
        setIsRateLimited(true);
        toast.error('Rate limit alcanzado (200 req/hora)', {
          duration: 6000,
          icon: '⏱️',
        });
      } else if (error.message.includes('No autorizado')) {
        toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
      } else {
        toast.error('Error al cargar los restaurantes: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar restaurantes solo cuando estemos completamente autenticados
  useEffect(() => {
    console.log('Dashboard: useEffect ejecutado', {
      authLoading,
      isAuthenticated,
      isApiKeyConfigured: isApiKeyConfigured()
    });
    
    // Solo cargar si no estamos en proceso de autenticación, estamos autenticados y tenemos API key
    if (!authLoading && isAuthenticated && isApiKeyConfigured()) {
      console.log('Dashboard: Condiciones cumplidas, cargando restaurantes...');
      loadRestaurants();
    } else {
      console.log('Dashboard: Esperando autenticación completa...', {
        authLoading,
        isAuthenticated,
        hasApiKey: isApiKeyConfigured()
      });
    }
  }, [authLoading, isAuthenticated]);

  // Si aún está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <LoadingCard message="Verificando autenticación..." />;
  }

  // Si no está autenticado o no hay API key, no mostrar nada (el ProtectedRoute debería redirigir)
  if (!isAuthenticated || !isApiKeyConfigured()) {
    return <LoadingCard message="Configurando autenticación..." />;
  }

  // Si está cargando los restaurantes, mostrar loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingCard message="Cargando restaurantes..." />
      </div>
    );
  }

  const handleCreate = () => {
    setEditingRestaurant(null);
    setIsModalOpen(true);
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleDelete = async (restaurant) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${restaurant.name}"?`)) {
      return;
    }

    try {
      await restaurantService.deleteRestaurant(restaurant.id);
      toast.success('Restaurante eliminado correctamente');
      loadRestaurants();
    } catch (error) {
      console.error('Error al eliminar restaurante:', error);
      toast.error('Error al eliminar el restaurante');
    }
  };

  const handleModalSuccess = async (restaurantData) => {
    try {
      if (editingRestaurant) {
        await restaurantService.updateRestaurant(editingRestaurant.id, restaurantData);
        toast.success('Restaurante actualizado correctamente');
      } else {
        await restaurantService.createRestaurant(restaurantData);
        toast.success('Restaurante creado correctamente');
      }
      
      setIsModalOpen(false);
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (error) {
      console.error('Error al guardar restaurante:', error);
      toast.error('Error al guardar el restaurante');
      throw error;
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header con información del usuario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ¡Bienvenido, {userName}! 👋
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <span>📧 {userEmail}</span>
                  <span className="text-green-600">● Conectado</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Header del Dashboard */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-secondary-800 mb-2">
              Gestión de Restaurantes
            </h2>
            <p className="text-secondary-600">
              Tienes {restaurants.length} restaurante{restaurants.length !== 1 ? 's' : ''} registrado{restaurants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Restaurante</span>
          </button>
        </div>

        {/* Mensaje de Rate Limit */}
        {isRateLimited && (
          <div className="card p-6 mb-6 border-l-4 border-orange-500 bg-orange-50">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="text-lg font-semibold text-orange-800">Rate Limit Alcanzado</h3>
                <p className="text-orange-700 mt-1">
                  Has usado las 200 requests por hora. Puedes esperar o usar una nueva API key.
                </p>
                <button 
                  onClick={() => setIsRateLimited(false)}
                  className="mt-3 text-sm text-orange-800 underline hover:no-underline"
                >
                  Cerrar este mensaje
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Restaurantes */}
        {restaurants.length === 0 ? (
          <div className="card p-8 text-center">
            <UtensilsCrossed className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-800 mb-2">
              No hay restaurantes registrados
            </h3>
            <p className="text-secondary-600 mb-6">
              ¡Comienza agregando tu primer restaurante!
            </p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Crear primer restaurante
            </button>
          </div>
        ) : (
          <div className="grid gap-4 mb-8">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="card p-6 hover:shadow-medium transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                      {restaurant.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-secondary-600">
                        <MapPin className="h-4 w-4" />
                        <span>{restaurant.address}</span>
                      </div>
                      {restaurant.phone && (
                        <div className="flex items-center space-x-2 text-secondary-600">
                          <Phone className="h-4 w-4" />
                          <span>{restaurant.phone}</span>
                        </div>
                      )}
                    </div>
                    {restaurant.createdAt && (
                      <p className="text-sm text-secondary-500 mt-2">
                        Creado: {new Date(restaurant.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="btn-outline flex items-center space-x-1 px-3 py-2"
                      title="Editar restaurante"
                    >
                      <Pencil className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant)}
                      className="btn-danger flex items-center space-x-1 px-3 py-2"
                      title="Eliminar restaurante"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para crear/editar */}
        <RestaurantModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          restaurant={editingRestaurant}
        />
      </div>
    </div>
  );
};

export default Dashboard; 