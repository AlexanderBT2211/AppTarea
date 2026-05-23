// App.js
// Punto de entrada de la aplicación.
// Configura el ThemeProvider global y la navegación por tabs.

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import FormScreen from './src/screens/FormScreen';
import RegistrosScreen from './src/screens/RegistrosScreen';

const Tab = createBottomTabNavigator();

// ─── Ícono de tab con emoji ───────────────────────────────────────────────────
// Componente simple declarado FUERA del render para evitar re-creaciones.
// El require() inline en el original causaba un re-render innecesario en cada tick.
function TabIcon({ emoji }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

// ─── Navegador ────────────────────────────────────────────────────────────────
// Separado de App() para poder consumir useTheme() dentro del ThemeProvider.
function AppNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          // El tabBar respeta el tema activo en tiempo real
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Formulario"
          component={FormScreen}
          options={{
            tabBarLabel: 'Formulario',
            // La función de ícono recibe (color, size) desde React Navigation
            tabBarIcon: () => <TabIcon emoji="📝" />,
          }}
        />
        <Tab.Screen
          name="Registros"
          component={RegistrosScreen}
          options={{
            tabBarLabel: 'Registros',
            tabBarIcon: () => <TabIcon emoji="📋" />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─── Raíz de la app ───────────────────────────────────────────────────────────
// SafeAreaProvider es necesario para react-native-safe-area-context (dependencia
// de @react-navigation/bottom-tabs). Sin él, la tab bar puede quedar bajo el
// home indicator en iPhones con notch.
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
