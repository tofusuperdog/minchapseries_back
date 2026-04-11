'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from sessionStorage on mount
    const stored = sessionStorage.getItem('cms_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('cms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('cms_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('cms_user');
  };

  // Permission check helper
  const hasPermission = (path) => {
    if (!user) return false;
    // Dashboard is always accessible
    if (path === '/dashboard') return true;

    const permMap = {
      '/series': 'perm_series',
      '/genres': 'perm_genres',
      '/displays': 'perm_displays',
      '/sales': 'perm_sales',
      '/customers': 'perm_customers',
      '/users': 'perm_users',
    };

    const permKey = permMap[path];
    if (!permKey) return true; // Unknown path, allow
    return !!user[permKey];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
