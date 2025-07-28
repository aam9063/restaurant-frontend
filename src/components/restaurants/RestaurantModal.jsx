import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const RestaurantModal = ({ isOpen, onClose, onSuccess, restaurant = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!restaurant;

  // Cargar datos del restaurante cuando se abre el modal para editar
  useEffect(() => {
    if (isOpen) {
      if (restaurant) {
        setFormData({
          name: restaurant.name || '',
          address: restaurant.address || '',
          phone: restaurant.phone || ''
        });
      } else {
        setFormData({
          name: '',
          address: '',
          phone: ''
        });
      }
      setErrors({});
      setIsValid({});
    }
  }, [isOpen, restaurant]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newIsValid = { ...isValid };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre es requerido';
          newIsValid.name = false;
        } else if (value.trim().length < 2) {
          newErrors.name = 'El nombre debe tener al menos 2 caracteres';
          newIsValid.name = false;
        } else if (value.trim().length > 100) {
          newErrors.name = 'El nombre no puede tener más de 100 caracteres';
          newIsValid.name = false;
        } else {
          delete newErrors.name;
          newIsValid.name = true;
        }
        break;

      case 'address':
        if (!value.trim()) {
          newErrors.address = 'La dirección es requerida';
          newIsValid.address = false;
        } else if (value.trim().length < 5) {
          newErrors.address = 'La dirección debe tener al menos 5 caracteres';
          newIsValid.address = false;
        } else if (value.trim().length > 200) {
          newErrors.address = 'La dirección no puede tener más de 200 caracteres';
          newIsValid.address = false;
        } else {
          delete newErrors.address;
          newIsValid.address = true;
        }
        break;

      case 'phone':
        if (value.trim()) {
          // Validar formato de teléfono (opcional)
          const phoneRegex = /^[\d\s\-()]+$/;
          if (!phoneRegex.test(value.trim())) {
            newErrors.phone = 'Formato de teléfono inválido';
            newIsValid.phone = false;
          } else {
            delete newErrors.phone;
            newIsValid.phone = true;
          }
        } else {
          // El teléfono es opcional
          delete newErrors.phone;
          newIsValid.phone = true;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setIsValid(newIsValid);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos
    validateField('name', formData.name);
    validateField('address', formData.address);
    validateField('phone', formData.phone);

    // Verificar si hay errores
    if (Object.keys(errors).length > 0 || !isValid.name || !isValid.address) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSuccess({
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim()
      });
      // El componente padre manejará el cierre del modal
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const isFormValid = isValid.name && isValid.address && isValid.phone !== false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-display font-semibold text-secondary-800">
            {isEditing ? 'Editar Restaurante' : 'Nuevo Restaurante'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-secondary-600" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campo nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
              Nombre del restaurante *
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Pizzería Napolitana"
                className={`input pr-10 ${
                  errors.name ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' :
                  isValid.name ? 'border-success-300 focus:border-success-500 focus:ring-success-500' : ''
                }`}
                disabled={isSubmitting}
              />
              {isValid.name && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                </div>
              )}
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-danger-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Campo dirección */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-secondary-700 mb-2">
              Dirección *
            </label>
            <div className="relative">
              <textarea
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Calle Roma 145, Centro Histórico"
                rows={2}
                className={`input pr-10 resize-none ${
                  errors.address ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' :
                  isValid.address ? 'border-success-300 focus:border-success-500 focus:ring-success-500' : ''
                }`}
                disabled={isSubmitting}
              />
              {isValid.address && (
                <div className="absolute top-2 right-0 pr-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                </div>
              )}
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-danger-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>

          {/* Campo teléfono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
              Teléfono <span className="text-secondary-500">(opcional)</span>
            </label>
            <div className="relative">
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: +34 123 456 789"
                className={`input pr-10 ${
                  errors.phone ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' :
                  isValid.phone && formData.phone ? 'border-success-300 focus:border-success-500 focus:ring-success-500' : ''
                }`}
                disabled={isSubmitting}
              />
              {isValid.phone && formData.phone && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                </div>
              )}
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-danger-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.phone}</span>
              </p>
            )}
            <p className="mt-1 text-xs text-secondary-500">
              Formato: números, espacios, guiones, paréntesis (+, -, espacio)
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Actualizar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantModal; 