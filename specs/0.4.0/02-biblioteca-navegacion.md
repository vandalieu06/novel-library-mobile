---
code: "02"
title: "Biblioteca primero: rutas, tab bar, top app bar y grid de 2 columnas"
project: "novel-library-mobile"
status: completed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, navigation, library, material3]
affected_files:
  - "src/app/(tabs)/_layout.tsx"
  - "src/app/(tabs)/index.tsx"
  - "src/app/(tabs)/books.tsx"
  - "src/app/(tabs)/download.tsx"
  - src/components/app-bar.tsx
  - src/components/tab-row.tsx
  - src/components/list-card.tsx
  - src/components/novel-card.tsx
  - src/components/cover-image.tsx
  - src/components/empty-state.tsx
  - src/lib/grid.ts
  - src/lib/layout.ts
  - docs/arquitectura.md
---

# 02 — Biblioteca primero

## Purpose

Hacer que la app abra en **Biblioteca** y que “Descargar” sea una tab
secundaria. Reestructurar rutas, tab bar, top app bar, tabs de categoría y grid
de portadas según B2. La biblioteca es la superficie recurrente; el formulario
de descarga deja de ser el inicio.

## Context

Hoy `(tabs)/index.tsx` es el formulario de descarga y `(tabs)/books.tsx` la
biblioteca. El orden `Inicio · Biblioteca · Ajustes` hace que la app abra en una
tarea ocasional. El usuario aprobó:

- Arranque en Biblioteca.
- `Biblioteca · Descargar · Ajustes`.
- Grid de **2 columnas** en móvil, portadas grandes, badge sobre la cubierta.
- Top app bar con búsqueda, filtros y overflow.
- Tabs de categoría: Todas, Web, PDF, Traducidas.

La referencia visual es
`prototypes/design-directions/?variant=native&screen=books&theme=light&width=phone`.

## Proposed change

### Rutas y tabs

- Mover el contenido de `(tabs)/books.tsx` a `(tabs)/index.tsx`.
- Mover el contenido actual de `(tabs)/index.tsx` a `(tabs)/download.tsx`.
- Eliminar `(tabs)/books.tsx`.
- Orden en `(tabs)/_layout.tsx`: `index` (Biblioteca), `download` (Descargar),
  `settings` (Ajustes).
- Labels e iconos Material: `MaterialIcons` `local-library`, `add`, `settings`.
- **Desviación (2026-11-07, al implementar):** el bar vendido de Expo Router
  (SDK 58) lanza `The 'material' variant is only supported when
  'tabBarPosition' is 'left' or 'right'`; no existe bottom nav Material
  nativo. La franja inferior usa `tabBarVariant: "uikit"` en ambas
  plataformas, con los iconos Material y los cuatro colores; `material`
  queda para el rail (≥768, que ya lo usa). El criterio "barra Material en
  Android" se lee como "franja uikit con iconos y colores Material"; el look
  del bar se revisa en 07.
- Activo `accent-ink`, inactivo `muted`; fondo `surface`; borde superior
  `outline`.

### Top app bar de Biblioteca

- Título “Biblioteca”, 22/28.
- Acciones 40×40: buscar, filtrar, overflow.
- **Buscar**: toggle de un `SearchField` bajo el app bar, autofocus, botón
  limpiar y cerrar. La búsqueda se aplica con `useDeferredValue` para no
  bloquear el grid.
- **Filtrar**: abre el sheet existente, reducido a **idiomas** y **orden**.
  Origen y “traducidas” viven en las tabs, no en el sheet.
- **Overflow**: menú con “Actualizar” y “Ir a Ajustes”.

### Tabs de categoría

`Todas · Web · PDF · Traducidas`, 48 de alto, label 14/20 500, subrayado de
3 px con `accent-ink`, borde inferior `outline`, scroll horizontal.

Mapeo:

| Tab | `origin` | `translatedOnly` |
| --- | --- | --- |
| Todas | `all` | `false` |
| Web | `web` | `false` |
| PDF | `pdf` | `false` |
| Traducidas | `all` | `true` |

El filtro de idioma y el orden siguen en el sheet; el badge del icono de filtros
cuenta solo idiomas activos.

### Grid y card

- `FlatList` de 2 columnas en móvil; gap 12 horizontal, 20 vertical; padding
  16; `key={columns}` para forzar el re-layout.
- `resolveGridColumns(width, setting)` auto: 2 en móvil y 3 en tablet (06). El
  override 2/4/8 se mantiene.
- Cover 2:3, radio 8, `expo-image`, placeholder `surface-tertiary`.
- Badge `ES`/`EN`/`PDF` en la esquina superior izquierda: 10/14 600,
  `accent`+`accent-foreground` para idioma, `surface`+`foreground` para PDF.
  Si hay idioma y PDF, gana el idioma; el detalle muestra ambos.
- Título 14/20 500, 2 líneas; autor 12/16 `muted`, 1 línea. **Sin chips** y sin
  `min-h-11` en el título.
- Toda la card es pressable (target ≥ 48). `PressableFeedback` con highlight,
  sin escala en listas.

### Contadores y estados

- Sin filtros: `{novels.length} novelas · {tomos} tomos`, donde `tomos` =
  `epub_original.length + epub_translated.length` por novela.
