import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sakshya_jwt_token') || null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available personas for user switcher
  const fetchPersonas = async () => {
    try {
      const res = await api.get('/auth/users');
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch personas:', err);
    }
  };

  // Verify active JWT token on startup
  const verifyToken = async () => {
    if (!token) {
      setLoading(false);
      // Auto login as default Police Inspector for smooth initial load
      await loginAsUser('USR-POL-101');
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setError(null);
    } catch (err) {
      console.warn('JWT invalid or expired, falling back to default user login...');
      localStorage.removeItem('sakshya_jwt_token');
      setToken(null);
      await loginAsUser('USR-POL-101');
    } finally {
      setLoading(false);
    }
  };

  // Authenticate as a specific persona & obtain real JWT from server
  const loginAsUser = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { userId });
      const { token: jwtToken, user: userObj } = res.data;

      localStorage.setItem('sakshya_jwt_token', jwtToken);
      setToken(jwtToken);
      setUser(userObj);
      return userObj;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sakshya_jwt_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    fetchPersonas();
    verifyToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        allUsers,
        loading,
        error,
        loginAsUser,
        logout,
        refreshPersonas: fetchPersonas
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
