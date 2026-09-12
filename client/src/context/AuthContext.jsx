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
    const existingToken = localStorage.getItem('sakshya_jwt_token');
    if (!existingToken) {
      try {
        await loginAsUser('USR-POL-101');
      } catch (err) {
        console.error('Auto-login failed on startup:', err);
      } finally {
        setLoading(false);
      }
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
      try {
        await loginAsUser('USR-POL-101');
      } catch (fallbackErr) {
        console.error('Fallback auto-login failed:', fallbackErr);
      }
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
      {loading ? (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center font-sans space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <span className="font-extrabold text-lg">S</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xl tracking-tight font-mono">SākshyaChain</span>
              <div className="text-[10px] text-slate-500 font-mono">Digital Legal Evidence Vault</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-600 font-mono">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Verifying Security Context...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
