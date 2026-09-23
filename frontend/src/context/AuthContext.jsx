import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

const TOKEN_KEY = 'mitienda_token';
const USER_KEY = 'mitienda_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Si falta teléfono o dirección, refrescar con el perfil completo
        if (!parsed.telefono || !parsed.direccion) {
          api
            .get('/auth/profile')
            .then((res) => {
              if (res.data?.ok && res.data?.user) {
                const fullUser = {
                  ...parsed,
                  ...res.data.user,
                  rol: res.data.user.rol_nombre || parsed.rol,
                };
                setUser(fullUser);
                const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
                storage.setItem(USER_KEY, JSON.stringify(fullUser));
              }
            })
            .catch(() => {});
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setLoading(false);
  }, []);

  const persistData = useCallback((newToken, newUser, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    storage.setItem(TOKEN_KEY, newToken);
    storage.setItem(USER_KEY, JSON.stringify(newUser));
    otherStorage.removeItem(TOKEN_KEY);
    otherStorage.removeItem(USER_KEY);
  }, []);

  const login = async (email, password, rememberMe = true) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    persistData(newToken, newUser, rememberMe);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    persistData(newToken, newUser, true);
    return res.data;
  };

  const recoverPassword = async (email, newPassword) => {
    const res = await api.post('/auth/recover-password', { email, newPassword });
    return res.data;
  };

  const recoverSendCode = async (email) => {
    const res = await api.post('/auth/recover/send-code', { email });
    return res.data;
  };

  const recoverVerifyCode = async (email, codigo) => {
    const res = await api.post('/auth/recover/verify-code', { email, codigo });
    return res.data;
  };

  const recoverResetPassword = async (email, codigo, newPassword) => {
    const res = await api.post('/auth/recover/reset-password', { email, codigo, newPassword });
    return res.data;
  };

  const getProfile = async () => {
    if (!token) {
      return { ok: false, message: 'No autenticado' };
    }
    const res = await api.get('/auth/profile');
    if (res.data.ok && res.data.user) {
      const fullUser = {
        ...user,
        ...res.data.user,
        rol: res.data.user.rol_nombre || user?.rol,
      };
      setUser(fullUser);
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(fullUser));
    }
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.ok && res.data.user) {
      const updatedUser = {
        ...res.data.user,
        rol: res.data.user.rol_nombre || user?.rol,
      };
      setUser(updatedUser);
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      return roles.includes(user.rol || user.rol_nombre);
    },
    [user]
  );

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        recoverPassword,
        recoverSendCode,
        recoverVerifyCode,
        recoverResetPassword,
        getProfile,
        updateProfile,
        hasRole,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
