import api from './api';
import { API_CONFIG, EMPRESA_PADRAO } from '../config';

export const produtoService = {
  // Lista produtos (com busca opcional)
  listar: async (busca = '') => {
    const response = await api.post(API_CONFIG.endpoints.produtosListar, {
      empresa: EMPRESA_PADRAO,
      texto: busca
    });
    return response.data;
  },

  // Lista grupos/categorias
  listarGrupos: async () => {
    const response = await api.post(API_CONFIG.endpoints.gruposListar, {
      empresa: EMPRESA_PADRAO
    });
    return response.data;
  }
};