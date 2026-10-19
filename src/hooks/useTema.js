// src/hooks/useTema.js
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { configService } from '../services/configService';
import { getTema, TEMAS, RAMO_PADRAO } from '../config/themes';

/**
 * Hook que retorna o tema atual do app baseado no ramo escolhido.
 * Recarrega automaticamente quando o usuário muda o ramo nas Configurações.
 */
export function useTema() {
  const [tema, setTema] = useState(TEMAS[RAMO_PADRAO]);

  const carregarTema = useCallback(async () => {
    try {
      const config = await configService.carregar();
      const ramo = config?.ramo || RAMO_PADRAO;
      setTema(getTema(ramo));
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
      setTema(TEMAS[RAMO_PADRAO]);
    }
  }, []);

  // Recarrega sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      carregarTema();
    }, [carregarTema])
  );

  return tema;
}