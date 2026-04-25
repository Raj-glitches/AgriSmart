import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api.js';

/**
 * AuthContext
 * Manages global authentication state across the application
 * Handles login, register, logout, and token persistence
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token with backend
          const response = await authAPI.getMe();
          setUser(response.data.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          logout();
        }
      } else if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { data } = response.data;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    setIsAuthenticated(true);

    return data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    return response.data;
  };

  const verifyOTP = async (email, otp) => {
    const response = await authAPI.verifyOTP({ email, otp });
    const { data } = response.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsAuthenticated(true);
    }

    return response.data;
  };

  const resendOTP = async (email) => {
    return await authAPI.resendOTP({ email });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    const response = await authAPI.updateProfile(profileData);
    const updatedUser = { ...user, ...response.data.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return response.data;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    updateProfile,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

