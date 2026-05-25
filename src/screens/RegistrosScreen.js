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
    Alert.alert('Eliminar', `¿Eliminar el registro de "${nombre}"?`, [
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
    Alert.alert('Limpiar todo', `¿Eliminar los ${registros.length} registros?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar todo', style: 'destructive', onPress: async () => {
        try { await limpiarTodo(); setRegistros([]); }
        catch { Alert.alert('Error', 'No se pudo limpiar.'); }
      }},
    ]);
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
          <View style={s.cardTop}>
            <Text style={s.cardNombre} numberOfLines={1}>{item.nombre}</Text>
            <TouchableOpacity
              onPress={() => confirmarEliminar(item.id, item.nombre)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.btnEliminarText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={s.cardMensaje} numberOfLines={2}>{item.mensaje}</Text>
          <View style={s.cardFooter}>
            <View style={[s.catPill, { borderColor: colorCat }]}>
              <Text style={[s.catPillText, { color: colorCat }]}>{item.categoria}</Text>
            </View>
            {!!item.telefono && (
              <View style={[s.badge, { backgroundColor: theme.accentBg }]}>
                <Text style={[s.badgeText, { color: theme.accent }]}>Tel</Text>
              </View>
            )}
            {!!item.recibirNotificaciones && (
              <View style={[s.badge, { backgroundColor: theme.yellowBg }]}>
                <Text style={[s.badgeText, { color: theme.yellow }]}>Notif</Text>
              </View>
            )}
            <Text style={s.cardFecha}>{formatearFecha(item.fechaCreacion)}</Text>
          </View>
        </View>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, s, confirmarEliminar, formatearFecha]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Registros</Text>
          <Text style={s.subtitulo}>
            {cargando ? 'Cargando...' : `${registros.length} guardado${registros.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.themeToggle}>
            <Text style={s.themeEmoji}>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
              thumbColor={theme.switchThumb}
            />
          </View>
          {registros.length > 0 && (
            <TouchableOpacity onPress={confirmarLimpiarTodo}>
              <Text style={s.btnLimpiarText}>Limpiar todo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.separador} />

      {registros.length === 0 && !cargando ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>○</Text>
          <Text style={s.emptyTitle}>Sin registros</Text>
          <Text style={s.emptyDesc}>Los registros que guardes aparecerán aquí.</Text>
          <TouchableOpacity style={s.btnNuevo} onPress={() => navigation.navigate('Formulario')}>
            <Text style={s.btnNuevoText}>Crear registro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={registros}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          refreshing={cargando}
          onRefresh={cargarRegistros}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={10}
          ItemSeparatorComponent={() => <View style={s.itemSeparador} />}
        />
      )}
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 16,
    backgroundColor: theme.background,
  },
  titulo: { fontSize: 34, fontWeight: '800', color: theme.primary, letterSpacing: -1 },
  subtitulo: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeEmoji: { fontSize: 18 },
  btnLimpiarText: { color: theme.error, fontSize: 12, fontWeight: '600' },
  separador: { height: 1, backgroundColor: theme.border, marginHorizontal: 28 },
  itemSeparador: { height: 1, backgroundColor: theme.border, marginHorizontal: 28 },
  lista: { paddingBottom: 32 },
  card: { flexDirection: 'row', backgroundColor: theme.background },
  cardAccent: { width: 3 },
  cardInner: { flex: 1, paddingVertical: 16, paddingHorizontal: 20 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardNombre: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1, marginRight: 8 },
  btnEliminarText: { color: theme.textSecondary, fontSize: 14, fontWeight: '300' },
  cardEmail: { fontSize: 12, color: theme.textSecondary, marginBottom: 6 },
  cardMensaje: { fontSize: 13, color: theme.textSecondary, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  catPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 11, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardFecha: { fontSize: 11, color: theme.textSecondary, marginLeft: 'auto' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, color: theme.border, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnNuevo: {
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  btnNuevoText: { color: theme.primary, fontWeight: '700', fontSize: 14 },
});
