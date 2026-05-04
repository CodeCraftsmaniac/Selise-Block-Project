import { Navigate } from 'react-router-dom';
import { useAuthStore } from '.';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: Readonly<PublicRouteProps>) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
