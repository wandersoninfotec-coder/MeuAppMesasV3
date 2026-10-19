// src/screens/DetalhesPedidoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { historicoService } from '../services/historicoService';
import { useTema } from '../hooks/useTema';

export default function DetalhesPedidoScreen({ route, navigation }) {
  const tema = useTema();
  const { venda } = route.params || {};
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDetalhes();
  }, [venda]);

  const carregarDetalhes = async () => {
    try {
      setLoading(true);
      const resultado = await historicoService.detalhes(venda);
      setDados(resultado);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar detalhes', [
      {
        text: 'OK',
        onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Historico');
          }
        },
      },
    ]);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataStr, hora) => {
    if (!dataStr) return '';
    try {
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano} às ${hora || ''}`;
    } catch {
      return dataStr;
    }
  };

  const renderItem = ({ item }) => {
    const cancelado = item.cancelado === 1;

    return (
      <View style={[styles.itemCard, cancelado && styles.itemCancelado]}>
        <View
          style={[
            styles.itemQuantidade,
            cancelado && { backgroundColor: '#FDECEA' },
          ]}
        >
          <Text
            style={[
              styles.itemQuantidadeText,
              cancelado && { color: '#C0392B' },
            ]}
          >
            {item.quantidade}
          </Text>
          <Text
            style={[
              styles.itemQuantidadeLabel,
              cancelado && { color: '#C0392B' },
            ]}
          >
            x
          </Text>
        </View>

        <View style={styles.itemInfo}>
          <Text
            style={[
              styles.itemDescricao,
              cancelado && styles.itemDescricaoCancelada,
            ]}
            numberOfLines={2}
          >
            {item.descricao}
            {cancelado ? ' (cancelado)' : ''}
          </Text>
          <Text style={styles.itemDetalhes}>
            R$ {item.preco.toFixed(2)} cada
          </Text>
          {item.observacao ? (
            <Text style={styles.itemObs}>📝 {item.observacao}</Text>
          ) : null}
        </View>

        <Text
          style={[styles.itemTotal, cancelado && styles.itemTotalCancelado]}
        >
          R$ {item.total.toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={tema.cor} />
      </View>
    );
  }

  if (!dados) return null;

  const { cabecalho, itens } = dados;
  const fechada = cabecalho.status === 1;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerVenda}>Pedido #{cabecalho.venda}</Text>
            <Text style={styles.headerMesa}>{cabecalho.mesa_descricao}</Text>
          </View>
          <View
            style={[
              styles.headerStatus,
              { backgroundColor: fechada ? '#EAF9F1' : '#FDECEA' },
            ]}
          >
            <Text
              style={[
                styles.headerStatusText,
                { color: fechada ? '#27AE60' : '#C0392B' },
              ]}
            >
              {cabecalho.status_label}
            </Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Data</Text>
          <Text style={styles.headerValue}>
            {formatarData(cabecalho.data, cabecalho.hora)}
          </Text>
        </View>

        {cabecalho.vendedor_nome ? (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Atendido por</Text>
              <Text style={styles.headerValue}>{cabecalho.vendedor_nome}</Text>
            </View>
          ) : cabecalho.vendedor ? (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Vendedor</Text>
              <Text style={styles.headerValue}>#{cabecalho.vendedor}</Text>
            </View>
          ) : null}
      </View>

      {/* Itens */}
      <Text style={styles.sectionTitle}>
        Itens do pedido ({itens.length})
      </Text>

      <FlatList
        data={itens}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.item)}
        contentContainerStyle={styles.list}
      />

      {/* Total */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Total do pedido</Text>
        <Text style={styles.footerTotal}>
          R$ {cabecalho.total.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerVenda: { fontSize: 12, color: '#95a5a6', fontWeight: '600' },
  headerMesa: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 2,
  },
  headerStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerStatusText: { fontSize: 12, fontWeight: 'bold' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  headerLabel: { fontSize: 13, color: '#95a5a6' },
  headerValue: { fontSize: 13, color: '#2c3e50', fontWeight: '600' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  list: { padding: 12, paddingTop: 0 },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  itemCancelado: { opacity: 0.6 },
  itemQuantidade: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexDirection: 'row',
    backgroundColor: '#f0f3f7',
  },
  itemQuantidadeText: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  itemQuantidadeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 1,
    marginTop: 3,
    color: '#2c3e50',
  },
  itemInfo: { flex: 1 },
  itemDescricao: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 18,
  },
  itemDescricaoCancelada: { textDecorationLine: 'line-through' },
  itemDetalhes: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  itemObs: {
    fontSize: 11,
    color: '#f39c12',
    marginTop: 3,
    fontStyle: 'italic',
  },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
  itemTotalCancelado: {
    color: '#95a5a6',
    textDecorationLine: 'line-through',
  },

  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#eaeef3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 13,
    color: '#95a5a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerTotal: { fontSize: 24, fontWeight: 'bold', color: '#27ae60' },
});