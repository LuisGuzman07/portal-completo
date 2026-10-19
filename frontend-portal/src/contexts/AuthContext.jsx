import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('aboccrim_token'));
  const [loading, setLoading] = useState(true);

  // Initialize from stored profile or token
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('aboccrim_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (err) {
        console.error('Error cargando perfil:', err);
        localStorage.removeItem('aboccrim_token');
        localStorage.removeItem('aboccrim_refresh');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    loadUser();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const accessToken = data.tokens.access;
    const refreshToken = data.tokens.refresh;

    localStorage.setItem('aboccrim_token', accessToken);
    localStorage.setItem('aboccrim_refresh', refreshToken);
    setToken(accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    const accessToken = data.tokens.access;
    const refreshToken = data.tokens.refresh;

    localStorage.setItem('aboccrim_token', accessToken);
    localStorage.setItem('aboccrim_refresh', refreshToken);
    setToken(accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('aboccrim_refresh');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Error durante logout backend:', err);
    } finally {
      localStorage.removeItem('aboccrim_token');
      localStorage.removeItem('aboccrim_refresh');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (roleCode) => {
    if (!user || !user.roles_codigos) return false;
    return user.roles_codigos.includes(roleCode);
  };

  const hasPermission = (permCode) => {
    if (!user) return false;
    if (user.is_superuser || hasRole('superadmin')) return true;
    if (!user.permisos_efectivos) return false;
    return user.permisos_efectivos.includes(permCode);
  };

  const isSuperAdmin = user?.is_superuser || hasRole('superadmin');
  const isAdminAcademico = hasRole('admin_academico');

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    isSuperAdmin,
    isAdminAcademico,
    refreshUser: async () => {
      try {
        const p = await authService.getProfile();
        setUser(p);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
