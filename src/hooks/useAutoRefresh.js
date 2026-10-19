// src/hooks/useAutoRefresh.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';

/**
 * Hook que executa um callback automaticamente em intervalos regulares.
 *
 * Só roda quando:
 *   - A tela está em foco (navegação)
 *   - O app está em primeiro plano (não está em background)
 *
 * Para automaticamente quando:
 *   - A tela perde o foco
 *   - O app vai para background
 *
 * Uso:
 *   const { atualizando, forcarAtualizacao } = useAutoRefresh(carregarMesas, 10000);
 */
export function useAutoRefresh(callback, intervaloMs = 10000, ativo = true) {
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const intervalRef = useRef(null);
  const estaRodandoRef = useRef(false);
  const callbackRef = useRef(callback);

  // Mantém a referência do callback atualizada sem reiniciar o intervalo
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const executar = useCallback(async () => {
    if (estaRodandoRef.current) return;
    try {
      estaRodandoRef.current = true;
      setAtualizando(true);
      await callbackRef.current();
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro no auto-refresh:', error);
    } finally {
      estaRodandoRef.current = false;
      setAtualizando(false);
    }
  }, []);

  const iniciarIntervalo = useCallback(() => {
    if (intervalRef.current) return;
    if (!ativo) return;
    intervalRef.current = setInterval(executar, intervaloMs);
  }, [executar, intervaloMs, ativo]);

  const pararIntervalo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reage ao foco da tela
  useFocusEffect(
    useCallback(() => {
      // Ao ganhar foco, executa imediatamente e inicia o intervalo
      executar();
      iniciarIntervalo();

      return () => {
        pararIntervalo();
      };
    }, [executar, iniciarIntervalo, pararIntervalo])
  );

  // Reage ao estado do app (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        iniciarIntervalo();
      } else {
        pararIntervalo();
      }
    });

    return () => subscription?.remove();
  }, [iniciarIntervalo, pararIntervalo]);

  return {
    atualizando,
    ultimaAtualizacao,
    forcarAtualizacao: executar,
  };
}