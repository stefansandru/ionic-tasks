import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface AuthContextProps {
  token?: string | null;
  username?: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  token: null,
  username: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = useCallback(async (u: string, p: string) => {
    // teacher server exposes auth under /api/auth/login
    const res = await axios.post('http://localhost:3000/api/auth/login', { username: u, password: p });
    const t = res.data && res.data.token;
    setToken(t);
    setUsername(u);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, u);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value = {
    token,
    username,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
