// App.js
// Descripción: Punto de entrada de la aplicación.
//              Configura el tema global y la navegación entre pantallas.

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import FormScreen from './src/screens/FormScreen';
import RegistrosScreen from './src/screens/RegistrosScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

function AppNavigator() {
  const { theme } = useTheme();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Formulario"
          component={FormScreen}
          options={{ tabBarLabel: 'Formulario', tabBarIcon: () => <TabIcon emoji="📝" /> }}
        />
        <Tab.Screen
          name="Registros"
          component={RegistrosScreen}
          options={{ tabBarLabel: 'Registros', tabBarIcon: () => <TabIcon emoji="📋" /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}