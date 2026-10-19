// src/screens/MesasScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { mesaService } from '../services/mesaService';
import { useTema } from '../hooks/useTema';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { COLORS } from '../config/colors';
import { useAuth } from '../context/AuthContext';


export default function MesasScreen({ navigation }) {
  const tema = useTema();
  const { width } = useWindowDimensions();
  const [mesas, setMesas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [abrindo, setAbrindo] = useState(null);

  const { user } = useAuth();

  const numColunas = width >= 400 ? 4 : 3;
  const espacamento = 10;
  const paddingHorizontal = 12;
  const tamanhoCard =
    (width - paddingHorizontal * 2 - espacamento * (numColunas - 1)) /
    numColunas;
  const alturaCard = tamanhoCard + 14;

  const carregarMesas = useCallback(async () => {
    try {
      const data = await mesaService.listar();

      let lista = [];
      if (Array.isArray(data)) lista = data;
      else if (data && typeof data === 'object') {
        lista = data.mesas || data.data || Object.values(data);
      }

      const mesasNormalizadas = lista.map((m, index) => {
        const vendaRaw = m.venda ?? m.venda_atual ?? m.nro_venda ?? 0;
        const vendaNum = parseInt(vendaRaw) || 0;
        const temVendaAberta = vendaNum > 0;

        const numeroRaw =
          m.mesa_codigo ?? m.mesa_comanda ?? m.numero ?? m.mesa ?? index + 1;

        return {
          id: numeroRaw,
          numero: String(numeroRaw),
          descricao: m.mesa_descricao ?? m.descricao ?? `Mesa ${numeroRaw}`,
          status: temVendaAberta ? 'ocupada' : 'livre',
          venda: temVendaAberta ? vendaNum : null,
          total: parseFloat(m.total) || 0,
          vendedor: m.vendedor || null,
        };
      });

      setMesas(mesasNormalizadas);
    } catch (error) {
      console.error('❌ Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregarMesas();
    }, [carregarMesas])
  );

  const { atualizando } = useAutoRefresh(carregarMesas, 10000);

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarMesas();
    setRefreshing(false);
  };

  const handleMesaPress = async (mesa) => {
    if (mesa.status === 'livre') {
      Alert.alert('Abrir Mesa', `Deseja abrir a ${mesa.descricao}?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir', onPress: () => abrirMesa(mesa) },
      ]);
    } else {
      navigation.navigate('Pedido', {
        mesa: mesa,
        venda: mesa.venda,
      });
    }
  };

  const abrirMesa = async (mesa) => {
    try {
      setAbrindo(mesa.id);
      const resultado = await mesaService.abrirMesa(mesa.numero, user?.codigoFuncionario ?? 0);

      const vendaId = resultado?.venda || resultado?.id;
      const jaAberta = resultado?.ja_aberta === true;

      if (!vendaId || vendaId <= 0) {
        Alert.alert('Erro', 'A API não retornou o ID da venda');
        return;
      }

      await carregarMesas();

      if (jaAberta) {
        Alert.alert(
          'Mesa já aberta',
          `Esta mesa já possui a venda #${vendaId}. Deseja continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              onPress: () =>
                navigation.navigate('Pedido', {
                  mesa: { ...mesa, status: 'ocupada', venda: vendaId },
                  venda: vendaId,
                }),
            },
          ]
        );
      } else {
        navigation.navigate('Pedido', {
          mesa: { ...mesa, status: 'ocupada', venda: vendaId },
          venda: vendaId,
        });
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Falha ao abrir mesa');
    } finally {
      setAbrindo(null);
    }
  };

  const getCoresStatus = (status) => {
    if (status === 'ocupada') {
      return {
        fundo: '#FDECEA',
        borda: '#E74C3C',
        texto: '#C0392B',
        badge: '#E74C3C',
        badgeTexto: '#fff',
      };
    }
    return {
      fundo: '#EAF9F1',
      borda: '#2ECC71',
      texto: '#27AE60',
      badge: '#2ECC71',
      badgeTexto: '#fff',
    };
  };

  const renderMesa = ({ item }) => {
    const cores = getCoresStatus(item.status);
    const isAbrindo = abrindo === item.id;
    const ocupada = item.status === 'ocupada';

    return (
      <TouchableOpacity
        style={[
          styles.mesaCard,
          {
            width: tamanhoCard,
            height: alturaCard,
            backgroundColor: cores.fundo,
            borderColor: cores.borda,
          },
        ]}
        onPress={() => handleMesaPress(item)}
        activeOpacity={0.75}
        disabled={isAbrindo}
      >
        {isAbrindo ? (
          <ActivityIndicator color={cores.texto} size="large" />
        ) : (
          <>
            <Text style={[styles.mesaNumero, { color: cores.texto }]}>
              {item.numero}
            </Text>

            <Text style={styles.mesaIcone}>
              {ocupada ? tema.icones.pedidos : tema.icones.mesas}
            </Text>

            <View
              style={[styles.statusBadge, { backgroundColor: cores.badge }]}
            >
              <Text style={[styles.statusText, { color: cores.badgeTexto }]}>
                {ocupada ? 'OCUPADA' : 'LIVRE'}
              </Text>
            </View>

            {ocupada && item.total > 0 && (
              <View style={styles.valorContainer}>
                <Text
                  style={[
                    styles.valorTexto,
                    { color: cores.texto, borderTopColor: cores.borda },
                  ]}
                >
                  R$ {item.total.toFixed(2)}
                </Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const contadores = {
    total: mesas.length,
    livres: mesas.filter((m) => m.status === 'livre').length,
    ocupadas: mesas.filter((m) => m.status === 'ocupada').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tema.cor} />
        <Text style={styles.loadingText}>Carregando mesas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de status no topo */}
      <View style={styles.headerBar}>
        <View style={[styles.headerItem, { backgroundColor: '#EAF9F1' }]}>
          <Text style={[styles.headerNumber, { color: '#27AE60' }]}>
            {contadores.livres}
          </Text>
          <Text style={[styles.headerLabel, { color: '#27AE60' }]}>
            Livres
          </Text>
        </View>

        <View style={[styles.headerItem, { backgroundColor: '#FDECEA' }]}>
          <Text style={[styles.headerNumber, { color: '#C0392B' }]}>
            {contadores.ocupadas}
          </Text>
          <Text style={[styles.headerLabel, { color: '#C0392B' }]}>
            Ocupadas
          </Text>
        </View>

        <View
          style={[styles.headerItem, { backgroundColor: tema.cor + '15' }]}
        >
          <Text style={[styles.headerNumber, { color: tema.cor }]}>
            {contadores.total}
          </Text>
          <Text style={[styles.headerLabel, { color: tema.cor }]}>Total</Text>
        </View>
      </View>

      {/* Indicador ao vivo - apenas o status, sem valores */}
      <View style={styles.liveBar}>
        <View style={styles.liveIndicator}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: atualizando ? '#f39c12' : '#2ecc71' },
            ]}
          />
          <Text style={styles.liveText}>
            {atualizando ? 'Atualizando...' : 'Ao vivo • 10s'}
          </Text>
        </View>
      </View>

      {/* Grade de mesas */}
      <FlatList
        data={mesas}
        renderItem={renderMesa}
        keyExtractor={(item, index) => String(item.id || index)}
        numColumns={numColunas}
        key={numColunas}
        columnWrapperStyle={{
          justifyContent: 'flex-start',
          gap: espacamento,
        }}
        contentContainerStyle={{
          padding: paddingHorizontal,
          paddingBottom: 20,
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: espacamento }} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tema.cor]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{tema.icones.mesas}</Text>
            <Text style={styles.emptyTitle}>Nenhuma mesa encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Puxe para baixo para recarregar
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  loadingText: { marginTop: 12, fontSize: 15, color: COLORS.textLight },

  headerBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  headerItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  headerNumber: { fontSize: 22, fontWeight: 'bold' },
  headerLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },

  // Indicador ao vivo (centralizado)
  liveBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: '#95a5a6',
    fontWeight: '500',
  },

  mesaCard: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mesaNumero: { fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
  mesaIcone: { fontSize: 18, lineHeight: 22, marginVertical: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: { fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 },

  valorContainer: { width: '100%', alignItems: 'center', marginTop: 2 },
  valorTexto: {
    fontSize: 11,
    fontWeight: 'bold',
    borderTopWidth: 1,
    paddingTop: 3,
    paddingHorizontal: 6,
    lineHeight: 14,
  },

  emptyState: { paddingVertical: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 5 },
});