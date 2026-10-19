import api from './api';
import { API_CONFIG, EMPRESA_PADRAO } from '../config';

export const pedidoService = {
  /**
   * Lista os itens de uma venda
   */
  listarItens: async (venda) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.itemListar, {
        empresa: EMPRESA_PADRAO,
        venda: venda,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar itens:', error);
      throw error;
    }
  },

    /**
   * Lista grupos/categorias de produtos
   */
  listarGrupos: async () => {
    try {
      const response = await api.post(API_CONFIG.endpoints.gruposListar, {
        empresa: EMPRESA_PADRAO,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar grupos:', error);
      return [];
    }
  },

  // Adicionar Item
  adicionarItem: async (item) => {
    try {
      const response = await api.post('/app/itemAdicionarSeguro', {
        empresa: EMPRESA_PADRAO,
        venda: item.venda,
        referencia: item.referencia,
        descricao: item.descricao,
        quantidade: item.quantidade,
        preco: item.preco,
        total_liquido: item.preco * item.quantidade,
        total_bruto: item.preco * item.quantidade,
        vendedor: item.vendedor || 1,
        observacao: item.observacao || '',
      });
      return response.data;
    } catch (error) {
      // 409 = venda fechada pelo PDV
      if (error.response?.status === 409) {
        const erro = new Error('VENDA_FECHADA');
        erro.tipo = 'VENDA_FECHADA';
        erro.mensagem = error.response.data?.erro || 'Venda foi fechada no PDV';
        throw erro;
      }
      // 404 = venda não existe
      if (error.response?.status === 404) {
        const erro = new Error('VENDA_NAO_ENCONTRADA');
        erro.tipo = 'VENDA_NAO_ENCONTRADA';
        throw erro;
      }
      throw error;
    }
  },

  /**
   * Remove/cancela um item
   */
  removerItem: async (venda, item) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.itemCancelar, {
        empresa: EMPRESA_PADRAO,
        venda: venda,
        item: item,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      throw error;
    }
  },
};