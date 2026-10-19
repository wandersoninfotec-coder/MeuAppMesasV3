// src/screens/ConfigScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { configService, RECURSOS_PADRAO } from '../services/configService';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/colors';
import { LISTA_TEMAS, RAMO_PADRAO } from '../config/themes';

export default function ConfigScreen({
                                    route,
                                    navigation,
                                    modo: modoProp,
                                    onConfigurado: onConfiguradoProp,
                                    onResetarConfig: onResetarConfigProp,
                                  }) {
  const { user, logout } = useAuth();

  // Aceita tanto props (quando vem do AppNavigator children)
  // quanto route.params (quando vem do initialParams)
  const modo = modoProp || route.params?.modo || 'inicial';
  const onConfigurado = onConfiguradoProp || route.params?.onConfigurado;
  const onResetarConfig =
    onResetarConfigProp || route.params?.onResetarConfig;

  const [ip, setIp] = useState('');
  const [porta, setPorta] = useState('80');
  const [caminhoApi, setCaminhoApi] = useState('app_mesas_api');
  const [empresa, setEmpresa] = useState('1');
  const [empresaNome, setEmpresaNome] = useState('');
  const [ramo, setRamo] = useState(RAMO_PADRAO);
  const [recursos, setRecursos] = useState({ ...RECURSOS_PADRAO });
  const [testando, setTestando] = useState(false);
  const [testado, setTestado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarConfigAtual();
  }, []);

  const carregarConfigAtual = async () => {
    try {
      const config = await configService.carregar();
      if (config) {
        setIp(config.ip || '');
        setPorta(config.porta || '80');
        setCaminhoApi(config.caminhoApi || 'app_mesas_api');
        setEmpresa(String(config.empresa || '1'));
        setEmpresaNome(config.empresaNome || '');
        setRamo(config.ramo || RAMO_PADRAO);
        setRecursos({ ...RECURSOS_PADRAO, ...(config.recursos || {}) });
        if (modo === 'edicao') setTestado(true);
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    } finally {
      setCarregando(false);
    }
  };

  const toggleRecurso = (nome) => {
    setRecursos((prev) => ({ ...prev, [nome]: !prev[nome] }));
  };

  const handleTestar = async () => {
    if (!ip) {
      Alert.alert('Atenção', 'Preencha o IP do servidor');
      return;
    }

    setTestando(true);
    setTestado(false);

    try {
      const resultado = await configService.testarConexao(ip, porta, caminhoApi);

      if (!resultado.sucesso) {
        Alert.alert('Erro', resultado.erro);
        return;
      }

      // Busca nome da empresa
      let nomeEmpresa = '';
      if (empresa) {
        const dadosEmpresa = await configService.buscarDadosEmpresa(
          ip,
          porta,
          caminhoApi,
          empresa
        );

        if (dadosEmpresa.sucesso && dadosEmpresa.nome) {
          nomeEmpresa = dadosEmpresa.nome;
          setEmpresaNome(nomeEmpresa);
        }
      }

      setTestado(true);

      const mensagem = nomeEmpresa
        ? `Conectado em:\n${resultado.url}\n\nEmpresa: ${nomeEmpresa}`
        : `Conectado em:\n${resultado.url}`;

      Alert.alert('Sucesso!', mensagem);
    } catch (error) {
      Alert.alert('Erro', 'Erro: ' + (error.message || 'desconhecido'));
    } finally {
      setTestando(false);
    }
  };

  const handleSalvar = async () => {
    if (!ip || !empresa) {
      Alert.alert('Atenção', 'Preencha IP e empresa');
      return;
    }
    if (!testado) {
      Alert.alert('Teste a conexão', 'Clique em "Testar Conexão" antes de salvar');
      return;
    }

    const portaStr = porta && porta !== '80' ? `:${porta}` : '';
    const baseURL = `http://${ip}${portaStr}/${caminhoApi}`;

    const config = {
      ip,
      porta,
      caminhoApi,
      empresa: parseInt(empresa),
      empresaNome,
      ramo,
      recursos,
      baseURL,
    };

    const sucesso = await configService.salvar(config);
    if (!sucesso) {
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
      return;
    }

    // ============ MODO INICIAL ============
    if (modo === 'inicial') {
      Alert.alert('Configuração salva!', 'Agora você pode fazer login.', [
        {
          text: 'OK',
          onPress: () => {
            if (onConfigurado) onConfigurado();
          },
        },
      ]);
      return;
    }

    // ============ MODO EDIÇÃO ============
    Alert.alert('Configurações salvas!', 'As alterações foram aplicadas.', [
      {
        text: 'OK',
        onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
          // Se não pode voltar, não faz nada (o AppNavigator vai recriar)
        },
      },
    ]);
  };

  const handleTrocarServidor = () => {
    Alert.alert(
      'Trocar Servidor',
      'Isso vai apagar a configuração atual e desconectar você. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          style: 'destructive',
          onPress: async () => {
            // 1. Limpa config do storage
            await configService.limpar();
            // 2. Faz logout (limpa sessão + user)
            await logout();
            // 3. ⚠️ AVISA O APP que precisa reconfigurar
            //    Isso muda precisaConfigurar = true e o AppNavigator
            //    recria o container mostrando ConfigInicial
            if (onResetarConfig) {
              onResetarConfig();
            }
          },
        },
      ]
    );
  };

  const handleSair = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>⚙️</Text>
          <Text style={styles.title}>
            {modo === 'inicial' ? 'Configuração Inicial' : 'Configurações'}
          </Text>
          <Text style={styles.subtitle}>
            {modo === 'inicial'
              ? 'Informe os dados do seu servidor'
              : `Conectado como ${user?.nome || ''}`}
          </Text>
        </View>

        <View style={styles.form}>
          {/* SERVIDOR */}
          <Text style={styles.sectionTitle}>🌐 Servidor</Text>

          <Text style={styles.label}>IP ou domínio *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 192.168.100.67"
            value={ip}
            onChangeText={setIp}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Porta (padrão: 80)</Text>
          <TextInput
            style={styles.input}
            placeholder="80"
            value={porta}
            onChangeText={setPorta}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Caminho da API</Text>
          <TextInput
            style={styles.input}
            placeholder="app_mesas_api"
            value={caminhoApi}
            onChangeText={setCaminhoApi}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* EMPRESA */}
          <Text style={styles.sectionTitle}>🏢 Empresa</Text>
          <Text style={styles.label}>Código da empresa *</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            value={empresa}
            onChangeText={setEmpresa}
            keyboardType="numeric"
          />

          {empresaNome ? (
            <View style={styles.empresaNomeBox}>
              <Text style={styles.empresaNomeLabel}>Empresa detectada:</Text>
              <Text style={styles.empresaNomeTexto}>{empresaNome}</Text>
            </View>
          ) : null}

          {/* TEMA */}
          <Text style={styles.sectionTitle}>🎨 Tipo de Estabelecimento</Text>
          <Text style={styles.helpText}>
            Escolha o ramo para personalizar os ícones
          </Text>

          <View style={styles.temasGrid}>
            {LISTA_TEMAS.map((t) => {
              const selecionado = ramo === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.temaCard,
                    selecionado && {
                      borderColor: t.cor,
                      borderWidth: 2,
                      backgroundColor: t.cor + '15',
                    },
                  ]}
                  onPress={() => setRamo(t.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.temaIcone}>{t.icone}</Text>
                  <Text
                    style={[
                      styles.temaNome,
                      selecionado && { color: t.cor, fontWeight: 'bold' },
                    ]}
                  >
                    {t.nome}
                  </Text>
                  {selecionado && (
                    <View
                      style={[styles.temaCheck, { backgroundColor: t.cor }]}
                    >
                      <Text style={styles.temaCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RECURSOS */}
          <Text style={styles.sectionTitle}>🧩 Recursos do App</Text>
          <Text style={styles.helpText}>
            Ative ou desative funcionalidades
          </Text>

          <View style={styles.recursoItem}>
            <View style={styles.recursoInfo}>
              <Text style={styles.recursoNome}>💰 Finalizar Venda</Text>
              <Text style={styles.recursoDescricao}>
                Permite fechar a conta da mesa pelo app
              </Text>
            </View>
            <Switch
              value={recursos.finalizarVenda}
              onValueChange={() => toggleRecurso('finalizarVenda')}
              trackColor={{ false: '#d0d6dd', true: COLORS.success + '80' }}
              thumbColor={
                recursos.finalizarVenda ? COLORS.success : '#f0f0f0'
              }
            />
          </View>

          <View style={styles.recursoItem}>
            <View style={styles.recursoInfo}>
              <Text style={styles.recursoNome}>📊 Relatórios</Text>
              <Text style={styles.recursoDescricao}>
                Habilita o botão de relatórios no Dashboard
              </Text>
            </View>
            <Switch
              value={recursos.visualizarRelatorios}
              onValueChange={() => toggleRecurso('visualizarRelatorios')}
              trackColor={{ false: '#d0d6dd', true: COLORS.primary + '80' }}
              thumbColor={
                recursos.visualizarRelatorios ? COLORS.primary : '#f0f0f0'
              }
            />
          </View>

          <View style={styles.recursoItem}>
            <View style={styles.recursoInfo}>
              <Text style={styles.recursoNome}>🧾 Histórico</Text>
              <Text style={styles.recursoDescricao}>
                Habilita a tela de histórico no Dashboard
              </Text>
            </View>
            <Switch
              value={recursos.visualizarHistorico}
              onValueChange={() => toggleRecurso('visualizarHistorico')}
              trackColor={{ false: '#d0d6dd', true: COLORS.primary + '80' }}
              thumbColor={
                recursos.visualizarHistorico ? COLORS.primary : '#f0f0f0'
              }
            />
          </View>

          {/* PREVIEW URL */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>URL final:</Text>
            <Text style={styles.previewUrl}>
              http://{ip || '...'}
              {porta && porta !== '80' ? `:${porta}` : ''}
              /{caminhoApi || '...'}
            </Text>
          </View>

          {/* BOTÕES */}
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={handleTestar}
            disabled={testando}
          >
            {testando ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.buttonOutlineText}>🔍 Testar Conexão</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !testado && styles.buttonDisabled]}
            onPress={handleSalvar}
            disabled={!testado}
          >
            <Text style={styles.buttonText}>💾 Salvar</Text>
          </TouchableOpacity>

          {modo === 'edicao' && (
            <>
              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.button, styles.buttonWarning]}
                onPress={handleTrocarServidor}
              >
                <Text style={styles.buttonText}>🔄 Trocar Servidor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleSair}
              >
                <Text style={styles.buttonText}>🚪 Sair da Conta</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  content: { padding: 25, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 25 },
  icon: { fontSize: 50, marginBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 5,
  },
  form: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
    color: COLORS.text,
  },
  empresaNomeBox: {
    backgroundColor: '#EAF9F1',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
  },
  empresaNomeLabel: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empresaNomeTexto: {
    fontSize: 15,
    color: '#27AE60',
    fontWeight: 'bold',
    marginTop: 2,
  },
  temasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  temaCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  temaIcone: { fontSize: 32, marginBottom: 5 },
  temaNome: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },
  temaCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temaCheckText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  recursoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recursoInfo: { flex: 1, paddingRight: 10 },
  recursoNome: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  recursoDescricao: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  previewContainer: {
    backgroundColor: '#eef2f7',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  previewLabel: { fontSize: 11, color: COLORS.textLight },
  previewUrl: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 25,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonOutlineText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonWarning: { backgroundColor: '#f39c12' },
  buttonDanger: { backgroundColor: '#e74c3c' },
  version: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 20,
  },
});