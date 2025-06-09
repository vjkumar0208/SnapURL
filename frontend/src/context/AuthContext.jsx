import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Add request interceptor to handle HTTPS
axios.interceptors.request.use((config) => {
  // If it's a production URL (not localhost), ensure it uses HTTPS
  if (config.url && !config.url.includes('localhost') && config.url.startsWith('http://')) {
    config.url = config.url.replace('http://', 'https://');
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await axios.post(`${API_URL}/api/users/login`, {
      email,
      password
    });

    const userData = response.data.user;
    setUser(userData);

    // Store user data based on remember me preference
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.removeItem('user'); // Clear session storage if using local storage
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('user'); // Clear local storage if using session storage
    }

    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  const updateUser = (userData) => {
    setUser(userData);
    // Update stored user data in both storages
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/signup`, userData);
      const newUser = response.data.user;
      setUser(newUser);
      // Store in session storage by default for new signups
      sessionStorage.setItem('user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const updateProfile = async (name, profilePhoto) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/${user._id}`, {
        name,
        profilePhoto
      });
      const updatedUser = response.data.user;
      updateUser(updatedUser); // Use the updateUser function to handle storage
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/${user._id}/password`, {
        currentPassword,
        newPassword
      });
      return true;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    updatePassword,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 