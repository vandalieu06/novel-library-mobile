---
code: "01"
title: "Tokens, tema resuelto y chrome: contraste, jerarquía tipográfica y barra de estado"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-02
tags: [spec, sdd, ui, tokens, a11y]
affected_files:
  - global.css
  - app.json
  - src/app/_layout.tsx
  - src/app/(tabs)/_layout.tsx
  - src/lib/theme.tsx
  - src/components/screen.tsx
  - src/components/action-button.tsx
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/books.tsx
  - src/app/(tabs)/settings.tsx
  - src/app/novel/[slug].tsx
  - src/app/settings/statistics.tsx
  - src/app/settings/about.tsx
  - docs/arquitectura.md
---

# 01 — Tokens, tema resuelto y chrome

## Purpose

Arreglar la base visual de la app antes de reestructurar pantallas: contraste
accesible en el accent y en el primario, una escala tipográfica que se note,
superficies separadas por tono (no por borde), tema resuelto también al
arrancar, barra de estado legible y botones con estados honestos.

## Context

Revisión visual sobre la app corriendo (Android 1080×2400, claro y oscuro) con
las capturas de Inicio, Biblioteca, detalle, Ajustes, Estadísticas, Acerca y el
sheet de Filtros. Hallazgos medidos:

- **Contraste.** Blanco sobre `--accent` `#e0575f` = **3.69:1**; el accent como
  texto sobre blanco = 3.69:1, sobre `#f4f4f5` = 3.35:1 y sobre el chip rosa =
  3.11:1. AA pide 4.5:1 para texto normal. El botón deshabilitado (opacidad 0.5
  de HeroUI sobre el accent) queda ≈ **1.6:1**, ilegible en claro y en oscuro.
- **Foco = error.** El anillo de foco del `Input` usa el accent rojo y es
  indistinguible del borde de error (`--danger` `#dc2626`); comprobado
  enfocando el campo de URL: parece inválido.
- **Barra de estado.** En claro los iconos del sistema son blancos sobre fondo
  blanco: no se ven. En oscuro, al hacer scroll el contenido pasa por debajo de
  la barra y se cruza con la hora (`settings.tsx` usa
  `ScrollView style={{ paddingTop: insets.top }}`, Android en edge-to-edge).
- **Tema resuelto solo a medias.** `Uniwind.setTheme` se llama únicamente al
  tocar Ajustes; al reiniciar no se re-aplica el tema guardado, y `_layout.tsx`
  y `(tabs)/_layout.tsx` usan `useColorScheme()` (siempre el del sistema), así
  que con tema forzado el header y la tab bar se quedan en el esquema
  equivocado.
- **Jerarquía tipográfica plana.** En la práctica todo vive entre 14 y 18 px:
  label de campo, cuerpo, label de botón y título de sección compiten (en
  Ajustes, "URL del backend" se lee con el mismo peso que "Servidor").
- **Superficies sin paso de tono.** `--background` y `--surface` son ambos
  `#ffffff` en claro, así que toda tarjeta necesita borde para existir. De ahí
  la sensación de "lista de cajas".
- **Radios mezclados.** Botones pill (HeroUI `--radius-3xl`/`4xl`), cards 12,
  inputs 8, search 16. `translate_novels/DESIGN.md` fija 6/8/12.
- **Targets pequeños.** `Button size="sm"` mide 40 y el botón Filtros `h-9`
  (36): por debajo del mínimo táctil de 44 en móvil.
- **Marca.** `app.json` conserva el splash azul de plantilla (`#208AEF`) y el
  adaptive icon `#E6F4FE`; la app abre en azul y pasa a rojo.

## Proposed change

### 1. Tokens de color (global.css)

Un solo accent, y que cumpla AA en claro. Valores medidos:

| Token | Claro | Oscuro | Nota |
|---|---|---|---|
| `--background` | `#f7f7f8` | `#09090b` | un paso por debajo de la superficie |
| `--surface` | `#ffffff` | `#121215` | tarjetas |
| `--surface-secondary` | `#f1f1f3` | `#1c1c20` | filas, segmented, campos |
| `--border` / `--separator` | `#e7e7ea` / `#efeff1` | `#27272a` / `#1f1f23` | 1.23:1: solo donde separa |
| `--muted` | `#6b6b73` | `#a1a1aa` | 4.93:1 sobre el fondo claro |
| `--accent` | `#bd4048` | `#f2777e` | 5.26:1 en blanco; 4.81:1 en chip |
| `--accent-foreground` | `#ffffff` | `#18181b` | 5.26:1 / 6.51:1 |
| `--primary` (nuevo) | `#18181b` | `#fafafa` | acción principal |
| `--primary-foreground` (nuevo) | `#fafafa` | `#18181b` | 16.97:1 |
| `--focus-ring` (nuevo) | `#18181b` | `#fafafa` | foco neutro |
| `--danger` | `#dc2626` | `#ef4444` | solo error |

Reglas:

- **El accent deja de ser el color de la interfaz**: queda para datos
  (progreso), chips de idioma, tab activo y el anillo de foco *si* se decide
  accent; el foco será `--focus-ring` neutro para no confundirse con error.
