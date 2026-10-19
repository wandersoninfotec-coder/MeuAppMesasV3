// src/screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../config/colors';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { useRecursos } from '../hooks/useRecursos';
import { mesaService } from '../services/mesaService';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const tema = useTema();
  const recursos = useRecursos();
  const [stats, setStats] = useState({
    total: 0,
    ocupadas: 0,
    livres: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarStats();
    });
    return unsubscribe;
  }, [navigation]);

  const carregarStats = async () => {
    try {
      setLoading(true);
      const data = await mesaService.listar();

      let lista = [];
      if (Array.isArray(data)) lista = data;
      else if (data && typeof data === 'object') {
        lista = data.mesas || data.data || Object.values(data);
      }

      const mesasNormalizadas = lista.map((m) => {
        const vendaNum = parseInt(m.venda ?? m.venda_atual ?? 0) || 0;
        return {
          id: m.mesa_codigo || m.mesa_comanda,
          status: vendaNum > 0 ? 'ocupada' : 'livre',
        };
      });

      setStats({
        total: mesasNormalizadas.length,
        ocupadas: mesasNormalizadas.filter((m) => m.status === 'ocupada').length,
        livres: mesasNormalizadas.filter((m) => m.status === 'livre').length,
      });
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarStats();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>
            {tema.icone} Bem-vindo,
          </Text>
          <Text style={styles.userName}>
            {user?.nomeFuncionario || user?.nome || 'Usuário'}
          </Text>
          <Text style={[styles.userRole, { color: tema.cor }]}>
            {tema.nome} • {user?.perfil || 'Garçom'}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>📊 Resumo do Salão</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tema.cor} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: tema.cor }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Mesas</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.danger }]}>
              <Text style={styles.statNumber}>{stats.ocupadas}</Text>
              <Text style={styles.statLabel}>Ocupadas</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
              <Text style={styles.statNumber}>{stats.livres}</Text>
              <Text style={styles.statLabel}>Livres</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
              <Text style={styles.statNumber}>
                {stats.total > 0
                  ? Math.round((stats.ocupadas / stats.total) * 100)
                  : 0}
                %
              </Text>
              <Text style={styles.statLabel}>Ocupação</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Mesas')}
          >
            <Text style={styles.actionIcon}>{tema.icones.mesas}</Text>
            <Text style={styles.actionText}>Mesas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Produtos')}
          >
            <Text style={styles.actionIcon}>{tema.icones.cardapio}</Text>
            <Text style={styles.actionText}>Cardápio</Text>
          </TouchableOpacity>

          {/* ✅ Relatórios só aparece se o recurso estiver ativo */}
          {recursos.visualizarRelatorios && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => alert('Relatórios em desenvolvimento')}
            >
              <Text style={styles.actionIcon}>{tema.icones.dashboard}</Text>
              <Text style={styles.actionText}>Relatórios</Text>
            </TouchableOpacity>
          )}

          {recursos.visualizarHistorico && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Historico')}
              >
                <Text style={styles.actionIcon}>🧾</Text>
                <Text style={styles.actionText}>Histórico</Text>
              </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ConfigEdicao')}
          >
            <Text style={styles.actionIcon}>{tema.icones.config}</Text>
            <Text style={styles.actionText}>Config.</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>🧾 Últimos Pedidos</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Nenhum pedido recente</Text>
          <Text style={styles.emptySubtext}>
            Os pedidos aparecerão aqui quando forem finalizados
          </Text>
        </View>

        <Text style={styles.version}>
          {tema.icone} v1.0.0 • {tema.nome}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  welcome: { fontSize: 14, color: COLORS.textLight },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  userRole: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { padding: 15, paddingBottom: 30 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 10,
  },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#fff',
    marginTop: 5,
    opacity: 0.95,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  actionButton: {
    width: '23%',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: { fontSize: 26, marginBottom: 5 },
  actionText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  emptySubtext: {
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  version: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 11,
    marginTop: 20,
  },
});