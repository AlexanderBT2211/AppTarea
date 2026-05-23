# AppTarea — React Native
**Computación Web y Móvil · UTEM INFO8 · Tarea 1**

---

## 📱 Descripción

App móvil con React Native + Expo que cumple los 3 requisitos:

| Requisito | Implementación |
|-----------|---------------|
| Selector dark/light | `Switch` en ambas pantallas, `Context API` global |
| Formulario | 6 campos con validación, contador de caracteres, accesibilidad |
| Almacenamiento local | `AsyncStorage` con CRUD completo |

---

## 🗂 Estructura del proyecto

```
AppTarea/
├── App.js                          # Entrada: SafeAreaProvider + ThemeProvider + Navegación
├── package.json                    # Dependencias del proyecto
├── README.md                       # Este archivo
└── src/
    ├── context/
    │   └── ThemeContext.js         # Estado global del tema (Context API + useMemo)
    ├── screens/
    │   ├── FormScreen.js           # Formulario con validación y guardado
    │   └── RegistrosScreen.js      # Lista con FlatList, pull-to-refresh y eliminación
    └── utils/
        └── storage.js             # Capa de acceso a AsyncStorage
```

---

## ⚙️ Instalación y ejecución

### Requisitos
- Node.js 18+
- Expo Go instalado en tu celular (iOS / Android)

### Pasos

```bash
# 1. Entrar al directorio
cd AppTarea

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npx expo start

# 4. Escanear el QR con Expo Go
#    o presionar 'a' (Android) / 'i' (iOS) para usar emulador
```

---

## 🧩 Decisiones técnicas explicadas

### Context API para el tema (`ThemeContext.js`)
- `createContext` + `useState` para estado global del modo dark/light.
- `useMemo` en el valor del Provider para evitar re-renders innecesarios en todos los consumidores cuando el componente padre se re-renderiza por otras razones.
- Hook `useTheme()` exportado para acceder limpiamente desde cualquier componente.

### AsyncStorage (`storage.js`)
- Clave prefijada `@tarea_app:registros` para evitar colisiones con otras apps.
- ID generado con `Date.now() + Math.random()` para evitar duplicados si se guarda muy rápido.
- `Array.isArray()` al leer para manejar datos corruptos sin crashear.
- Error handling separado: `guardarRegistro` lanza el error (lo maneja la pantalla), `obtenerRegistros` lo traga y retorna `[]` (nunca rompe la UI).

### FormScreen (`FormScreen.js`)
- `useCallback` en `actualizar` para no re-crear la función en cada render.
- Validación con mensajes específicos por campo.
- `KeyboardAvoidingView` con `Platform.OS` para comportamiento correcto en iOS y Android.
- `paddingTop` dinámico según plataforma para evitar el notch de iPhone.
- `maxLength` en todos los campos para prevenir entradas excesivas.
- Contador de caracteres en el campo Mensaje.
- `accessibilityLabel` y `accessibilityRole` para lectores de pantalla.

### RegistrosScreen (`RegistrosScreen.js`)
- `useFocusEffect` + `useCallback` (obligatorio para evitar loop infinito).
- Flag `activo` en el efecto para cancelar actualizaciones de state si el componente se desmontó antes de que terminara la carga.
- Eliminar: actualiza el array local directamente (sin recargar todo) para respuesta inmediata.
- `FlatList` con `removeClippedSubviews`, `maxToRenderPerBatch`, `windowSize` para mejor performance en Android.
- `hitSlop` en el botón eliminar para área táctil más grande.

### App.js
- `SafeAreaProvider` necesario para que la tab bar no quede bajo el home indicator en iPhones.
- `TabIcon` declarado fuera de `AppNavigator` para evitar re-creaciones en cada render.
- `require()` removido de dentro del render (anti-patrón del código original).

---

## ✅ Checklist de requisitos

- [x] Selector dark/light mode
- [x] Formulario completo con validación
- [x] Almacenamiento local (AsyncStorage)
- [x] Código comentado y documentado
- [x] Manejo de errores en todas las operaciones
- [x] Compatible con iOS y Android
