// src/screens/FormScreen.js
// Pantalla principal: formulario de registro de contacto.
//
// Conceptos de React Native usados:
//   - useState: estado local del formulario y errores de validación
//   - useCallback: memoriza funciones para evitar re-renders innecesarios
//   - KeyboardAvoidingView: mueve el contenido cuando aparece el teclado
//   - ScrollView con keyboardShouldPersistTaps: cierra teclado al tocar afuera
//   - Platform.OS: comportamiento diferente entre iOS y Android
//   - StyleSheet.create: optimizado por React Native (styles son inmutables)

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { guardarRegistro } from '../utils/storage';

// ─── Constantes ───────────────────────────────────────────────────────────────
// Fuera del componente → referencias estables, no se recrean en cada render.

const CATEGORIAS = ['Personal', 'Trabajo', 'Estudio', 'Otro'];

const FORM_INICIAL = {
  nombre: '',
  email: '',
  telefono: '',
  mensaje: '',
  categoria: 'Personal',
  recibirNotificaciones: false,
};

// ─── Validación ───────────────────────────────────────────────────────────────
/**
 * Valida los campos del formulario.
 * @param {Object} form - Estado actual del formulario
 * @returns {Object} Objeto con los mensajes de error por campo (vacío = sin errores)
 */
const validarForm = (form) => {
  const errores = {};

  if (!form.nombre.trim()) {
    errores.nombre = 'El nombre es requerido';
  } else if (form.nombre.trim().length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!form.email.trim()) {
    errores.email = 'El correo es requerido';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errores.email = 'Ingresa un correo electrónico válido';
  }

  // Teléfono es opcional, pero si se ingresa debe tener formato válido
  if (form.telefono.trim() && !/^\+?[\d\s\-()]{7,15}$/.test(form.telefono.trim())) {
    errores.telefono = 'Formato inválido (ej: +56 9 1234 5678)';
  }

  if (!form.mensaje.trim()) {
    errores.mensaje = 'El mensaje es requerido';
  } else if (form.mensaje.trim().length < 5) {
    errores.mensaje = 'El mensaje debe tener al menos 5 caracteres';
  }

  return errores;
};

