// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/colors';

// Telas
import ConfigScreen from '../screens/ConfigScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MesasScreen from '../screens/MesasScreen';
import PedidoScreen from '../screens/PedidoScreen';
import ProdutosScreen from '../screens/ProdutosScreen';
import ComandaScreen from '../screens/ComandaScreen';
import HistoricoScreen from '../screens/HistoricoScreen';
import DetalhesPedidoScreen from '../screens/DetalhesPedidoScreen';

const Stack = createStackNavigator();

export default function AppNavigator({
  precisaConfigurar,
  onConfigurado,
  onResetarConfig,
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // 3 fluxos diferentes = 3 chaves diferentes = 3 containers diferentes
  let flowKey = 'config';
  if (!precisaConfigurar && user) {
    flowKey = 'app';
  } else if (!precisaConfigurar && !user) {
    flowKey = 'auth';
  }

  return (
    <NavigationContainer key={flowKey}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {precisaConfigurar ? (
          /* ============ FLUXO 1: SEM CONFIGURAÇÃO INICIAL ============ */
          <Stack.Screen
            name="ConfigInicial"
            options={{ headerShown: false }}
          >
            {(props) => (
              <ConfigScreen
                {...props}
                modo="inicial"
                onConfigurado={onConfigurado}
              />
            )}
          </Stack.Screen>
        ) : !user ? (
          /* ============ FLUXO 2: SEM LOGIN ============ */
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          /* ============ FLUXO 3: LOGADO ============ */
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ title: 'Início', headerLeft: null }}
            />
            <Stack.Screen
              name="Mesas"
              component={MesasScreen}
              options={{ title: 'Mesas' }}
            />
            <Stack.Screen
              name="Pedido"
              component={PedidoScreen}
              options={{ title: 'Pedido' }}
            />
            <Stack.Screen
              name="Produtos"
              component={ProdutosScreen}
              options={{ title: 'Cardápio' }}
            />
            <Stack.Screen
              name="Comanda"
              component={ComandaScreen}
              options={{ title: 'Comanda' }}
            />
            <Stack.Screen
              name="Historico"
              component={HistoricoScreen}
              options={{ title: 'Histórico' }}
            />
            <Stack.Screen
              name="DetalhesPedido"
              component={DetalhesPedidoScreen}
              options={{ title: 'Detalhes do Pedido' }}
            />
            <Stack.Screen
              name="ConfigEdicao"
              options={{ title: 'Configurações' }}
            >
              {(props) => (
                <ConfigScreen
                  {...props}
                  modo="edicao"
                  onResetarConfig={onResetarConfig}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textLight,
  },
});