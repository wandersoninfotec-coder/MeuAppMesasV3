// src/config/themes.js

export const RAMO_PADRAO = 'restaurante';

export const TEMAS = {
  restaurante: {
    id: 'restaurante',
    nome: 'Restaurante',
    descricao: 'Serviço de mesa à la carte',
    icone: '🍽️',
    cor: '#3498db',
    icones: {
      dashboard: '📊',
      mesas: '🪑',
      pedidos: '📋',
      cardapio: '📖',
      produtos: '🍽️',
      adicionar: '➕',
      carrinho: '🛒',
      cliente: '👤',
      config: '⚙️',
      sair: '🚪',
      imprimir: '🖨️',
      dinheiro: '💰',
    },
  },

  lanches: {
    id: 'lanches',
    nome: 'Lanches',
    descricao: 'Hamburgueria, hot dog, sanduíches',
    icone: '🍔',
    cor: '#e67e22',
    icones: {
      dashboard: '📊',
      mesas: '🍟',
      pedidos: '🍔',
      cardapio: '📖',
      produtos: '🍔',
      adicionar: '➕',
      carrinho: '🛒',
      cliente: '👤',
      config: '⚙️',
      sair: '🚪',
      imprimir: '🖨️',
      dinheiro: '💰',
    },
  },

  sorveteria: {
    id: 'sorveteria',
    nome: 'Sorveteria',
    descricao: 'Sorvetes, açaí, milk-shakes',
    icone: '🍦',
    cor: '#9b59b6',
    icones: {
      dashboard: '📊',
      mesas: '🍨',
      pedidos: '🍧',
      cardapio: '📖',
      produtos: '🍦',
      adicionar: '➕',
      carrinho: '🛒',
      cliente: '👤',
      config: '⚙️',
      sair: '🚪',
      imprimir: '🖨️',
      dinheiro: '💰',
    },
  },

  espetinhos: {
    id: 'espetinhos',
    nome: 'Espetinhos',
    descricao: 'Churrascaria, espetos, grelhados',
    icone: '🍢',
    cor: '#e74c3c',
    icones: {
      dashboard: '📊',
      mesas: '🔥',
      pedidos: '🍢',
      cardapio: '📖',
      produtos: '🥩',
      adicionar: '➕',
      carrinho: '🛒',
      cliente: '👤',
      config: '⚙️',
      sair: '🚪',
      imprimir: '🖨️',
      dinheiro: '💰',
    },
  },

  bar: {
    id: 'bar',
    nome: 'Bar',
    descricao: 'Bebidas, petiscos, cervejas',
    icone: '🍺',
    cor: '#8e44ad',
    icones: {
      dashboard: '📊',
      mesas: '🍻',
      pedidos: '🥂',
      cardapio: '📖',
      produtos: '🍺',
      adicionar: '➕',
      carrinho: '🛒',
      cliente: '👤',
      config: '⚙️',
      sair: '🚪',
      imprimir: '🖨️',
      dinheiro: '💰',
    },
  },
};

// Lista para iterar
export const LISTA_TEMAS = Object.values(TEMAS);

// Retorna um tema pelo id
export function getTema(id) {
  return TEMAS[id] || TEMAS[RAMO_PADRAO];
}