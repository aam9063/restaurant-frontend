import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${sizeClasses[size]} ${className}`}></div>
  );
};

export const LoadingPage = ({ message = 'Cargando...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-secondary-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

export const LoadingCard = ({ message = 'Cargando...' }) => {
  return (
    <div className="card p-8">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-secondary-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 