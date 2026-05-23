// src/screens/RegistrosScreen.js
// Pantalla que muestra todos los registros guardados en AsyncStorage.
//
// Conceptos de React Native usados:
//   - FlatList: renderizado eficiente de listas largas (solo renderiza lo visible)
//   - useFocusEffect: hook de React Navigation que ejecuta código al enfocar pantalla
//   - useCallback: requerido por useFocusEffect para evitar loops infinitos
//   - Pull-to-refresh: deslizar hacia abajo para recargar datos
//   - Alert: diálogos nativos de confirmación

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { obtenerRegistros, eliminarRegistro, limpiarTodo } from '../utils/storage';

export default function RegistrosScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = makeStyles(theme);

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ─── Carga de datos ─────────────────────────────────────────────────────────
  /**
   * useFocusEffect: se ejecuta cada vez que esta tab recibe foco.
   * Esto asegura que al volver desde FormScreen, la lista se actualice.
   * useCallback es OBLIGATORIO aquí; sin él, useFocusEffect crea un loop infinito.
   */
  useFocusEffect(
    useCallback(() => {
      let activo = true; // Flag para evitar actualizar state si el componente se desmontó

      const cargar = async () => {
        setCargando(true);
        const data = await obtenerRegistros();
        if (activo) {
          setRegistros(data);
          setCargando(false);
        }
      };

      cargar();

      // Cleanup: se ejecuta cuando la pantalla pierde el foco
      return () => { activo = false; };
    }, [])
  );

  // Función pública para pull-to-refresh (también usada internamente)
  const cargarRegistros = useCallback(async () => {
    setCargando(true);
    const data = await obtenerRegistros();
    setRegistros(data);
    setCargando(false);
  }, []);

  // ─── Acciones ───────────────────────────────────────────────────────────────
  const confirmarEliminar = useCallback((id, nombre) => {
    Alert.alert(
      'Eliminar registro',
      `¿Eliminar el registro de "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarRegistro(id);
              // Actualizar lista localmente (más rápido que recargar todo)
              setRegistros(prev => prev.filter(r => r.id !== id));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  }, []);

  const confirmarLimpiarTodo = useCallback(() => {
    if (registros.length === 0) return;
    Alert.alert(
      'Limpiar todo',
      `¿Eliminar los ${registros.length} registro${registros.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await limpiarTodo();
              setRegistros([]);
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar el almacenamiento.');
            }
          },
        },
      ]
    );
  }, [registros.length]);

  // ─── Helpers de UI ──────────────────────────────────────────────────────────
  /**
   * Formatea una fecha ISO a formato legible en español de Chile.
   * Usa try/catch por si la fecha guardada está malformada.
   */
  const formatearFecha = useCallback((iso) => {
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha desconocida';
    }
  }, []);

  // ─── Render de ítem ─────────────────────────────────────────────────────────
  /**
   * renderItem está fuera del JSX principal (no es inline) para que FlatList
   * pueda optimizar el re-render: solo actualiza el ítem que cambió.
   * useCallback evita que se recree en cada render del componente padre.
   */
  const renderItem = useCallback(({ item }) => (
    <View style={s.card}>
      {/* Encabezado: avatar, nombre, email, categoría */}
      <View style={s.cardHeader}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>
            {item.nombre ? item.nombre.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardNombre} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={s.cardEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <View style={[s.tag, { backgroundColor: theme.tagBg }]}>
          <Text style={[s.tagText, { color: theme.tagText }]}>
            {item.categoria}
          </Text>
        </View>
      </View>

      {/* Mensaje */}
      <Text style={s.cardMensaje} numberOfLines={2}>
        {item.mensaje}
      </Text>

      {/* Footer: fecha, badges, botón eliminar */}
      <View style={s.cardFooter}>
        <Text style={s.cardFecha}>{formatearFecha(item.fechaCreacion)}</Text>
        <View style={s.cardBadges}>
          {!!item.telefono && (
            <View style={s.badge}>
              <Text style={s.badgeText}>📱 Tel</Text>
            </View>
          )}
          {!!item.recibirNotificaciones && (
            <View style={s.badge}>
              <Text style={s.badgeText}>🔔 Notif</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => confirmarEliminar(item.id, item.nombre)}
          style={s.btnEliminar}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar registro de ${item.nombre}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.btnEliminarText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [theme, s, confirmarEliminar, formatearFecha]);

  // ─── Separador de lista ─────────────────────────────────────────────────────
  // Extraído como componente para no crear una función inline en cada render
  const ItemSeparator = useCallback(() => <View style={{ height: 0 }} />, []);

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Registros</Text>
          <Text style={s.subtitulo}>
            {cargando
              ? 'Cargando...'
              : `${registros.length} guardado${registros.length !== 1 ? 's' : ''}`
            }
          </Text>
        </View>
        <View style={s.headerActions}>
          {/* Toggle tema */}
          <View style={s.themeToggle}>
            <Text>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.switchTrackFalse,
                true: theme.switchTrackTrue,
              }}
              thumbColor={theme.switchThumb}
              accessibilityLabel={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
            />
          </View>
          {/* Botón limpiar todo (solo visible si hay registros) */}
          {registros.length > 0 && (
            <TouchableOpacity
              onPress={confirmarLimpiarTodo}
              style={s.btnLimpiar}
              accessibilityRole="button"
              accessibilityLabel="Eliminar todos los registros"
            >
              <Text style={s.btnLimpiarText}>Limpiar todo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista o estado vacío */}
      {registros.length === 0 && !cargando ? (
        // Estado vacío: guía al usuario a crear su primer registro
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>Sin registros aún</Text>
          <Text style={s.emptyDesc}>
            Los registros que guardes en el formulario aparecerán aquí.
          </Text>
          <TouchableOpacity
            style={s.btnNuevo}
            onPress={() => navigation.navigate('Formulario')}
            accessibilityRole="button"
          >
            <Text style={s.btnNuevoText}>Crear primer registro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /**
         * FlatList es más eficiente que ScrollView para listas largas:
         * solo renderiza los ítems visibles en pantalla (virtualización).
         * - refreshing + onRefresh: habilita pull-to-refresh nativo
         * - ItemSeparatorComponent: separador entre ítems
         * - ListEmptyComponent: qué mostrar mientras carga (spinner interno de refresh)
         */
        <FlatList
          data={registros}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          refreshing={cargando}
          onRefresh={cargarRegistros}
          ItemSeparatorComponent={ItemSeparator}
          // Optimizaciones de performance para FlatList
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 56 : 20,
      paddingBottom: 12,
    },
    titulo: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
    },
    subtitulo: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    headerActions: {
      alignItems: 'flex-end',
      gap: 8,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    btnLimpiar: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.error,
    },
    btnLimpiarText: {
      color: theme.error,
      fontSize: 12,
      fontWeight: '600',
    },
    lista: {
      padding: 16,
      paddingTop: 8,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    cardInfo: {
      flex: 1,
    },
    cardNombre: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    cardEmail: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '700',
    },
    cardMensaje: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
      marginBottom: 10,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 10,
    },
    cardFecha: {
      fontSize: 11,
      color: theme.textSecondary,
      flex: 1,
    },
    cardBadges: {
      flexDirection: 'row',
      gap: 6,
      marginRight: 10,
    },
    badge: {
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    btnEliminar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.btnEliminarBg, // Color sólido del tema (no hex dinámico)
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnEliminarText: {
      color: theme.error,
      fontSize: 12,
      fontWeight: '700',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    emptyDesc: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    btnNuevo: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 14,
    },
    btnNuevoText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
