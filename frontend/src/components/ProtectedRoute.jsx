import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const getRoleRedirectPath = (role) => {
  switch (role) {
    case "Admin":
      return "/dashboard/admin";
    case "Principal":
      return "/dashboard/principal";
    case "HOD":
      return "/dashboard/hod";
    case "Faculty":
      return "/dashboard/faculty";
    case "Office Assistant":
      return "/dashboard/office";
    default:
      return "/login";
  }
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading Department DMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = getRoleRedirectPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
