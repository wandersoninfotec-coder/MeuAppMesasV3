// src/services/historicoService.js
import api from './api';
import { EMPRESA_PADRAO } from '../config';

export const historicoService = {
  listar: async (periodo = 'hoje', status = 'todas') => {
    try {
      const response = await api.post('/app/historicoListar', {
        empresa: EMPRESA_PADRAO,
        periodo,
        status,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar histórico:', error);
      throw error;
    }
  },

  detalhes: async (venda) => {
    try {
      const response = await api.post('/app/historicoDetalhes', {
        empresa: EMPRESA_PADRAO,
        venda,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      throw error;
    }
  },
};