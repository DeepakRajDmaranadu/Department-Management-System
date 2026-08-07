import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/services/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const [adminActiveCollege, setAdminActiveCollegeState] = useState(() => localStorage.getItem("adminActiveCollege") || "");
  const [adminActiveCourse, setAdminActiveCourseState] = useState(() => localStorage.getItem("adminActiveCourse") || "");

  const setAdminActiveCollege = (college) => {
    setAdminActiveCollegeState(college);
    if (college) {
      localStorage.setItem("adminActiveCollege", college);
    } else {
      localStorage.removeItem("adminActiveCollege");
    }
  };

  const setAdminActiveCourse = (course) => {
    setAdminActiveCourseState(course);
    if (course) {
      localStorage.setItem("adminActiveCourse", course);
    } else {
      localStorage.removeItem("adminActiveCourse");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

      if (!storedToken || !storedUser) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      try {
        const response = await api.get("/api/auth/profile");
        if (response.data.success && response.data.user) {
          const freshUser = response.data.user;
          setUser(freshUser);
          if (localStorage.getItem("token")) {
            localStorage.setItem("user", JSON.stringify(freshUser));
          } else {
            sessionStorage.setItem("user", JSON.stringify(freshUser));
          }
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (user && user.role === "Principal") {
      setAdminActiveCollege(user.college || "");
    }
    if (user && user.role === "Office Assistant") {
      const assignedCols = user.assignedColleges || (user.college ? user.college.split(", ") : []);
      if (assignedCols.length > 0 && (!adminActiveCollege || !assignedCols.includes(adminActiveCollege))) {
        setAdminActiveCollege(assignedCols[0]);
      }
      const assignedDepts = user.assignedDepartments || (user.department ? user.department.split(", ") : []);
      if (assignedDepts.length > 0 && (!adminActiveCourse || !assignedDepts.includes(adminActiveCourse))) {
        setAdminActiveCourse(assignedDepts[0]);
      }
    }
  }, [user]);

  const login = async (employeeId, password, rememberMe) => {
    try {
      const response = await api.post("/api/auth/login", { employeeId, password });
      const { token: receivedToken, user: loggedUser } = response.data;
      
      setUser(loggedUser);
      setToken(receivedToken);

      if (rememberMe) {
        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(loggedUser));
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("token", receivedToken);
        sessionStorage.setItem("user", JSON.stringify(loggedUser));
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
      setAdminActiveCollegeState("");
      setAdminActiveCourseState("");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("adminActiveCollege");
      localStorage.removeItem("adminActiveCourse");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
  };

  const updateUser = (updatedUser) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      if (localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(newUser));
      } else {
        sessionStorage.setItem("user", JSON.stringify(newUser));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        adminActiveCollege,
        adminActiveCourse,
        setAdminActiveCollege,
        setAdminActiveCourse,
      }}
    >
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
