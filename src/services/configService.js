// src/services/configService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = '@app:config';



// ⚙️ Recursos padrão
export const RECURSOS_PADRAO = {
  finalizarVenda: false,
  visualizarRelatorios: false,
  visualizarHistorico: true,
};

export const configService = {
  salvar: async (config) => {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Erro ao salvar config:', error);
      return false;
    }
  },

  carregar: async () => {
    try {
      const json = await AsyncStorage.getItem(CONFIG_KEY);
      if (!json) return null;

      const config = JSON.parse(json);

      // Garante que recursos existe
      if (!config.recursos) {
        config.recursos = { ...RECURSOS_PADRAO };
      }

      return config;
    } catch (error) {
      console.error('Erro ao carregar config:', error);
      return null;
    }
  },

  estaConfigurado: async () => {
    const config = await configService.carregar();
    return !!(config && config.ip && config.empresa);
  },

  limpar: async () => {
    await AsyncStorage.removeItem(CONFIG_KEY);
  },

  atualizarRecurso: async (nomeRecurso, valor) => {
    try {
      const config = await configService.carregar();
      if (!config) return false;

      config.recursos = {
        ...RECURSOS_PADRAO,
        ...(config.recursos || {}),
        [nomeRecurso]: valor,
      };

      await configService.salvar(config);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar recurso:', error);
      return false;
    }
  },

  buscarDadosEmpresa: async (ip, porta, caminhoApi, empresa) => {
    const portaStr = porta && porta !== '80' && porta !== '' ? `:${porta}` : '';
    const url = `http://${ip}${portaStr}/${caminhoApi}/app/dadosEmpresa`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ empresa: parseInt(empresa) }),
      });

      if (!response.ok) {
        return { sucesso: false, erro: `HTTP ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      return { sucesso: false, erro: error.message };
    }
  },

  testarConexao: async (ip, porta, caminhoApi = 'app_mesas_api') => {
    const portaStr = porta && porta !== '80' && porta !== '' ? `:${porta}` : '';
    const url = `http://${ip}${portaStr}/${caminhoApi}/app/ping`;

    console.log('🧪 Testando:', url);

    const fazerFetch = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('🧪 Abortando por timeout (8s)');
        controller.abort();
      }, 8000);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Servidor respondeu com código ${response.status}`);
        }

        const data = await response.json();
        console.log('🧪 Resposta OK:', data);

        return {
          sucesso: true,
          resposta: data,
          url: `http://${ip}${portaStr}/${caminhoApi}`,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const timeoutGarantido = () =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FORCADO')), 9000)
      );

    try {
      const resultado = await Promise.race([fazerFetch(), timeoutGarantido()]);
      return resultado;
    } catch (error) {
      console.log('🧪 Erro capturado:', error.message);

      if (
        error.name === 'AbortError' ||
        error.message === 'TIMEOUT_FORCADO'
      ) {
        return {
          sucesso: false,
          erro:
            'Tempo esgotado (9s). Verifique se o celular está no mesmo Wi-Fi e o IP está correto.',
        };
      }

      if (error.message && error.message.includes('Network request failed')) {
        return {
          sucesso: false,
          erro:
            'Não foi possível conectar. Verifique o IP e se o Apache está rodando.',
        };
      }

      if (error.message && error.message.includes('código')) {
        return { sucesso: false, erro: error.message };
      }

      return {
        sucesso: false,
        erro: 'Erro: ' + (error.message || 'desconhecido'),
      };
    }
  },
};