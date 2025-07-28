import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, User, ArrowRight, UtensilsCrossed, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState({});
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newIsValid = { ...isValid };

    switch (name) {
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'El email es requerido';
          newIsValid.email = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Ingresa un email válido';
          newIsValid.email = false;
        } else {
          delete newErrors.email;
          newIsValid.email = true;
        }
        break;

      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre es requerido';
          newIsValid.name = false;
        } else if (value.trim().length < 2) {
          newErrors.name = 'El nombre debe tener al menos 2 caracteres';
          newIsValid.name = false;
        } else {
          delete newErrors.name;
          newIsValid.name = true;
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
    validateField('email', formData.email);
    validateField('name', formData.name);

    // Verificar si hay errores
    if (Object.keys(errors).length > 0 || !isValid.email || !isValid.name) {
      return;
    }

    try {
      const userData = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        roles: ['ROLE_USER']
      };
      
      console.log('Enviando datos de registro:', userData);
      await register(userData);
      navigate('/dashboard');
    } catch (error) {
      // Los errores se manejan en el context
      console.error('Error en registro:', error);
    }
  };

  const isFormValid = isValid.email && isValid.name && Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <UtensilsCrossed className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-secondary-800">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Únete para gestionar restaurantes
          </p>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-secondary-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className={`input pl-10 pr-10 ${
                    errors.name ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' :
                    isValid.name ? 'border-success-300 focus:border-success-500 focus:ring-success-500' : ''
                  }`}
                  disabled={isLoading}
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

            {/* Campo email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-secondary-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan@ejemplo.com"
                  className={`input pl-10 pr-10 ${
                    errors.email ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' :
                    isValid.email ? 'border-success-300 focus:border-success-500 focus:ring-success-500' : ''
                  }`}
                  disabled={isLoading}
                />
                {isValid.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-success-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Enlaces */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 