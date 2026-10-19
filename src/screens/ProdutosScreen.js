// src/screens/ProdutosScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { produtoService } from '../services/produtoService';
import { pedidoService } from '../services/pedidoService';
import { useTema } from '../hooks/useTema';
import { COLORS } from '../config/colors';
import { useAuth } from '../context/AuthContext';

export default function ProdutosScreen({ route, navigation }) {
  const tema = useTema();
  const { venda, mesa } = route.params || {};

  const [produtos, setProdutos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null); // null = Todos
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [adicionando, setAdicionando] = useState(null);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    navigation.setOptions({
      title: venda ? `Adicionar à Mesa ${mesa?.numero || ''}` : 'Cardápio',
    });
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [produtosData, gruposData] = await Promise.all([
        produtoService.listar(''),
        produtoService.listarGrupos().catch(() => []),
      ]);

      const listaProdutos = Array.isArray(produtosData) ? produtosData : [];
      const listaGrupos = Array.isArray(gruposData) ? gruposData : [];

      console.log('📦 Produtos carregados:', listaProdutos.length);
      console.log('🏷️ Grupos carregados:', listaGrupos.length);
      if (listaProdutos.length > 0) {
        console.log('   Exemplo produto[0]:', {
          descricao: listaProdutos[0].descricao,
          grupo: listaProdutos[0].grupo,
        });
      }
      if (listaGrupos.length > 0) {
        console.log('   Exemplo grupo[0]:', listaGrupos[0]);
      }

      setProdutos(listaProdutos);
      setGrupos(listaGrupos);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Falha ao carregar produtos');
      setProdutos([]);
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filtra produtos por grupo + busca (client-side, rápido)
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      // Filtro por grupo (comparando descrições)
      const grupoOk =
        !grupoSelecionado ||
        (p.grupo || '').toLowerCase().trim() ===
          (grupoSelecionado || '').toLowerCase().trim();

      // Filtro por busca
      const termo = busca.toLowerCase().trim();
      const buscaOk =
        !termo ||
        (p.descricao || '').toLowerCase().includes(termo) ||
        (p.referencia || '').toLowerCase().includes(termo);

      return grupoOk && buscaOk;
    });
  }, [produtos, grupoSelecionado, busca]);

  const handleProdutoPress = (produto) => {
    if (!venda) {
      Alert.alert(
        'Produto',
        `${produto.descricao}\n\nR$ ${parseFloat(produto.vista || 0).toFixed(2)}`
      );
      return;
    }

    setProdutoSelecionado(produto);
    setQuantidade(1);
    setObservacao('');
    setModalVisible(true);
  };

  const handleConfirmarAdicao = async () => {
    if (!produtoSelecionado || !venda) return;

    // Fecha o modal imediatamente
    setModalVisible(false);

    const produtoRef = produtoSelecionado.referencia;
    setAdicionando(produtoRef);

    try {
      const preco = parseFloat(produtoSelecionado.vista) || 0;

      await pedidoService.adicionarItem({
        venda: venda,
        referencia: produtoRef,
        descricao: produtoSelecionado.descricao,
        quantidade: quantidade,
        preco: preco,
        observacao: observacao,
        vendedor: user?.codigoFuncionario ?? 0,  // ← código funcionário
      });
      
      // ✅ Volta automaticamente para o Pedido
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Mesas');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
      Alert.alert(
        'Erro',
        'Falha ao adicionar item: ' + (error.message || 'desconhecido')
      );
    } finally {
      setAdicionando(null);
      setProdutoSelecionado(null);
    }
  };

  const formatarPreco = (valor) => {
    const num = parseFloat(valor) || 0;
    return `R$ ${num.toFixed(2)}`;
  };

  const renderGrupoChip = (nome, id) => {
    const selecionado = grupoSelecionado === id;
    return (
      <TouchableOpacity
        key={String(id)}
        style={[
          styles.grupoChip,
          selecionado && {
            backgroundColor: tema.cor,
            borderColor: tema.cor,
          },
        ]}
        onPress={() => setGrupoSelecionado(selecionado ? null : id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.grupoChipText,
            selecionado && styles.grupoChipTextActive,
          ]}
          numberOfLines={1}
        >
          {nome}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduto = ({ item }) => {
    const isAdicionando = adicionando === item.referencia;
    const preco = parseFloat(item.vista) || 0;

    return (
      <TouchableOpacity
        style={styles.produtoCard}
        onPress={() => handleProdutoPress(item)}
        activeOpacity={0.7}
        disabled={isAdicionando}
      >
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome} numberOfLines={2}>
            {item.descricao}
          </Text>
          <Text style={styles.produtoRef}>
            Ref: {item.referencia}
            {item.grupo ? ` • ${item.grupo}` : ''}
          </Text>
        </View>

        <View style={styles.produtoRight}>
          <Text style={styles.produtoPreco}>{formatarPreco(preco)}</Text>
          {isAdicionando ? (
            <ActivityIndicator
              size="small"
              color={tema.cor}
              style={{ marginTop: 4 }}
            />
          ) : venda ? (
            <View style={[styles.addIcon, { backgroundColor: tema.cor + '15' }]}>
              <Text style={[styles.addIconText, { color: tema.cor }]}>+</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ============ BUSCA ============ */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Buscar produto..."
          placeholderTextColor="#95a5a6"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* ============ CHIPS DE GRUPO ============ */}
      {grupos.length > 0 && (
        <View style={styles.gruposWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gruposContent}
          >
            {renderGrupoChip('Todos', null)}
            {grupos.map((g) => renderGrupoChip(g.descricao, g.descricao))}
          </ScrollView>
        </View>
      )}

      {/* ============ LISTA DE PRODUTOS ============ */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={tema.cor} />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : (
        <FlatList
          data={produtosFiltrados}
          renderItem={renderProduto}
          keyExtractor={(item, index) => `${item.referencia}-${index}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>{tema.icones.produtos}</Text>
              </View>
              <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
              {busca || grupoSelecionado ? (
                <TouchableOpacity
                  onPress={() => {
                    setBusca('');
                    setGrupoSelecionado(null);
                  }}
                >
                  <Text style={[styles.emptyAction, { color: tema.cor }]}>
                    Limpar filtros
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}

      {/* ============ MODAL DE ADICIONAR ============ */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle} numberOfLines={2}>
              {produtoSelecionado?.descricao}
            </Text>
            <Text style={styles.modalSubtitle}>
              {formatarPreco(produtoSelecionado?.vista)} cada
            </Text>

            {/* Quantidade */}
            <View style={styles.quantidadeContainer}>
              <Text style={styles.quantidadeLabel}>Quantidade</Text>
              <View style={styles.quantidadeControls}>
                <TouchableOpacity
                  style={[
                    styles.quantidadeButton,
                    quantidade === 1 && styles.quantidadeButtonDisabled,
                  ]}
                  onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
                  disabled={quantidade === 1}
                >
                  <Text style={styles.quantidadeButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantidadeValor}>{quantidade}</Text>
                <TouchableOpacity
                  style={[
                    styles.quantidadeButton,
                    { backgroundColor: tema.cor },
                  ]}
                  onPress={() => setQuantidade(quantidade + 1)}
                >
                  <Text style={styles.quantidadeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Observação */}
            <Text style={styles.observacaoLabel}>Observação (opcional)</Text>
            <TextInput
              style={styles.observacaoInput}
              placeholder="Ex: sem cebola, ponto da carne..."
              placeholderTextColor="#95a5a6"
              value={observacao}
              onChangeText={setObservacao}
              multiline
            />

            {/* Total */}
            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>Total</Text>
              <Text style={styles.modalTotalValor}>
                {formatarPreco(
                  (parseFloat(produtoSelecionado?.vista) || 0) * quantidade
                )}
              </Text>
            </View>

            {/* Botões */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tema.cor }]}
                onPress={handleConfirmarAdicao}
              >
                <Text style={styles.modalButtonConfirmText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },

  // ============ BUSCA ============
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  searchInput: {
    backgroundColor: '#f0f3f7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    color: '#2c3e50',
  },

  // ============ CHIPS DE GRUPO ============
  gruposWrapper: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  gruposContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  grupoChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f3f7',
    borderWidth: 1,
    borderColor: '#e0e5ec',
    marginRight: 8,
    maxWidth: 180,
  },
  grupoChipText: {
    fontSize: 13,
    color: '#5c6b7a',
    fontWeight: '500',
  },
  grupoChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // ============ LISTA ============
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#95a5a6',
    fontSize: 14,
  },
  list: {
    padding: 12,
  },

  // ============ CARD DE PRODUTO ============
  produtoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  produtoInfo: {
    flex: 1,
    paddingRight: 10,
  },
  produtoNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 20,
  },
  produtoRef: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 3,
    fontStyle: 'italic',
  },
  produtoRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  produtoPreco: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  addIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },

  // ============ ESTADO VAZIO ============
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f3f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  emptyAction: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  // ============ MODAL ============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d0d6dd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    lineHeight: 24,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 4,
    marginBottom: 20,
  },
  quantidadeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eaeef3',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeef3',
  },
  quantidadeLabel: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  quantidadeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantidadeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5c6b7a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidadeButtonDisabled: {
    backgroundColor: '#d0d6dd',
  },
  quantidadeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  quantidadeValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  observacaoLabel: {
    fontSize: 13,
    color: '#5c6b7a',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  observacaoInput: {
    backgroundColor: '#f0f3f7',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeef3',
  },
  modalTotalLabel: {
    fontSize: 14,
    color: '#95a5a6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  modalTotalValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f3f7',
  },
  modalButtonCancelText: {
    color: '#5c6b7a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});