import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => AuthService.getCurrentUser());
  const [token, setToken] = useState(() => AuthService.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify session on mount
    const checkSession = async () => {
      const storedToken = AuthService.getToken();
      if (storedToken) {
        try {
          const profile = await AuthService.getMe();
          setUser((prev) => ({ ...prev, ...profile }));
        } catch {
          // Token expired or invalid
          AuthService.logout();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (credentials) => {
    const data = await AuthService.login(credentials);
    setUser(data);
    setToken(data.token);
    return data;
  };

  const register = async (registrationData) => {
    const data = await AuthService.register(registrationData);
    setUser(data);
    setToken(data.token);
    return data;
  };

  const provisionAdmin = async (adminData, setupKey) => {
    const data = await AuthService.provisionAdmin(adminData, setupKey);
    setUser(data);
    setToken(data.token);
    return data;
  };

  const provisionOfficer = async (officerData, setupKey) => {
    const data = await AuthService.provisionOfficer(officerData, setupKey);
    if (data.token) {
      setUser(data);
      setToken(data.token);
    }
    return data;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setToken(null);
  };

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;
  const isAdmin = role === 'ROLE_ADMIN';
  const isOfficer = role === 'ROLE_OFFICER' || isAdmin;
  const isCitizen = role === 'ROLE_CITIZEN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isAdmin,
        isOfficer,
        isCitizen,
        loading,
        login,
        register,
        provisionAdmin,
        provisionOfficer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
