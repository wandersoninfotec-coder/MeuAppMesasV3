// src/screens/LoginScreen.js
import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { useTema } from '../hooks/useTema';
import { COLORS } from '../config/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const tema = useTema();

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configInfo, setConfigInfo] = useState(null);

  // Carrega info do servidor para exibir no rodapé
  React.useEffect(() => {
    configService.carregar().then((cfg) => {
      if (cfg) setConfigInfo(cfg);
    });
  }, []);

  const handleLogin = async () => {
    if (!usuario || !senha) {
      Alert.alert('Atenção', 'Preencha usuário e senha');
      return;
    }

    setLoading(true);

    try {
      const resultado = await authService.login(usuario, senha, 1);

      if (resultado.success) {
        await login(resultado.token, resultado.user);
      } else {
        Alert.alert('Erro', resultado.error || 'Falha ao fazer login');
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Erro inesperado: ' + (error.message || 'desconhecido')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIrParaConfig = () => {
    navigation.navigate('Config');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ============ LOGO / ÍCONE DO TEMA ============ */}
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: tema.cor + '15' },
            ]}
          >
            <Text style={styles.logoIcone}>{tema.icone}</Text>
          </View>
          <Text style={styles.titulo}>WDS Food</Text>
          <Text style={styles.subtitulo}>{tema.nome}</Text>
        </View>

        {/* ============ CARD DE LOGIN ============ */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Entrar</Text>
          <Text style={styles.cardSubtitulo}>
            Informe suas credenciais para continuar
          </Text>

          {/* Campo Usuário */}
          <Text style={styles.label}>Usuário</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu usuário"
              placeholderTextColor="#95a5a6"
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* Campo Senha */}
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#95a5a6"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              editable={!loading}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>
                {mostrarSenha ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[
              styles.buttonEntrar,
              { backgroundColor: tema.cor },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonEntrarText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ============ RODAPÉ COM INFO DO SERVIDOR ============ */}
        <View style={styles.footer}>
          {configInfo && (
            <TouchableOpacity
              style={styles.servidorContainer}
              onPress={handleIrParaConfig}
              activeOpacity={0.7}
            >
              <Text style={styles.servidorLabel}>
                {configInfo.empresaNome || 'Empresa conectada'}
              </Text>
              <Text style={styles.servidorInfo}>
                {configInfo.ip}
                {configInfo.porta && configInfo.porta !== '80'
                  ? `:${configInfo.porta}`
                  : ''}
                {configInfo.empresaNome ? '' : ` • Empresa ${configInfo.empresa}`}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'center',
  },

  // ============ HEADER ============
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcone: {
    fontSize: 44,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'center',
  },

  // ============ CARD DE LOGIN ============
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  cardSubtitulo: {
    fontSize: 13,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  // Campos
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5c6b7a',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f3f7',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e5ec',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2c3e50',
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },

  // Botão Entrar
  buttonEntrar: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonEntrarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // ============ RODAPÉ ============
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  servidorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeef3',
    marginBottom: 16,
  },
  servidorLabel: {
    fontSize: 11,
    color: '#95a5a6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  servidorInfo: {
    fontSize: 13,
    color: '#2c3e50',
    marginTop: 3,
    fontWeight: '500',
  },
  version: {
    fontSize: 11,
    color: '#bdc3c7',
  },
});