- **Error y foco se distinguen por forma y color**: foco = 1.5 px neutro;
  error = 2 px `--danger` + mensaje (`FieldError`/`Alert`).
- Ningún texto usa `text-accent` sobre superficie clara salvo chips y datos;
  los labels de botones secundarios pasan a `text-foreground`.

### 2. Escala tipográfica aplicable (global.css)

Clases semánticas en `@layer components` para que las pantallas no re-inventen
el tamaño a mano:

| Clase | Tamaño / interlineado / peso | Uso |
|---|---|---|
| `.t-page` | 24 / 30 / 700, tracking -0.02em | título de página (uno por pantalla) |
| `.t-section` | 16 / 22 / 600 | título de sección |
| `.t-card` | 16 / 22 / 600 | título de card/hero |
| `.t-body` | 14 / 20 / 400 | cuerpo y filas |
| `.t-label` | 13 / 18 / 500 | label de campo y de control |
| `.t-meta` | 12 / 16 / 400 | caption, meta, chips |
| `.t-figure` | 24 / 28 / 600 + tabular-nums | cifras destacadas |

Se sustituyen los `text-xl/2xl/lg` sueltos por estas clases. Ningún texto de
pantalla supera a `.t-page`; las cifras usan `.t-figure`.

### 3. Radios

Tres radios y solo tres, documentados y aplicados por `className` donde HeroUI
use pill por defecto:

- controles (botones, inputs, segmented): **8**
- superficies (cards, ListGroup, sheet): **12**
- overlays (dialog): **16**

Los botones dejan de ser pill: `rounded-lg`. La tab bar y los sheets conservan
su radio nativo.

### 4. Tema resuelto, StatusBar y Safe Area

- Nuevo `src/lib/theme.tsx`:
  - `ThemeProvider` (dentro de `ApiProvider`) lee `settings.theme` y
    `useColorScheme()` de RN y calcula `scheme: "light" | "dark"`.
  - Aplica `Uniwind.setTheme(resolved)` en un efecto al montar y cada vez que
    cambia el ajuste o el sistema (cubre auto).
  - Además, `ApiProvider` aplica `Uniwind.setTheme` justo al terminar
    `loadSettings()` para que el arranque no parpadee con el tema por defecto.
  - Expone `useAppTheme()` → `{ scheme, isDark }`.
- `src/app/_layout.tsx`: se divide en `RootLayout` (providers) y
  `RootNavigator` (dentro de `ThemeProvider`), que usa `useAppTheme()` para
  `headerTheme`, y monta `<StatusBar style={isDark ? "light" : "dark"} />`
  (`expo-status-bar`, ya instalado).
- `(tabs)/_layout.tsx` usa `useAppTheme()` en lugar de `useColorScheme()`, de
  modo que el tema forzado tiñe tab bar y headers de forma consistente.
- Nuevo `src/components/screen.tsx`: `<Screen>` = `SafeAreaView` de
  `react-native-safe-area-context` con `edges={["top"]}`, `flex-1`,
  `bg-background`. Las pantallas dejan de usar `style={{ paddingTop:
  insets.top }}` en el `ScrollView`; el viewport empieza debajo de la barra de
  estado y el contenido ya no se cruza con la hora.
- `headerStyle` de stack = `--background` del tema (no `#121215` fijo), para
  que no haya banda entre barra y página.

### 5. `ActionButton` (nuevo `src/components/action-button.tsx`)

Wrapper fino sobre `Button` de HeroUI que centraliza color, altura y estados:

| `tone` | Apariencia | Uso |
|---|---|---|
| `primary` | `bg-foreground text-background` (inverso de tinta) | la única acción principal de la pantalla |
| `secondary` | `bg-surface-secondary text-foreground` | acciones de apoyo |
| `ghost` | transparente, tinta | cancelar / terciarias |
| `danger` | `bg-danger text-white` | solo destructivo real |

- `h-11` (44) mínimo, `rounded-lg`, label `.t-body` medium.
- `loading`: mantiene el color, muestra `Spinner` + label
  ("Lanzando…"), `pointerEvents="none"` y `accessibilityState={{ busy: true }}`.
  **No usa `isDisabled`** (evita la opacidad 0.5 ilegible).
- `disabled` real: `tone="secondary"` + `text-muted`, sin opacidad, siempre
  acompañado de una frase que explique por qué. Regla de producto: un botón
  deshabilitado sin explicación no se usa; se valida al pulsar.
- Migración mecánica de todos los `Button` actuales:

| Antes | Después |
|---|---|
| `variant="primary"` (`Lanzar descarga`, `Subir y convertir`) | `tone="primary"` |
| `variant="secondary"` (Sincronizar, Filtros, Probar conexión, Elegir PDF, Reintentar) | `tone="secondary"` |
| `variant="ghost"` (Cancelar, Descargar, Volver) | `tone="ghost"` |
| `size="sm"` con acción de fila | `tone="ghost"` + `hitSlop` 8 (target 44) |
| `isDisabled` de validación | validación al pulsar + mensaje inline |

### 6. Marca en `app.json`

