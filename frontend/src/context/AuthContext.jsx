import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/services/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      try {
        const response = await api.get("/api/auth/profile");
        if (response.data.success && response.data.user) {
          const freshUser = response.data.user;
          setUser(freshUser);
          if (storedToken) {
            localStorage.setItem("user", JSON.stringify(freshUser));
          }
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (employeeId, password, rememberMe) => {
    try {
      const response = await api.post("/api/auth/login", { employeeId, password });
      const { token: receivedToken, user: loggedUser } = response.data;
      
      setUser(loggedUser);
      setToken(receivedToken);

      if (rememberMe) {
        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(loggedUser));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      return loggedUser;
    } catch (error) {
      throw error.response?.data?.message || "An error occurred during login. Please try again.";
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Backend logout error", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const updateUser = (updatedUser) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      if (localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(newUser));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
