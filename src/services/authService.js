import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

export const authService = {
  /**
   * Faz login na API
   * @param {string} usuario - Nome do usuário (ex: "SUPORTE")
   * @param {string} senha - Senha em texto puro
   * @param {number} empresa - Código da empresa (padrão 1)
   */
  login: async (usuario, senha, empresa = 1) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.login, {
        usuario,
        senha,
        empresa
      });

      const { sucesso, token, usuario: userData } = response.data;

      if (sucesso && token) {
        // Salva no storage
        await AsyncStorage.setItem('@app:token', token);
        await AsyncStorage.setItem('@app:user', JSON.stringify(userData));
        
        return {
          success: true,
          token,
          user: userData
        };
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };

    } catch (error) {
      console.error('Erro no login:', error);
      
      // Extrai a mensagem de erro
      let mensagem = 'Erro ao fazer login';
      
      if (error.response?.data?.erro) {
        mensagem = error.response.data.erro;
      } else if (error.message) {
        mensagem = error.message;
      }

      return {
        success: false,
        error: mensagem
      };
    }
  },

  /**
   * Faz logout
   */
  logout: async () => {
    await AsyncStorage.removeItem('@app:token');
    await AsyncStorage.removeItem('@app:user');
  },

  /**
   * Retorna o usuário atual do storage
   */
  getCurrentUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('@app:user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  },

  /**
   * Retorna o token atual
   */
  getToken: async () => {
    return await AsyncStorage.getItem('@app:token');
  },

  /**
   * Verifica se está autenticado
   */
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('@app:token');
    return !!token;
  }
};