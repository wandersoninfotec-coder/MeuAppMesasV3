// src/screens/HistoricoScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { historicoService } from '../services/historicoService';
import { useTema } from '../hooks/useTema';
import { COLORS } from '../config/colors';

const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7dias', label: '7 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'todos', label: 'Todos' },
];

const STATUS = [
  { id: 'todas', label: 'Todas' },
  { id: 'fechadas', label: 'Fechadas' },
  { id: 'canceladas', label: 'Canceladas' },
];

export default function HistoricoScreen({ navigation }) {
  const tema = useTema();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('hoje');
  const [status, setStatus] = useState('todas');

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [periodo, status])
  );

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const data = await historicoService.listar(periodo, status);
      setVendas(data);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar histórico');
      setVendas([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarHistorico();
    setRefreshing(false);
  };

  const formatarData = (dataStr, hora) => {
    if (!dataStr) return '';
    try {
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano} ${hora || ''}`;
    } catch {
      return dataStr;
    }
  };

  const renderVenda = ({ item }) => {
    const fechada = item.status === 1;

    return (
      <TouchableOpacity
        style={styles.vendaCard}
        onPress={() =>
          navigation.navigate('DetalhesPedido', { venda: item.venda })
        }
        activeOpacity={0.7}
      >
        <View style={styles.vendaHeader}>
          <View style={styles.vendaHeaderLeft}>
            <Text style={styles.vendaNumero}>#{item.venda}</Text>
            <Text style={styles.vendaMesa}>{item.mesa_descricao}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: fechada ? '#EAF9F1' : '#FDECEA',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: fechada ? '#27AE60' : '#C0392B' },
              ]}
            >
              {item.status_label}
            </Text>
          </View>
        </View>

        <View style={styles.vendaInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendaData}>
              {formatarData(item.data, item.hora)}
            </Text>
            {(item.vendedor_nome || item.vendedor) ? (
              <Text style={styles.vendaVendedor}>
                👤 {item.vendedor_nome || `Vendedor #${item.vendedor}`}
              </Text>
            ) : null}
          </View>
          <Text style={styles.vendaTotal}>R$ {item.total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calcula total do período
  const totalPeriodo = vendas
    .filter((v) => v.status === 1)
    .reduce((sum, v) => sum + v.total, 0);

  return (
    <View style={styles.container}>
      {/* Filtro de Período */}
      <View style={styles.filtroContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtroContent}
        >
          {PERIODOS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.chip,
                periodo === p.id && {
                  backgroundColor: tema.cor,
                  borderColor: tema.cor,
                },
              ]}
              onPress={() => setPeriodo(p.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  periodo === p.id && styles.chipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtro de Status */}
      <View style={styles.filtroContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtroContent}
        >
          {STATUS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.chip,
                status === s.id && {
                  backgroundColor: tema.cor,
                  borderColor: tema.cor,
                },
              ]}
              onPress={() => setStatus(s.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  status === s.id && styles.chipTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Resumo */}
      {!loading && vendas.length > 0 && (
        <View style={styles.resumoBar}>
          <Text style={styles.resumoLabel}>
            {vendas.filter((v) => v.status === 1).length} vendas
          </Text>
          <Text style={styles.resumoTotal}>R$ {totalPeriodo.toFixed(2)}</Text>
        </View>
      )}

      {/* Lista */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={tema.cor} />
        </View>
      ) : (
        <FlatList
          data={vendas}
          renderItem={renderVenda}
          keyExtractor={(item) => String(item.venda)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[tema.cor]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Altere os filtros para ver mais resultados
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },

  filtroContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  filtroContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f3f7',
    borderWidth: 1,
    borderColor: '#e0e5ec',
    marginRight: 8,
  },
  chipText: { fontSize: 13, color: '#5c6b7a', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  resumoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  resumoLabel: { fontSize: 13, color: '#95a5a6', fontWeight: '600' },
  resumoTotal: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },

  vendaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  vendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendaHeaderLeft: { flex: 1 },
  vendaNumero: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
  },
  vendaMesa: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },

  vendaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eaeef3',
  },
  vendaData: { fontSize: 12, color: '#95a5a6' },
  vendaTotal: { fontSize: 16, fontWeight: 'bold', color: '#27AE60' },

  empty: { padding: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
  emptySubtitle: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 5,
    textAlign: 'center',
  },
  vendaVendedor: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 2,
  },
});