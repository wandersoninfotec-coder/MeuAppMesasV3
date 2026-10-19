// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { sessionService } from '../services/sessionService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);

  // 🔄 Ao iniciar o app, tenta restaurar a sessão
  useEffect(() => {
    restaurarSessao();
  }, []);

  const restaurarSessao = async () => {
    try {
      const sessao = await sessionService.carregarSessao();

      if (sessao) {
        setUser(sessao.user);
        setToken(sessao.token);
        setExpiresAt(sessao.expiresAt);
        console.log('🟢 Sessão restaurada:', sessao.user.nome);
      } else {
        console.log('🔵 Sem sessão ativa');
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken, userData) => {
    // Salva no storage com expiração
    await sessionService.salvarSessao(authToken, userData);

    // Atualiza o estado
    setToken(authToken);
    setUser(userData);
    setExpiresAt(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  const logout = async () => {
    await sessionService.limparSessao();
    setToken(null);
    setUser(null);
    setExpiresAt(null);
  };

  const updateUser = async (userData) => {
    setUser(userData);
    // Re-salva a sessão com o mesmo token, só atualizando o user
    if (token) {
      await sessionService.salvarSessao(token, userData);
    }
  };

  // Renova a sessão (chame em ações importantes)
  const renovarSessao = async () => {
    const renovada = await sessionService.renovarSessao();
    if (renovada) {
      setExpiresAt(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    return renovada;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        expiresAt,
        login,
        logout,
        updateUser,
        renovarSessao,
        isAuthenticated: !!token && !!user,
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