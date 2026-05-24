// src/screens/RegistrosScreen.js
// Pantalla con la lista de registros guardados

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Switch, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { obtenerRegistros, eliminarRegistro, limpiarTodo } from '../utils/storage';

const COLORES_CATEGORIA = {
  Personal: '#FF7A00',
  Trabajo:  '#00CFCF',
  Estudio:  '#FFD000',
  Otro:     '#FF4D6A',
};

export default function RegistrosScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = makeStyles(theme);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const cargar = async () => {
        setCargando(true);
        const data = await obtenerRegistros();
        if (activo) { setRegistros(data); setCargando(false); }
      };
      cargar();
      return () => { activo = false; };
    }, [])
  );

  const cargarRegistros = useCallback(async () => {
    setCargando(true);
    const data = await obtenerRegistros();
    setRegistros(data);
    setCargando(false);
  }, []);

  const confirmarEliminar = useCallback((id, nombre) => {
    Alert.alert('Eliminar registro', `¿Eliminar el registro de "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await eliminarRegistro(id);
          setRegistros(prev => prev.filter(r => r.id !== id));
        } catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  }, []);

  const confirmarLimpiarTodo = useCallback(() => {
    if (registros.length === 0) return;
    Alert.alert(
      'Limpiar todo',
      registros.length === 1
        ? '¿Eliminar el registro?'
        : `¿Eliminar los ${registros.length} registros?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar todo', style: 'destructive', onPress: async () => {
          try { await limpiarTodo(); setRegistros([]); }
          catch { Alert.alert('Error', 'No se pudo limpiar.'); }
        }},
      ]
    );
  }, [registros.length]);

  const formatearFecha = useCallback((iso) => {
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return 'Fecha desconocida'; }
  }, []);

  const renderItem = useCallback(({ item }) => {
    const colorCat = COLORES_CATEGORIA[item.categoria] || '#FF7A00';
    return (
      <View style={s.card}>
        <View style={[s.cardAccent, { backgroundColor: colorCat }]} />
        <View style={s.cardInner}>
          <View style={s.cardHeader}>
            <View style={[s.avatarCircle, { backgroundColor: colorCat }]}>
              <Text style={s.avatarText}>
                {item.nombre ? item.nombre.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardNombre} numberOfLines={1}>{item.nombre}</Text>
              <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>
            </View>
            <View style={[s.tag, { backgroundColor: `${colorCat}22` }]}>
              <Text style={[s.tagText, { color: colorCat }]}>{item.categoria}</Text>
            </View>
          </View>
          <Text style={s.cardMensaje} numberOfLines={2}>{item.mensaje}</Text>
          <View style={s.cardFooter}>
            <Text style={s.cardFecha}>{formatearFecha(item.fechaCreacion)}</Text>
            <View style={s.cardBadges}>
              {!!item.telefono && (
                <View style={[s.badge, { backgroundColor: theme.accentBg }]}>
                  <Text style={[s.badgeText, { color: theme.accent }]}>📱 Tel</Text>
                </View>
              )}
              {!!item.recibirNotificaciones && (
                <View style={[s.badge, { backgroundColor: theme.yellowBg }]}>
                  <Text style={[s.badgeText, { color: theme.yellow }]}>🔔 Notif</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => confirmarEliminar(item.id, item.nombre)}
              style={s.btnEliminar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={item.nombre ? `Eliminar registro de ${item.nombre}` : 'Eliminar registro'}
            >
              <Text style={s.btnEliminarText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, s, confirmarEliminar, formatearFecha]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Registros</Text>
          <Text style={s.subtitulo}>
            {cargando ? 'Cargando...' : `${registros.length} guardado${registros.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={s.headerActions}>
          <View style={s.themeToggle}>
            <Text>{isDark ? '🌙' : '☀️'}</Text>
            <Switch value={isDark} onValueChange={toggleTheme}
              trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
              thumbColor={theme.switchThumb} />
          </View>
          {registros.length > 0 && (
            <TouchableOpacity onPress={confirmarLimpiarTodo} style={s.btnLimpiar}>
              <Text style={s.btnLimpiarText}>Limpiar todo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {registros.length > 0 && (
        <View style={s.leyenda}>
          {Object.entries(COLORES_CATEGORIA).map(([cat, color]) => (
            <View key={cat} style={s.leyendaItem}>
              <View style={[s.leyendaDot, { backgroundColor: color }]} />
              <Text style={s.leyendaText}>{cat}</Text>
            </View>
          ))}
        </View>
      )}

      {registros.length === 0 && !cargando ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>Sin registros aún</Text>
          <Text style={s.emptyDesc}>Los registros que guardes aparecerán aquí.</Text>
          <TouchableOpacity style={s.btnNuevo} onPress={() => navigation.navigate('Formulario')}>
            <Text style={s.btnNuevoText}>Crear primer registro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={registros} renderItem={renderItem} keyExtractor={(item) => item.id}
          contentContainerStyle={s.lista} showsVerticalScrollIndicator={false}
          refreshing={cargando} onRefresh={cargarRegistros}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10} windowSize={10} />
      )}
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 8 },
  titulo: { fontSize: 28, fontWeight: '800', color: theme.primary, letterSpacing: -0.5 },
  subtitulo: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.accentBg, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: theme.accent },
  btnLimpiar: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: theme.error },
  btnLimpiarText: { color: theme.error, fontSize: 12, fontWeight: '700' },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaText: { fontSize: 11, color: theme.textSecondary, fontWeight: '600' },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  card: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 3 },
  cardAccent: { width: 5 },
  cardInner: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: 15, fontWeight: '700', color: theme.text },
  cardEmail: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '700' },
  cardMensaje: { fontSize: 13, color: theme.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8 },
  cardFecha: { fontSize: 11, color: theme.textSecondary, flex: 1 },
  cardBadges: { flexDirection: 'row', gap: 5, marginRight: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  btnEliminar: { width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.btnEliminarBg, alignItems: 'center', justifyContent: 'center' },
  btnEliminarText: { color: theme.error, fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnNuevo: { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  btnNuevoText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
