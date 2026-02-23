import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Higher-order component to protect a component by requiring authentication
const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const ComponentWithAuth: React.FC<P> = (props: P) => {
    const auth = useAuth();
    if (!auth.isAuthenticated) {
      return <Redirect to={{ pathname: '/login' }} />;
    }
    return <WrappedComponent {...props} />;
  };

  // For easier debugging in React DevTools
  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithAuth;
};

export default withAuth;
