// Formata valor monetário
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formata data
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Formata número da mesa
export const formatMesaNumero = (numero) => {
  return String(numero).padStart(2, '0');
};

// Status da mesa para exibição
export const getMesaStatus = (status) => {
  const statusMap = {
    'livre': { label: 'Livre', color: '#2ecc71' },
    'ocupada': { label: 'Ocupada', color: '#e74c3c' },
    'reservada': { label: 'Reservada', color: '#f39c12' },
    'em_atendimento': { label: 'Em Atendimento', color: '#3498db' },
    'fechada': { label: 'Fechada', color: '#95a5a6' }
  };
  return statusMap[status] || { label: status, color: '#95a5a6' };
};