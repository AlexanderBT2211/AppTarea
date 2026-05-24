// src/utils/storage.js
// Funciones para guardar y leer datos con AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tarea_app:registros';

const generarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const guardarRegistro = async (datos) => {
  const existentes = await obtenerRegistros();
  const nuevoRegistro = {
    id: generarId(),
    fechaCreacion: new Date().toISOString(),
    ...datos,
  };
  const actualizados = [nuevoRegistro, ...existentes];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
  return nuevoRegistro;
};

export const obtenerRegistros = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[storage] Error al obtener registros:', error);
    return [];
  }
};

export const eliminarRegistro = async (id) => {
  const existentes = await obtenerRegistros();
  const filtrados = existentes.filter(registro => registro.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));
};

export const limpiarTodo = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
