// App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { configService } from './src/services/configService';
import { COLORS } from './src/config/colors';

export default function App() {
  const [precisaConfigurar, setPrecisaConfigurar] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarConfiguracao();
  }, []);

  const verificarConfiguracao = async () => {
    try {
      const estaConfigurado = await configService.estaConfigurado();
      setPrecisaConfigurar(!estaConfigurado);
      console.log('🔵 App: configurado =', estaConfigurado);
    } catch (error) {
      console.error('Erro ao verificar config:', error);
      setPrecisaConfigurar(true);
    } finally {
      setCarregando(false);
    }
  };

  const handleConfigurado = () => {
    console.log('🟢 Configuração inicial salva!');
    setPrecisaConfigurar(false);
  };

  // Callback quando troca o servidor
  const handleResetarConfig = () => {
    console.log('🔄 Servidor resetado. Voltando para config inicial.');
    setPrecisaConfigurar(true);
  };

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator
            precisaConfigurar={precisaConfigurar}
            onConfigurado={handleConfigurado}
            onResetarConfig={handleResetarConfig}
          />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
});