- `expo-splash-screen`: `backgroundColor: "#ffffff"` y
  `dark.backgroundColor: "#09090b"`.
- `android.adaptiveIcon.backgroundColor`: `#09090b`.
- El arte del icono/splash (monograma propio) **queda fuera** de esta spec: es
  un asset nuevo y no bloquea el resto. Se anota como pendiente.

## Technical decision

- Se mantiene Uniwind/Tailwind 4: los tokens siguen en `global.css` dentro de
  `@layer theme { :root { @variant light/dark } }` (fuera de `:root` Uniwind
  descarta los overrides en silencio, ya documentado).
- `--primary` no existe en el tema de HeroUI: el wrapper `ActionButton` es la
  única pieza que conoce el mapeo, para no repetir clases en 25 usos. Se
  comprueba que las utilidades (`bg-foreground`, `rounded-lg`) ganan a las
  clases de componente de HeroUI; si alguna no gana, se define el estilo en
  `global.css` dentro de `@layer components` con la misma clase.
- `ThemeProvider` va dentro de `ApiProvider` porque necesita `settings`; el
  tema se aplica también dentro del `loadSettings()` de `ApiProvider` para
  evitar el flash de primer frame.
- `Screen` usa `SafeAreaView` en lugar de padding manual: con edge-to-edge en
  Android el padding del `ScrollView` no impide que el contenido se dibuje bajo
  la barra.
- `expo-status-bar` ya está en `package.json` (58.0.4); no hay dependencias
  nuevas ni rebuild por este cambio (sí rebuild para splash/icon de `app.json`).

## Affected files

`global.css`, `app.json`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`,
`src/lib/theme.tsx` (nuevo), `src/components/screen.tsx` (nuevo),
`src/components/action-button.tsx` (nuevo), y migración de botones en
`src/app/(tabs)/index.tsx`, `books.tsx`, `settings.tsx`,
`src/app/novel/[slug].tsx`, `src/app/settings/statistics.tsx`,
`src/app/settings/about.tsx`. `docs/arquitectura.md` al cerrar.

## Tests

- `npx tsc --noEmit` y `npx expo lint` en verde.
- Visual claro/oscuro: tab bar y headers con el tema forzado (Ajustes → Claro
  estando el sistema en oscuro, y al revés) tras reiniciar la app.
- Barra de estado legible en claro (iconos oscuros) y en oscuro (claros); al
  hacer scroll en Ajustes el texto no toca la hora.
- Foco en el campo de URL ≠ estado inválido (forma y color distintos).
- Contrastes con medidor: texto accent sobre superficie ≥ 4.5:1; label de
  `ActionButton` primary ≥ 4.5:1; botón en `loading` conserva el contraste.
- Targets: todo botón/pressable mide ≥ 44×44 (medido con el layout inspector o
  visualmente).

## Acceptance criteria

- [ ] `--accent` claro es `#bd4048` y ningún texto accent queda por debajo de
      4.5:1 sobre su superficie; el primario es tinta inversa (≥ 16:1).
- [ ] El botón en `loading` es legible (no hay estados al 50 % de opacidad) y
      el deshabilitado, si existe, dice por qué.
- [ ] Foco neutro (`--focus-ring`) y error rojo (`--danger` + mensaje) se
      distinguen a simple vista.
- [ ] Escala `.t-page/.t-section/.t-card/.t-body/.t-label/.t-meta/.t-figure`
      aplicada; no quedan `text-2xl/lg/xl` sueltos en pantallas.
- [ ] Radios: controles 8, superficies 12, overlay 16; ningún botón pill.
- [ ] Tema forzado se re-aplica al arrancar y tiñe tab bar, headers y
      StatusBar.
- [ ] `Screen` elimina el contenido bajo la barra de estado en claro y oscuro.
- [ ] Splash/adaptive icon con fondo del tema (arte pendiente, anotado).
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Implementación (2026-11-03)

- **Ajustes al plan**
  - `Screen` usa `SafeAreaView` **+ scrim** absoluto: con edge-to-edge el
    `ScrollView` seguía pintando bajo la barra de estado.
  - El esquema se deriva del fondo resuelto (`useThemeColor`) y `auto` delega
    en `Uniwind.setTheme("system")`: `useColorScheme()` no emitía el cambio de
    sistema en el emulador, dejando la app clara sobre sistema oscuro.
  - `--success` (`#15803d`) y `--warning` (`#b45309`) se oscurecieron en claro
    para que también cumplan AA como texto.
  - Foco de inputs: se sobreescribe por plataforma
    (`android:focus:border-foreground`, `ios:focus:outline-foreground`) porque
    HeroUI usa `focus:border-accent` y se confundía con `isInvalid`.
  - `ActionButton` lee el color del spinner con `useThemeColor`: los portales de
    HeroUI (`BottomSheet`/`Dialog`/`Menu`) no heredan `ThemeProvider` en Android.
  - El botón "deshabilitado" se eliminó de la práctica: Inicio valida al pulsar
    y muestra `FieldError` (sin toast duplicado).
- **Pendiente**: arte propio del icono/splash (solo fondos).
- Verificado en claro/oscuro, tema forzado y auto, con teclado abierto.
