import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, ArrowRight, UtensilsCrossed, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redireccionar después del login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!email.includes('@')) {
      setError('Ingresa un email válido');
      return;
    }

    try {
      console.log('Iniciando login con email:', email.trim());
      const result = await login(email.trim());
      console.log('Login exitoso, resultado:', result);
      console.log('Redirigiendo a:', from);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <UtensilsCrossed className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-secondary-800">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Accede a tu cuenta para gestionar restaurantes
          </p>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-danger-600 flex-shrink-0" />
                <span className="text-sm text-danger-700">{error}</span>
              </div>
            )}

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
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="input pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          
          </form>

          {/* Enlaces */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 