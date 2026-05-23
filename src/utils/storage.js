// src/utils/storage.js
// Capa de acceso a datos para AsyncStorage.
//
// AsyncStorage es el mecanismo de almacenamiento clave-valor de React Native.
// Persiste datos localmente en el dispositivo incluso al cerrar la app.
// Solo soporta strings, por eso serializamos/deserializamos con JSON.

import AsyncStorage from '@react-native-async-storage/async-storage';

// Clave única de la colección en AsyncStorage.
// El prefijo '@tarea_app:' evita colisiones con otras apps o librerías.
const STORAGE_KEY = '@tarea_app:registros';

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Genera un ID único combinando timestamp + número aleatorio.
 * Más robusto que solo Date.now() (evita colisiones si se guardan
 * dos registros en el mismo milisegundo).
 * @returns {string}
 */
const generarId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Guarda un nuevo registro en el almacenamiento local.
 * Los registros se acumulan en un arreglo (el más reciente primero).
 *
 * @param {Object} datos - Campos del formulario
 * @param {string} datos.nombre
 * @param {string} datos.email
 * @param {string} [datos.telefono]
 * @param {string} datos.mensaje
 * @param {string} datos.categoria
 * @param {boolean} datos.recibirNotificaciones
 * @returns {Promise<Object>} El registro guardado con id y fechaCreacion
 * @throws {Error} Si AsyncStorage falla
 */
export const guardarRegistro = async (datos) => {
  // Obtenemos los existentes primero para no perderlos
  const existentes = await obtenerRegistros();

  const nuevoRegistro = {
    id: generarId(),
    fechaCreacion: new Date().toISOString(),
    ...datos,
  };

  const actualizados = [nuevoRegistro, ...existentes];

  // setItem puede lanzar si el almacenamiento está lleno o no disponible
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));

  return nuevoRegistro;
  // Nota: el try/catch está en quien llama (handleGuardar en FormScreen),
  // así el error se propaga correctamente y se muestra al usuario.
};

/**
 * Obtiene todos los registros guardados, ordenados del más nuevo al más viejo.
 * Retorna [] si no hay nada guardado (nunca lanza).
 *
 * @returns {Promise<Array>}
 */
export const obtenerRegistros = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];

    const parsed = JSON.parse(json);
    // Verificamos que sea un arreglo válido para no crashear la FlatList
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Si el JSON está corrupto, retornamos vacío en lugar de crashear
    console.error('[storage] obtenerRegistros falló:', error);
    return [];
  }
};

/**
 * Elimina un registro específico por su ID.
 * Si el ID no existe, la operación es silenciosa (no lanza).
 *
 * @param {string} id
 * @returns {Promise<void>}
 * @throws {Error} Si AsyncStorage falla al escribir
 */
export const eliminarRegistro = async (id) => {
  const existentes = await obtenerRegistros();
  const filtrados = existentes.filter(r => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));
};

/**
 * Borra TODOS los registros del almacenamiento local.
 * Útil para el botón "Limpiar todo" en RegistrosScreen.
 *
 * @returns {Promise<void>}
 * @throws {Error} Si AsyncStorage falla
 */
export const limpiarTodo = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