- Con búsqueda/filtros: `{filtered.length} de {novels.length} novelas`.
- Loading: skeleton de 2 columnas × 3 filas con la forma exacta de la card.
- Vacío real: “Tu biblioteca está vacía”, CTA “Descargar” → `/download`.
- Sin resultados: “Sin resultados”, CTA “Limpiar búsqueda y filtros”.
- Error 401: “Token inválido”, CTA “Ir a Ajustes”.
- Error de red: mensaje inline + “Reintentar”.
- Pull-to-refresh se mantiene.

## Technical decision

- Ruta canónica `/` = Biblioteca; `/download` = Descargar. Evita que un deep
  link al inicio abra el formulario.
- La tab bar nativa de Expo Router (Material en Android) reemplaza iconos
  Ionicons por MaterialIcons.
- Las tabs son presets de origen/traducidas; el sheet conserva idiomas y orden.
  Se evita duplicar el mismo filtro en dos sitios.
- La búsqueda es inline (no una ruta nueva) para mantener el contexto de la
  biblioteca.
- El grid usa `FlatList` con `numColumns=2`; no se cambia el número de columnas
  en caliente sin remount.
- El detalle en tablet se resuelve en 06; aquí solo se navega a
  `/novel/[slug]`.

## Affected files

`(tabs)/_layout.tsx`, `(tabs)/index.tsx`, `(tabs)/books.tsx`,
`(tabs)/download.tsx`; `novel-card.tsx`, `cover-image.tsx`,
`empty-state.tsx`; `lib/grid.ts`, `lib/layout.ts`; `app-bar.tsx`, `tab-row.tsx`,
`list-card.tsx` (de 01); `docs/arquitectura.md` al cierre.

## Tests

**Emuladores**: solo `mobile` → **`Expo`** (1080×2400, Android 37, portrait).
No lanzar `Medium_Tablet`, `Pixel_10` ni `pixel_4a_teikit`.
Arranque: `emulator -avd Expo` solo si no está ya; al terminar
`adb -s <serial> emu kill`.

1. `npx tsc --noEmit` y `npx expo lint`.
2. `make devices`; `make reverse`; `make start`/`make deep-link`.
3. `/` abre Biblioteca con la tab activa; el orden es Biblioteca · Descargar ·
   Ajustes; “Descargar” abre `/download`; “Ajustes” conserva su contenido.
4. Grid a 2 columnas; portadas 2:3; badge correcto (ES/EN/PDF); títulos largos
   a 2 líneas; autor a 1; targets ≥ 48.
5. Buscar, limpiar, cambiar tabs, abrir filtros, cambiar idioma y orden; el
   contador y el grid responden; el badge de filtros cuenta idiomas.
6. Vacío real, sin resultados, error 401 y error de red; pull-to-refresh;
   skeleton con la forma correcta.
7. Claro/oscuro; tap en card abre el detalle.
8. `adb -s <serial> emu kill` al terminar. No lanzar el tablet.

## Acceptance criteria

- [x] La app abre en Biblioteca; no existe una tab “Inicio”.
- [x] Orden `Biblioteca · Descargar · Ajustes`; iconos Material. **Desviación
      documentada**: la franja inferior usa `tabBarVariant: "uikit"` (el bar
      vendido de Expo Router no soporta `material` en bottom; ver arriba).
- [x] `/` = Biblioteca y `/download` = Descargar; `books.tsx` eliminado
      (`statistics.tsx` ya no apunta a `/books`).
- [x] Grid de 2 columnas con `auto` (3 en ≥768); card 2:3 con badge ES/PDF y
      sin chips; overrides 2/4/8 respetados (verificado con el ajuste 4 y
      después con `auto`).
- [x] Top app bar con búsqueda (diferida, foco neutro), filtros (sheet
      idiomas+orden, badge = idiomas) y overflow (Actualizar / Ir a Ajustes).
- [x] Tabs Todas/Web/PDF/Traducidas con subrayado accent-ink y mapeo
      origen/traducidas.
- [x] Contadores (novelas · tomos / X de Y), skeleton con forma de card,
      vacío ("Descargar" → `/download`), sin resultados ("Limpiar búsqueda y
      filtros"), 401 ("Ir a Ajustes") y error de red (inline + Reintentar).
- [x] `npx tsc --noEmit` y `npx expo lint` pasan.
- [x] Solo se lanzó `Expo` y se apagó al terminar.

## Notas de cierre (2026-11-07)

- **`tabBarVariant: "material"` en la franja inferior lanzaba** `The 'material'
  variant for tab bar is only supported when 'tabBarPosition' is set to 'left'
  or 'right'` (BottomTabBar vendored de Expo Router 58). Se usa `uikit` en
  móvil con los iconos/colores Material; el `material` sigue para el rail
  (≥768). Anotado arriba y con re-revisión del look del bar pendiente en 07.
- **El botón overflow no abría con `asChild` sobre `AppBarAction`**: el
  componente aplica su propio `onPress`. El trigger del `Menu` de HeroUI se
  usa "pelado" (className con las mismas medidas + icono Material).
- La densidad de grid se movió de `4` a `auto` durante la verificación (así
  se prueba la regla de 2 columnas móvil/3 tablet); los overrides 2/4/8 se
  validaron con `4` antes del cambio y la densidad final queda en `auto`.
- El badge del icono de filtros cuenta idiomas (no el orden); el contador
  "novelas · tomos" no se cambia por el origen de las tabs (las tabs no son
  "filtros" en esta spec).
- 401/error de red no son reproducibles con el mock; implementados y
  revisados por código, se validan con servidor real en 07.
- El flotante del dev launcher interceptaba taps sobre el overflow; se
  desactivó ("Tools button" off) durante la verificación.
