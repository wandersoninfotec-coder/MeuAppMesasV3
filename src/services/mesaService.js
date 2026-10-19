import api from './api';
import { API_CONFIG, EMPRESA_PADRAO } from '../config';

export const mesaService = {
  /**
   * Lista todas as mesas com seus status
   */
  listar: async () => {
    try {
      const response = await api.post(API_CONFIG.endpoints.mesasListar, {
        empresa: EMPRESA_PADRAO,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar mesas:', error);
      throw error;
    }
  },

  /**
   * Verifica se uma mesa específica está livre
   * @returns 1 = ocupada, 2 = livre
   */
  verificarLivre: async (mesa) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.mesaLivre, {
        empresa: EMPRESA_PADRAO,
        mesa: mesa,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar mesa:', error);
      throw error;
    }
  },

  /**
   * Abre uma nova venda em uma mesa
   * @returns { venda: number } - ID da venda criada
   */
  abrirMesa: async (mesa, vendedor = 1) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.vendaAbrir, {
        empresa: EMPRESA_PADRAO,
        mesa: mesa,
        vendedor: vendedor,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
      throw error;
    }
  },

abrirMesa: async (mesa, vendedor = 1) => {
  try {
    console.log('🔵 Abrindo mesa:', mesa);
    
    const response = await api.post(API_CONFIG.endpoints.vendaAbrir, {
      empresa: EMPRESA_PADRAO,
      mesa: mesa,
      mesa_comanda: mesa,   // ← envia os dois nomes
      vendedor: vendedor,
    });
    
    console.log('🟢 Resposta bruta:', response.data);
    
    // A resposta pode ser:
    // - Um número (1284)
    // - Um objeto { venda: 1284, ... }
    let vendaId = null;
    
    if (typeof response.data === 'number') {
      vendaId = response.data;
    } else if (response.data && typeof response.data === 'object') {
      vendaId = response.data.venda || response.data.id;
    } else if (typeof response.data === 'string') {
      // Se veio HTML ou string, tenta extrair número
      const match = response.data.match(/\d+/);
      if (match) vendaId = parseInt(match[0]);
    }
    
    console.log('🟢 vendaId extraído:', vendaId);
    
    if (!vendaId || vendaId <= 0) {
      throw new Error('A API não retornou ID de venda válido');
    }
    
    return { venda: vendaId, mesa: mesa };
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    throw error;
  }
},

  verificarStatus: async (venda) => {
    try {
      const response = await api.post('/app/verificarStatus', {
        empresa: EMPRESA_PADRAO,
        venda: venda,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { existe: false, aberta: false, fechada: false };
    }
  },

  /**
   * Cancela a venda de uma mesa
   */
  cancelarMesa: async (venda) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.vendaCancelar, {
        empresa: EMPRESA_PADRAO,
        venda: venda,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar mesa:', error);
      throw error;
    }
  },
};