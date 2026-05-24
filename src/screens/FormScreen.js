// src/screens/FormScreen.js

// Diseño minimalista con inputs underline y botones tipo pill

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

// Campo con solo borde inferior (estilo minimalista underline)
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
      Alert.alert('Guardado ✓', 'El registro se almacenó en tu dispositivo.', [
        { text: 'Ver registros', onPress: () => navigation.navigate('Registros') },
        { text: 'Nuevo registro', style: 'cancel', onPress: () => { setForm(FORM_INICIAL); setErrores({}); } },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Verifica el espacio en tu dispositivo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER minimalista ── */}
        <View style={s.header}>
          <View>
            <Text style={s.titulo}>Nuevo{'\n'}Registro</Text>
          </View>
          {/* Toggle sin caja, solo switch + emoji */}
          <View style={s.themeToggle}>
            <Text style={s.themeEmoji}>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
              thumbColor={theme.switchThumb}
            />
          </View>
        </View>

        {/* ── FORMULARIO ── */}
        <View style={s.formSection}>

          {/* Nombre */}
          <InputField
            label="Nombre completo *"
            placeholder="Juan Pérez"
            value={form.nombre}
            onChangeText={(v) => actualizar('nombre', v)}
            error={errores.nombre}
            theme={theme}
            autoCapitalize="words"
            maxLength={60}
          />

          {/* Email */}
          <InputField
            label="Correo electrónico *"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChangeText={(v) => actualizar('email', v.toLowerCase())}
            error={errores.email}
            theme={theme}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
          />

          {/* Teléfono */}
          <InputField
            label="Teléfono"
            placeholder="+56 9 1234 5678  (opcional)"
            value={form.telefono}
            onChangeText={(v) => actualizar('telefono', v)}
            error={errores.telefono}
            theme={theme}
            keyboardType="phone-pad"
            maxLength={20}
          />

          {/* Categoría — pills horizontales */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Categoría</Text>
            <View style={s.categorias}>
              {CATEGORIAS.map((cat, index) => {
                const isActive = form.categoria === cat;
                const colorCat = COLORES_CATEGORIA[index];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      s.catPill,
                      // Inactivo: outline del color — Activo: relleno del color
                      isActive
                        ? { backgroundColor: colorCat, borderColor: colorCat }
                        : { borderColor: colorCat },
                    ]}
                    onPress={() => actualizar('categoria', cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.catText, { color: isActive ? '#FFFFFF' : colorCat }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Mensaje */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Mensaje *</Text>
            <TextInput
              style={[s.input, s.textArea, errores.mensaje ? s.inputError : null]}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={theme.placeholder}
              value={form.mensaje}
              onChangeText={(v) => actualizar('mensaje', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={s.mensajeFooter}>
              {!!errores.mensaje && <Text style={s.errorText}>{errores.mensaje}</Text>}
              <Text style={[s.charCount, { marginLeft: errores.mensaje ? 0 : 'auto' }]}>
                {form.mensaje.length}/500
              </Text>
            </View>
          </View>

          {/* Switch notificaciones — limpio sin separador */}
          <View style={s.switchRow}>
            <View>
              <Text style={s.label}>Notificaciones</Text>
              <Text style={s.switchDesc}>Recibir actualizaciones</Text>
            </View>
            <Switch
              value={form.recibirNotificaciones}
              onValueChange={(v) => actualizar('recibirNotificaciones', v)}
              trackColor={{ false: theme.switchTrackFalse, true: theme.switchTrackTrue }}
              thumbColor={theme.switchThumb}
            />
          </View>

          {/* Botón guardar — pill sólido naranja */}
          <TouchableOpacity
            style={[s.btnGuardar, guardando && s.btnDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
            activeOpacity={0.85}
          >
            {guardando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnText}>Guardar registro</Text>
            }
          </TouchableOpacity>

          <Text style={s.footer}>🔒 Solo se guarda en tu dispositivo</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 48 },

  // Header sin caja, solo texto grande
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 24,
  },
  titulo: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -1,
    lineHeight: 38,
  },
  // Toggle sin caja: solo emoji + switch
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  themeEmoji: { fontSize: 18 },

  formSection: {
    paddingHorizontal: 28,
  },
  fieldGroup: { marginBottom: 24 },

  // Label naranja pequeño
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Input solo con borde inferior (underline style)
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: theme.border,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    height: 90,
    paddingTop: 10,
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.border,
  },
  // Error: borde inferior rosa
  inputError: {
    borderBottomColor: theme.error,
  },
  errorText: { color: theme.error, fontSize: 12, marginTop: 4, flex: 1 },
  mensajeFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  charCount: { fontSize: 11, color: theme.textSecondary },

  // Pills de categoría
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,       // pill shape
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  catText: { fontSize: 13, fontWeight: '600' },

  // Switch sin separador
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingVertical: 4,
  },
  switchDesc: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

  // Botón principal pill sólido naranja
  btnGuardar: {
    backgroundColor: theme.primary,
    borderRadius: 30,           // muy redondeado tipo pill
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  footer: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 20,
  },
});
