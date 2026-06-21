import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Adjust the path as per your project structure

/**
 * ProtectedRoutes component to guard routes based on authentication and role.
 * @param {object} props
 * @param {Array<string>} [props.allowedRoles] - Optional array of roles that are allowed to access the route.
 * If not provided, only authentication is checked.
 * @returns {React.ReactElement} The child components if authorized, or a Navigate component for redirection.
 */
const ProtectedRoutes = ({ allowedRoles }) => {
  const { user, role } = useAuth(); // Get user and role from the AuthContext

  // 1. Check if the user is authenticated
  if (!user) {
    // If no user is logged in, redirect them to the login page
    return <Navigate to="/" replace />;
  }

  // 2. Check for role-based access control if allowedRoles are specified
  if (allowedRoles && !allowedRoles.includes(role)) {
    // If roles are specified and the user's role is not in the allowed roles,
    // redirect them to an unauthorized page or a dashboard.
    // You might want to customize this redirection based on your app's flow.
    return <Navigate to="/" replace />;
  }

  // 3. If authenticated (and authorized by role), render the child routes
  // Outlet is used when this component is part of a layout route in react-router-dom v6+
  return <Outlet />;
};

export default ProtectedRoutes;