import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { setupAutoRefresh } from '../utils';

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    streak: user.streak || 0,
    score: user.score || 0,
    created_at: user.created_at || null,
    teacher_id: user.teacher_id || null,
    zoom_link: user.zoom_link || null,
    weak_areas: user.weak_areas || [],
    listening_band: user.listening_band ?? null,
    reading_band: user.reading_band ?? null,
    writing_band: user.writing_band ?? null,
    speaking_band: user.speaking_band ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) { setLoading(false); return; }
    authAPI.getProfile()
      .then((res) => {
        const normalized = normalizeUser(res);
        if (normalized) setUser(normalized);
        else {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('refresh_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setupAutoRefresh(), []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password);
    if (!res || !res.token) throw new Error('Invalid response from server');
    localStorage.setItem('jwt_token', res.token);
    if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token);
    const usr = res.user;
    const u = normalizeUser(usr);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
