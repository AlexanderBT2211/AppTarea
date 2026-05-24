// src/screens/FormScreen.js
// Pantalla con el formulario de registro

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { guardarRegistro } from '../utils/storage';

const CATEGORIAS = ['Personal', 'Trabajo', 'Estudio', 'Otro'];
const COLORES_CATEGORIA = ['#FF7A00', '#00CFCF', '#FFD000', '#FF4D6A'];
const FORM_INICIAL = {
  nombre: '', email: '', telefono: '',
  mensaje: '', categoria: 'Personal', recibirNotificaciones: false,
};

const validarForm = (form) => {
  const errores = {};
  if (!form.nombre.trim()) errores.nombre = 'El nombre es requerido';
  else if (form.nombre.trim().length < 2) errores.nombre = 'Mínimo 2 caracteres';
  if (!form.email.trim()) errores.email = 'El correo es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errores.email = 'Correo inválido';
  if (form.telefono.trim() && !/^\+?[\d\s\-()]{7,15}$/.test(form.telefono.trim()))
    errores.telefono = 'Formato inválido (ej: +56 9 1234 5678)';
  if (!form.mensaje.trim()) errores.mensaje = 'El mensaje es requerido';
  else if (form.mensaje.trim().length < 5) errores.mensaje = 'Mínimo 5 caracteres';
  return errores;
};

function InputField({ label, error, theme, style, ...props }) {
  const s = makeStyles(theme);
  return (
    <View style={s.fieldGroup}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, style, error ? s.inputError : null]}
        placeholderTextColor={theme.placeholder}
        autoCorrect={false}
        {...props}
      />
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

export default function FormScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = makeStyles(theme);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const actualizar = useCallback((campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => {
      if (!prev[campo]) return prev;
      const { [campo]: _, ...resto } = prev;
      return resto;
    });
  }, []);

  const handleGuardar = async () => {
    const nuevosErrores = validarForm(form);
    if (Object.keys(nuevosErrores).length > 0) { setErrores(nuevosErrores); return; }
    setGuardando(true);
    try {
      await guardarRegistro(form);
      Alert.alert('¡Guardado! ✓', 'El registro se almacenó en tu dispositivo.', [
        { text: 'Ver registros', onPress: () => navigation.navigate('Registros') },
        { text: 'Nuevo registro', style: 'cancel', onPress: () => { setForm(FORM_INICIAL); setErrores({}); } },
      ]);
    } catch (error) {
      Alert.alert('Error al guardar', 'Verifica el espacio disponible en tu dispositivo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <View style={s.headerTexto}>
            <Text style={s.titulo}>Nuevo Registro</Text>
            <Text style={s.subtitulo}>Los campos con * son obligatorios</Text>
          </View>
          <View style={s.themeToggle}>
            <Text>{isDark ? '🌙' : '☀️'}</Text>
            <Switch value={isDark} onValueChange={toggleTheme}
              accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
              thumbColor={theme.switchThumb} />
          </View>
        </View>

        <View style={s.accentBand}>
          <Text style={s.accentBandText}>📋  Formulario de Contacto</Text>
        </View>

        <View style={s.card}>
          <InputField label="Nombre completo *" placeholder="Ej: Juan Pérez"
            value={form.nombre} onChangeText={(v) => actualizar('nombre', v)}
            error={errores.nombre} theme={theme} autoCapitalize="words" maxLength={60} />

          <InputField label="Correo electrónico *" placeholder="correo@ejemplo.com"
            value={form.email} onChangeText={(v) => actualizar('email', v.toLowerCase())}
            error={errores.email} theme={theme} keyboardType="email-address"
            autoCapitalize="none" maxLength={100} />

          <InputField label="Teléfono (opcional)" placeholder="+56 9 1234 5678"
            value={form.telefono} onChangeText={(v) => actualizar('telefono', v)}
            error={errores.telefono} theme={theme} keyboardType="phone-pad" maxLength={20} />

          <View style={s.fieldGroup}>
            <Text style={s.label}>Categoría</Text>
            <View style={s.categorias}>
              {CATEGORIAS.map((cat, index) => {
                const isActive = form.categoria === cat;
                const colorCat = COLORES_CATEGORIA[index];
                return (
                  <TouchableOpacity key={cat}
                    style={[s.catBtn, isActive && { backgroundColor: colorCat, borderColor: colorCat }]}
                    onPress={() => actualizar('categoria', cat)} activeOpacity={0.7}>
                    <Text style={[s.catText, isActive && s.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Mensaje *</Text>
            <TextInput
              style={[s.input, s.textArea, errores.mensaje ? s.inputError : null]}
              placeholder="Escribe tu mensaje aquí..." placeholderTextColor={theme.placeholder}
              value={form.mensaje} onChangeText={(v) => actualizar('mensaje', v)}
              multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
            <View style={s.mensajeFooter}>
              {!!errores.mensaje && <Text style={s.errorText}>{errores.mensaje}</Text>}
              <Text style={[s.charCount, { marginLeft: errores.mensaje ? 0 : 'auto' }]}>
                {form.mensaje.length}/500</Text>
            </View>
          </View>

          <View style={s.switchRow}>
            <View style={s.switchLabels}>
              <Text style={s.label}>Recibir notificaciones</Text>
              <Text style={s.switchDesc}>Activar para recibir actualizaciones</Text>
            </View>
            <Switch value={form.recibirNotificaciones}
              onValueChange={(v) => actualizar('recibirNotificaciones', v)}
              trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
              thumbColor={theme.switchThumb} />
          </View>

          <TouchableOpacity style={[s.btnGuardar, guardando && s.btnDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Guardar registro"
            accessibilityState={{ disabled: guardando }}>
            {guardando ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={s.btnText}>Guardar registro</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>🔒 Los datos se almacenan solo en tu dispositivo</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerTexto: { flex: 1, marginRight: 12 },
  titulo: { fontSize: 28, fontWeight: '800', color: theme.primary, letterSpacing: -0.5 },
  subtitulo: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.accentBg, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: theme.accent },
  accentBand: { backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 10,
    paddingHorizontal: 16, marginBottom: 16, alignItems: 'center' },
  accentBandText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: theme.surface, borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: theme.border, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 },
  input: { backgroundColor: theme.inputBg, borderWidth: 1.5, borderColor: theme.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text },
  textArea: { height: 100, paddingTop: 12 },
  inputError: { borderColor: theme.error },
  errorText: { color: theme.error, fontSize: 12, marginTop: 4, flex: 1 },
  mensajeFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  charCount: { fontSize: 11, color: theme.textSecondary },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 2, borderColor: theme.border, backgroundColor: theme.surfaceAlt },
  catText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  catTextActive: { color: '#FFFFFF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.border, marginBottom: 20 },
  switchLabels: { flex: 1, marginRight: 12 },
  switchDesc: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  btnGuardar: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: theme.textSecondary, fontSize: 12, marginTop: 16 },
});
