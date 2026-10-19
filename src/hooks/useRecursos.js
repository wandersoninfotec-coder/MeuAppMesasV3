// src/hooks/useRecursos.js
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { configService, RECURSOS_PADRAO } from '../services/configService';

/**
 * Hook que retorna os recursos ativos do app.
 * Recarrega automaticamente quando o usuário altera nas Configurações.
 *
 * Uso:
 *   const { finalizarVenda, visualizarRelatorios } = useRecursos();
 *   {finalizarVenda && <BotaoFechar />}
 */
export function useRecursos() {
  const [recursos, setRecursos] = useState(RECURSOS_PADRAO);

  const carregarRecursos = useCallback(async () => {
    try {
      const config = await configService.carregar();
      if (config?.recursos) {
        setRecursos({ ...RECURSOS_PADRAO, ...config.recursos });
      } else {
        setRecursos(RECURSOS_PADRAO);
      }
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      setRecursos(RECURSOS_PADRAO);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarRecursos();
    }, [carregarRecursos])
  );

  return recursos;
}