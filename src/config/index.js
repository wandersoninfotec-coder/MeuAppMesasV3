// src/config/index.js

// ⚠️ NÃO MAIS CONSTANTES - agora são variáveis mutáveis
export let API_CONFIG = {
  baseURL: '',          // ← Será preenchido dinamicamente
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  endpoints: {
    login: '/app/login',
    ping: '/app/ping',
    mesasListar: '/vendas/listar',
    mesaLivre: '/vendas/verificaMesaLivre',
    vendaAbrir: '/app/vendaAbrir',
    vendaCancelar: '/vendas/cancelar',
    itemAdicionar: '/vendas/itemadd',
    itemListar: '/vendas/itemlistar',
    itemCancelar: '/vendas/itemcancelar',
    produtosListar: '/produto/listarConsulta',
    gruposListar: '/produto/listarGrupos',
  },
};

export let EMPRESA_PADRAO = 1;  // ← Também dinâmico

// Função para atualizar a configuração em tempo real
export function atualizarConfig({ baseURL, empresa }) {
  if (baseURL) API_CONFIG.baseURL = baseURL;
  if (empresa) EMPRESA_PADRAO = empresa;
}

// Função para montar a URL completa
export function montarURL(ip, porta, caminhoApi) {
  const portaStr = porta && porta !== '80' && porta !== '' ? `:${porta}` : '';
  return `http://${ip}${portaStr}/${caminhoApi}`;
}