// ─── Componente InputField ────────────────────────────────────────────────────
// Componente reutilizable para campos de texto.
// Separado del componente principal para que React no lo re-monte en cada render.
function InputField({ label, error, theme, style, ...props }) {
  const s = makeStyles(theme);
  return (
    <View style={s.fieldGroup}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, style, error ? s.inputError : null]}
        placeholderTextColor={theme.placeholder}
        // En iOS el autocorrect puede interferir con email/teléfono
        autoCorrect={false}
        {...props}
      />
      {/* Solo renderiza el texto de error si existe (evita espacio vacío) */}
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function FormScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = makeStyles(theme);

  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  /**
   * Actualiza un campo del formulario y limpia su error si lo tenía.
   * useCallback evita que esta función se recree en cada render,
   * lo que causaría re-renders innecesarios en los InputField hijos.
   */
  const actualizar = useCallback((campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => {
      if (!prev[campo]) return prev; // Si no hay error, no re-renderizar
      const { [campo]: _, ...resto } = prev;
      return resto;
    });
  }, []);

  /**
   * Maneja el envío del formulario:
   * 1. Valida
   * 2. Guarda en AsyncStorage
   * 3. Muestra alerta de éxito o error
   */
  const handleGuardar = async () => {
    // 1. Validar antes de intentar guardar
    const nuevosErrores = validarForm(form);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      // 2. Persistir en AsyncStorage
      await guardarRegistro(form);

      // 3. Éxito: ofrecer opciones al usuario
      Alert.alert(
        '¡Guardado correctamente! ✓',
        'El registro se almacenó en tu dispositivo.',
        [
          {
            text: 'Ver registros',
            onPress: () => navigation.navigate('Registros'),
          },
          {
            text: 'Nuevo registro',
            style: 'cancel',
            onPress: () => {
              setForm(FORM_INICIAL);
              setErrores({});
            },
          },
        ]
      );
    } catch (error) {
      // Error de AsyncStorage (ej: almacenamiento lleno)
      console.error('[FormScreen] Error al guardar:', error);
      Alert.alert(
        'Error al guardar',
        'No se pudo guardar el registro. Verifica el espacio disponible en tu dispositivo.',
        [{ text: 'Entendido' }]
      );
    } finally {
      // Siempre se ejecuta, error o no
      setGuardando(false);
    }
  };

  return (
    // KeyboardAvoidingView: sube el contenido cuando aparece el teclado virtual.
    // En iOS usamos 'padding'; en Android 'height' funciona mejor.
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        // 'handled': permite tocar botones aunque el teclado esté visible
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerTexto}>
            <Text style={s.titulo}>Nuevo Registro</Text>
            <Text style={s.subtitulo}>Completa todos los campos marcados con *</Text>
          </View>
          {/* Toggle dark/light */}
          <View style={s.themeToggle}>
            <Text style={s.themeEmoji}>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.switchTrackFalse,
                true: theme.switchTrackTrue,
              }}
              thumbColor={theme.switchThumb}
              // accessibilityLabel para lectores de pantalla
              accessibilityLabel={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
            />
          </View>
        </View>

        {/* ── Tarjeta del formulario ── */}
        <View style={s.card}>

          {/* Nombre */}
          <InputField
            label="Nombre completo *"
            placeholder="Ej: Juan Pérez"
            value={form.nombre}
            onChangeText={(v) => actualizar('nombre', v)}
            error={errores.nombre}
            theme={theme}
            autoCapitalize="words"
            returnKeyType="next"
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
            returnKeyType="next"
            maxLength={100}
          />

          {/* Teléfono */}
          <InputField
            label="Teléfono (opcional)"
            placeholder="+56 9 1234 5678"
            value={form.telefono}
            onChangeText={(v) => actualizar('telefono', v)}
            error={errores.telefono}
            theme={theme}
            keyboardType="phone-pad"
            returnKeyType="next"
            maxLength={20}
          />

          {/* Categoría (selector de botones) */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Categoría</Text>
            <View style={s.categorias}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catBtn, form.categoria === cat && s.catBtnActive]}
                  onPress={() => actualizar('categoria', cat)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: form.categoria === cat }}
                >
                  <Text style={[s.catText, form.categoria === cat && s.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mensaje */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Mensaje *</Text>
            <TextInput
              style={[s.input, s.textArea, errores.mensaje ? s.inputError : null]}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor={theme.placeholder}
              value={form.mensaje}
              onChangeText={(v) => actualizar('mensaje', v)}
              multiline
              numberOfLines={4}
              // textAlignVertical solo existe en Android; en iOS se alinea solo
              textAlignVertical="top"
              maxLength={500}
              returnKeyType="done"
            />
            {/* Contador de caracteres */}
            <View style={s.mensajeFooter}>
              {!!errores.mensaje && (
                <Text style={s.errorText}>{errores.mensaje}</Text>
              )}
              <Text style={[s.charCount, { marginLeft: errores.mensaje ? 0 : 'auto' }]}>
                {form.mensaje.length}/500
              </Text>
            </View>
          </View>

          {/* Switch de notificaciones */}
          <View style={s.switchRow}>
            <View style={s.switchLabels}>
              <Text style={s.label}>Recibir notificaciones</Text>
              <Text style={s.switchDesc}>Activar para recibir actualizaciones</Text>
            </View>
            <Switch
              value={form.recibirNotificaciones}
              onValueChange={(v) => actualizar('recibirNotificaciones', v)}
              trackColor={{
                false: theme.switchTrackFalse,
                true: theme.switchTrackTrue,
              }}
              thumbColor={theme.switchThumb}
              accessibilityLabel="Recibir notificaciones"
            />
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={[s.btnGuardar, guardando && s.btnDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Guardar registro"
            accessibilityState={{ disabled: guardando }}
          >
            {guardando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.btnText}>Guardar registro</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          🔒 Los datos se almacenan solo en tu dispositivo
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
// makeStyles recibe el tema y retorna un StyleSheet.
// StyleSheet.create optimiza los estilos (se validan una vez en modo desarrollo).
const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 48, // Espacio extra para que el footer no quede pegado al borde
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
      paddingTop: Platform.OS === 'ios' ? 50 : 20, // Evita el notch en iOS
    },
    headerTexto: {
      flex: 1,
      marginRight: 12,
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
      marginTop: 4,
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
    themeEmoji: {
      fontSize: 16,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      // Sombra: shadowColor en iOS, elevation en Android
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    fieldGroup: {
      marginBottom: 18,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: theme.inputBg,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.text,
    },
    textArea: {
      height: 100,
      paddingTop: 12,
    },
    inputError: {
      borderColor: theme.error,
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 4,
      flex: 1,
    },
    mensajeFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    charCount: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    categorias: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    catBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    catBtnActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    catText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    catTextActive: {
      color: '#FFFFFF',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      marginBottom: 20,
    },
    switchLabels: {
      flex: 1,
      marginRight: 12,
    },
    switchDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    btnGuardar: {
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52, // Altura mínima para que el spinner no cambie el layout
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    footer: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 16,
    },
  });
