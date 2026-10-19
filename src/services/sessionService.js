// src/services/sessionService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves do AsyncStorage
const KEYS = {
  TOKEN: '@app:token',
  USER: '@app:user',
  EXPIRES_AT: '@app:expiresAt',
};

// Duração da sessão: 7 dias (em milissegundos)
const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionService = {
  /**
   * Salva uma nova sessão
   */
  salvarSessao: async (token, user) => {
    try {
      const expiresAt = Date.now() + DURACAO_SESSAO_MS;

      await AsyncStorage.multiSet([
        [KEYS.TOKEN, token],
        [KEYS.USER, JSON.stringify(user)],
        [KEYS.EXPIRES_AT, String(expiresAt)],
      ]);

      console.log(
        `✅ Sessão salva. Expira em: ${new Date(expiresAt).toLocaleString()}`
      );
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      return false;
    }
  },

  /**
   * Carrega a sessão (se ainda for válida)
   */
  carregarSessao: async () => {
    try {
      const valores = await AsyncStorage.multiGet([
        KEYS.TOKEN,
        KEYS.USER,
        KEYS.EXPIRES_AT,
      ]);

      const token = valores[0][1];
      const userJson = valores[1][1];
      const expiresAtStr = valores[2][1];

      // Não tem sessão salva
      if (!token || !userJson || !expiresAtStr) {
        return null;
      }

      const expiresAt = parseInt(expiresAtStr);
      const agora = Date.now();

      // Sessão expirada
      if (agora > expiresAt) {
        console.log('⚠️ Sessão expirada. Limpando...');
        await sessionService.limparSessao();
        return null;
      }

      // Calcula quanto tempo falta
      const faltaMs = expiresAt - agora;
      const faltaHoras = Math.round(faltaMs / 1000 / 60 / 60);
      console.log(`✅ Sessão válida. Expira em ~${faltaHoras}h`);

      return {
        token,
        user: JSON.parse(userJson),
        expiresAt,
        faltaMs,
      };
    } catch (error) {
      console.error('❌ Erro ao carregar sessão:', error);
      return null;
    }
  },

  /**
   * Renova a sessão (estende por mais 7 dias)
   * Chame isso quando o usuário fizer uma ação importante
   */
  renovarSessao: async () => {
    try {
      const sessao = await sessionService.carregarSessao();
      if (!sessao) return false;

      const novaExpiracao = Date.now() + DURACAO_SESSAO_MS;
      await AsyncStorage.setItem(KEYS.EXPIRES_AT, String(novaExpiracao));

      // Log reduzido (só em dev)
      if (__DEV__) {
        console.log('🔄 Sessão renovada');
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Limpa a sessão (logout)
   */
  limparSessao: async () => {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.EXPIRES_AT]);
      console.log('🗑️ Sessão limpa');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar sessão:', error);
      return false;
    }
  },

  /**
   * Retorna apenas o token (sem validar)
   */
  getToken: async () => {
    return await AsyncStorage.getItem(KEYS.TOKEN);
  },
};