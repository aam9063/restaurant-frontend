import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { useAuth } from './hooks/useAuth';
import { LoadingPage } from './components/LoadingSpinner';
// import Header from './components/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message="Verificando autenticación..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para rutas de autenticación (ocultar si ya está logueado)
const AuthRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message="Verificando autenticación..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Página de inicio
const HomePage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-display font-bold text-secondary-800 mb-6">
            Gestión de Restaurantes
          </h1>
          <p className="text-xl text-secondary-600 mb-8">
            Gestiona tu red de restaurantes de forma simple y eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="btn-primary text-lg px-8 py-3"
            >
              Iniciar Sesión
            </a>
            <a 
              href="/register" 
              className="btn-outline text-lg px-8 py-3"
            >
              Crear Cuenta
            </a>
          </div>
        </div>

        {/* Características */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-lg font-display font-semibold text-secondary-800 mb-2">
              Crear Restaurantes
            </h3>
            <p className="text-secondary-600">
              Agrega nuevos restaurantes con información detallada.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-lg font-display font-semibold text-secondary-800 mb-2">
              Editar y Actualizar
            </h3>
            <p className="text-secondary-600">
              Modifica la información de tus restaurantes fácilmente.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-display font-semibold text-secondary-800 mb-2">
              Eliminar
            </h3>
            <p className="text-secondary-600">
              Elimina restaurantes que ya no necesites gestionar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout principal sin Header
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route 
              path="/" 
              element={
                <Layout>
                  <HomePage />
                </Layout>
              } 
            />
            
            {/* Rutas de autenticación */}
            <Route 
              path="/login" 
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <AuthRoute>
                  <Register />
                </AuthRoute>
              } 
            />

            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toaster para notificaciones */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 25px 0 rgba(0, 0, 0, 0.12)',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
