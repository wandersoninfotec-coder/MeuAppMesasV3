// src/screens/PedidoScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { pedidoService } from '../services/pedidoService';
import { mesaService } from '../services/mesaService';
import { useTema } from '../hooks/useTema';
import { useRecursos } from '../hooks/useRecursos';
import { COLORS } from '../config/colors';

export default function PedidoScreen({ route, navigation }) {
  const tema = useTema();
  const recursos = useRecursos();
  const { mesa, venda } = route.params || {};

  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  const [vendaFechada, setVendaFechada] = useState(false);
  const [vendaRemovida, setVendaRemovida] = useState(false);

  React.useEffect(() => {
    if (mesa) {
      navigation.setOptions({
        title: mesa.descricao || `Mesa ${mesa.numero}`,
      });
    }
  }, [mesa]);

  // ✅ ÚNICO useFocusEffect, sem alertas, só setando estados
  useFocusEffect(
    useCallback(() => {
      // Se já está bloqueado, não verifica de novo
      if (vendaFechada || vendaRemovida) return;

      const verificar = async () => {
        if (!venda) {
          setLoading(false);
          return;
        }

        const status = await mesaService.verificarStatus(venda);

        if (status.existe === false) {
          setVendaRemovida(true);
          return;
        }

        if (status.fechada) {
          setVendaFechada(true);
          return;
        }

        carregarItens();
      };

      verificar();
    }, [venda, vendaFechada, vendaRemovida])
  );

  const irParaMesas = () => {
    navigation.reset({
      index: 1,
      routes: [{ name: 'Dashboard' }, { name: 'Mesas' }],
    });
  };

  const carregarItens = async () => {
    if (!venda) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await pedidoService.listarItens(venda);

      const itensNormalizados = (Array.isArray(data) ? data : []).map(
        (item, index) => ({
          id: item.item || item.id || index,
          item: item.item || index,
          referencia: item.referencia,
          descricao: item.descricao || item.referencia,
          quantidade: parseFloat(item.quantidade) || 1,
          preco: parseFloat(item.preco) || 0,
          total: parseFloat(item.total_liquido) || 0,
          observacao: item.observacao || '',
        })
      );

      setItens(itensNormalizados);
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
      Alert.alert('Erro', 'Falha ao carregar itens');
      setItens([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarItens();
    setRefreshing(false);
  };

  const handleRemoverItem = (item) => {
    Alert.alert('Remover Item', `Deseja remover "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => removerItem(item),
      },
    ]);
  };

  const removerItem = async (item) => {
    try {
      setRemovendo(item.id);
      await pedidoService.removerItem(venda, item.item);
      await carregarItens();
    } catch (error) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Falha ao remover item');
    } finally {
      setRemovendo(null);
    }
  };

  const handleAdicionarItem = () => {
    navigation.navigate('Produtos', {
      venda: venda,
      mesa: mesa,
    });
  };

  const handleFecharPedido = () => {
    Alert.alert(
      'Fechar Pedido',
      `Total: R$ ${calcularTotal().toFixed(2)}\n\nEm breve: tela de fechamento com formas de pagamento.`,
      [{ text: 'OK' }]
    );
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.total, 0);
  };

  const calcularTotalItens = () => {
    return itens.reduce((sum, item) => sum + item.quantidade, 0);
  };

  const renderItem = ({ item }) => {
    const isRemovendo = removendo === item.id;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemQuantidade}>
          <Text style={styles.itemQuantidadeText}>{item.quantidade}</Text>
          <Text style={styles.itemQuantidadeLabel}>x</Text>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemDescricao} numberOfLines={2}>
            {item.descricao}
          </Text>
          <Text style={styles.itemDetalhes}>
            R$ {item.preco.toFixed(2)} cada
          </Text>
          {item.observacao ? (
            <View style={styles.itemObsContainer}>
              <Text style={styles.itemObs}>📝 {item.observacao}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemTotal}>R$ {item.total.toFixed(2)}</Text>
          {isRemovendo ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <TouchableOpacity
              style={styles.itemRemoveBtn}
              onPress={() => handleRemoverItem(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.itemRemoveIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ============ TELA: VENDA FECHADA NO PDV ============
  if (vendaFechada) {
    return (
      <View style={styles.bloqueioContainer}>
        <Text style={styles.bloqueioIcon}>🔒</Text>
        <Text style={styles.bloqueioTitulo}>Mesa fechada no PDV</Text>
        <Text style={styles.bloqueioTexto}>
          Esta mesa foi finalizada no caixa e não pode mais ser editada.
        </Text>
        <Text style={styles.bloqueioSubtexto}>
          Toque abaixo para voltar às mesas.
        </Text>

        <TouchableOpacity
          style={styles.bloqueioBotaoPrimario}
          onPress={irParaMesas}
        >
          <Text style={styles.bloqueioBotaoPrimarioText}>
            Voltar para Mesas
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============ TELA: VENDA REMOVIDA ============
  if (vendaRemovida) {
    return (
      <View style={styles.bloqueioContainer}>
        <Text style={styles.bloqueioIcon}>❓</Text>
        <Text style={styles.bloqueioTitulo}>Mesa removida</Text>
        <Text style={styles.bloqueioTexto}>
          Esta mesa não existe mais no sistema.
        </Text>

        <TouchableOpacity
          style={styles.bloqueioBotaoPrimario}
          onPress={irParaMesas}
        >
          <Text style={styles.bloqueioBotaoPrimarioText}>
            Voltar para Mesas
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tema.cor} />
        <Text style={styles.loadingText}>Carregando pedido...</Text>
      </View>
    );
  }

  const total = calcularTotal();
  const totalItens = calcularTotalItens();

  return (
    <View style={styles.container}>
      <View style={styles.mesaHeader}>
        <View style={styles.mesaIconContainer}>
          <Text style={styles.mesaHeaderIcon}>{tema.icones.mesas}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mesaHeaderTitle}>
            {mesa?.descricao || `Mesa ${mesa?.numero || ''}`}
          </Text>
          <Text style={styles.mesaHeaderSubtitle}>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'} no pedido
          </Text>
        </View>
        <View style={[styles.headerAccent, { backgroundColor: tema.cor }]} />
      </View>

      <FlatList
        data={itens}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item.id || index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tema.cor]}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>{tema.icones.produtos}</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhum item lançado</Text>
            <Text style={styles.emptySubtitle}>
              Toque em "Adicionar Item" para começar
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total do Pedido</Text>
            <Text style={styles.totalItems}>
              {totalItens} {totalItens === 1 ? 'item' : 'itens'}
            </Text>
          </View>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tema.cor }]}
            onPress={handleAdicionarItem}
            activeOpacity={0.85}
          >
            <Text style={styles.addButtonIcon}>{tema.icones.adicionar}</Text>
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>

          {recursos.finalizarVenda && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                itens.length === 0 && styles.buttonDisabled,
              ]}
              onPress={handleFecharPedido}
              disabled={itens.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textLight,
  },

  mesaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  mesaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f0f3f7',
  },
  mesaHeaderIcon: {
    fontSize: 24,
  },
  mesaHeaderTitle: {
    color: '#2c3e50',
    fontSize: 17,
    fontWeight: 'bold',
  },
  mesaHeaderSubtitle: {
    color: '#95a5a6',
    fontSize: 12,
    marginTop: 2,
  },
  headerAccent: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },

  list: {
    padding: 12,
    paddingBottom: 20,
  },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemQuantidade: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexDirection: 'row',
    backgroundColor: '#f0f3f7',
  },
  itemQuantidadeText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  itemQuantidadeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 1,
    marginTop: 3,
    color: '#2c3e50',
  },
  itemInfo: {
    flex: 1,
  },
  itemDescricao: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 20,
  },
  itemDetalhes: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 3,
  },
  itemObsContainer: {
    marginTop: 4,
    paddingLeft: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#f39c12',
  },
  itemObs: {
    fontSize: 11,
    color: '#f39c12',
    fontStyle: 'italic',
  },
  itemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
    minWidth: 85,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  itemRemoveBtn: {
    marginTop: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRemoveIcon: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: 'bold',
  },

  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f0f3f7',
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eaeef3',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  totalLabel: {
    fontSize: 13,
    color: '#95a5a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalItems: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#27ae60',
  },

  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#fff',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  closeButtonText: {
    color: '#27ae60',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.4,
  },

  bloqueioContainer: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  bloqueioIcon: { fontSize: 70, marginBottom: 20 },
  bloqueioTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  bloqueioTexto: {
    fontSize: 15,
    color: '#5c6b7a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  bloqueioSubtexto: {
    fontSize: 13,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  bloqueioBotaoPrimario: {
    width: '100%',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  bloqueioBotaoPrimarioText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});