---
code: "01"
title: "Fundamentos Material 3: tokens, tipografía, chrome y componentes base"
project: "novel-library-mobile"
status: completed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, tokens, material3, a11y]
affected_files:
  - global.css
  - app.json
  - src/lib/theme.tsx
  - src/components/screen.tsx
  - src/components/action-button.tsx
  - src/components/segmented-field.tsx
  - src/components/progress-bar.tsx
  - src/components/app-bar.tsx
  - src/components/tab-row.tsx
  - src/components/list-card.tsx
  - src/app/_layout.tsx
  - docs/arquitectura.md
---

# 01 — Fundamentos Material 3

## Purpose

Sustituir la base visual genérica de la 0.3.0 por el sistema Material 3 del
prototipo B2: superficies neutras, accent terracota con roles separados
(relleno vs texto), tipografía del sistema, radios y chrome Android. Esta spec
no reestructura pantallas; deja los tokens y componentes que consumen 02–06.

## Context

La 0.3.0 arregló contraste, escala y tema resuelto, pero mantiene un aspecto
intercambiable: zinc + crimson, tarjetas, radios 8/12, título 24/700 y una
tipografía plana. El usuario aprobó B2 en
`prototypes/design-directions/?variant=native` y pidió Android como plataforma
principal.

En oscuro, el prototipo usaba un único accent pastel para CTA, tabs y textos;
eso hacía que el botón pareciera lavado y que algunos textos no pasaran AA.
B2 separa **relleno de marca** (`--accent`) y **texto/estado** (`--accent-ink`).

## Proposed change

### Tokens

Mantener el patrón de `global.css`: `@variant light` y `@variant dark` anidados
dentro de `:root` (Uniwind descarta las variantes fuera de `:root`).

| Rol | Claro | Oscuro |
| --- | --- | --- |
| `background` | `#fbf8f6` | `#121110` |
| `surface` | `#ffffff` | `#1d1b1a` |
| `surface-secondary` | `#f2ece8` | `#262320` |
| `surface-tertiary` | `#e8e0db` | `#322e2b` |
| `foreground` | `#1d1b1a` | `#ede8e4` |
| `muted` | `#6b6561` | `#b0a8a3` |
| `muted-2` | `#8a8480` | `#8a8480` |
| `outline` | `#d8cfc9` | `#6b625c` |
| `accent` (relleno) | `#a8433c` | `#b84a42` |
| `accent-foreground` | `#ffffff` | `#ffffff` |
| `accent-soft` | `#f7e7e3` | `#3a2421` |
| `accent-ink` (texto/estado) | `#a8433c` | `#f0a9a2` |
| `success` | `#356b47` | `#8fbf9d` |
| `danger` | `#b3372f` | `#e5736a` |
| `focus-ring` | `#1d1b1a` | `#ede8e4` |

Mapa a HeroUI: `--background`, `--foreground`, `--surface`,
`--surface-secondary`, `--surface-tertiary`, `--muted`, `--default` y
`--accent` conservan sus nombres; `--primary` = `accent`; `--accent-foreground`
y `--primary-foreground` = `accent-foreground`; `--border`/`--separator` =
`outline`; `--radius: 12px`. El foco sigue siendo neutro (`focus-ring`), no el
accent, para no confundirlo con error.

Contrastes objetivo: accent claro sobre blanco 5.9:1; accent oscuro con blanco
5.1:1; accent-ink sobre `#121110` 9.8:1; outline oscuro sobre `#121110` 3.2:1;
muted sobre fondo 5.0:1 / 8.4:1.

### Tipografía

Sin fuente propia: el sistema (Roboto en Android, SF Pro en iOS). Escala:

| Clase | Tamaño / línea | Peso | Uso |
| --- | --- | --- | --- |
| `.t-page` | 22 / 28 | 500 | título de top app bar y detalle |
| `.t-section` | 16 / 24 | 500 | títulos de sección |
| `.t-card` | 14 / 20 | 500 | título de card/novela |
| `.t-body` | 16 / 24 | 400 | cuerpo |
| `.t-label` | 14 / 20 | 500 | labels y acciones |
| `.t-meta` | 12 / 16 | 400 | metadatos y ayudas |
| `.t-figure` | 22 / 28 | 600 | cifras destacadas |

### Componentes base

- **`AppBar`** (`src/components/app-bar.tsx`): altura 56, título 22/28 500,
  acciones de 40×40 con icono Material 24, `back` opcional. Sin sombra; fondo
  `background`.
- **`TabRow`** (`src/components/tab-row.tsx`): 48 de alto, label 14/20 500,
  subrayado activo de 3 px con `accent-ink`, borde inferior `outline`,
  scroll horizontal.
- **`ListCard` / `ListRow`** (`src/components/list-card.tsx`): card de radio 16,
  `surface`, borde 1 px `outline`; fila de 56, padding 16, separador inset 16;
  `StatusDot` de 8 px.
- **`SegmentedField`**: 40 de alto, borde 1 px, radio 20; seleccionado
  `accent-soft` + `accent-ink`; label 13/18 500. Se usa en Web/PDF y en las
  hojas de tema/densidad.
- **`ActionButton`**: primario `accent` + `accent-foreground`, altura 48, radio
  24, label 15/20 500; secundario tonal `accent-soft`/`accent-ink`; ghost;
  danger. `loading` mantiene el contraste (sin opacidad de disabled).
- **`ProgressBar`**: 4 px, track `surface-tertiary`, relleno `accent-ink`;
  variante `success`.
- **`Screen`**: safe area, scrim de status bar y `StatusBar` con el esquema
  resuelto; sin cambios de navegación.

### Radios y elevación

Covers 8, campos 12, cards 16, botones 24, sheets 24. Una sola elevación: borde
1 px; sin sombras salvo el sheet (sombra superior suave).

### Splash y sistema

`app.json`: splash claro `#fbf8f6`, oscuro `#121110`; adaptive background
Android `#121110`; se mantiene el emblema. Cambiar splash/icono exige prebuild y
rebuild (`make android` o `make android-release`).

## Technical decision

- Se mantiene **HeroUI Native + Expo Router + Uniwind**; no se añaden
  dependencias ni se migra a `@expo/ui` en esta versión. El chrome Material se
  construye con componentes propios y `tabBarVariant: "material"` de Expo
  Router.
- El accent se separa en dos tokens; el relleno nunca se usa como texto.
- El foco neutro evita confundir foco con error.
- La escala tipográfica es la de Android; iOS usará los mismos tokens y la
  tipografía del sistema.
- Los componentes nuevos se prueban primero en móvil; el tablet los reutiliza
  en 06.

## Affected files

`global.css`, `app.json`, `src/lib/theme.tsx`, `src/app/_layout.tsx`,
`src/components/screen.tsx`, `src/components/action-button.tsx`,
`src/components/segmented-field.tsx`, `src/components/progress-bar.tsx`;
nuevos `src/components/app-bar.tsx`, `src/components/tab-row.tsx`,
`src/components/list-card.tsx`; `docs/arquitectura.md` al cierre.

## Tests

**Emuladores**: solo `mobile` → **`Expo`** (1080×2400, Android 37, portrait).
No lanzar `Medium_Tablet`, `Pixel_10` ni `pixel_4a_teikit`.
Arranque: `emulator -avd Expo` solo si no está ya; al terminar
`adb -s <serial> emu kill`.

1. `npx tsc --noEmit` y `npx expo lint` sin errores nuevos.
2. `make devices`; `make reverse`; `make start` (o `make deep-link` si el dev
   client ya está instalado). No rebuild salvo por splash/icono.
3. Claro y oscuro: revisar fondo, superficie, borde, muted, accent y success en
   una pantalla de cada una (Biblioteca, Descargar, Detalle, Ajustes).
4. Comprobar que el botón primario en oscuro es terracota profundo con texto
   blanco, no pastel; que tabs/enlaces usan `accent-ink`; que el borde de cards
   se ve.
5. Revisar targets de 48 dp y que el texto no se corta al 100 %.
6. Rebuild y verificar splash/adaptive background si se aplicó el cambio de
   `app.json`.
7. `adb -s <serial> emu kill` al terminar.

## Acceptance criteria

- [x] Los tokens claro/oscuro coinciden con la tabla y el prototipo B2.
- [x] CTA, badges y switch usan `accent`; tabs, enlaces y progreso usan
      `accent-ink`; ningún texto usa `accent` como color de texto en oscuro
      (además `accent-soft-foreground` pasa a `accent-ink`: los soft de HeroUI
      quedaban ilegibles en oscuro).
- [x] Contraste AA en las parejas de la tabla (danger en oscuro usa
      `danger-foreground` `#121110` para rellenos).
- [x] Tipografía del sistema, escala 22/16/14/12; sin fuente propia.
- [x] `ActionButton`, `AppBar`, `TabRow`, `ListCard`, `SegmentedField` y
      `ProgressBar` existen con las medidas/radios indicados.
- [x] `theme: "auto"` sigue siendo el valor por defecto y el arranque no
      parpadea.
- [x] `npx tsc --noEmit` y `npx expo lint` pasan.
- [x] Splash/adaptive background actualizados y verificados tras rebuild
      (`prebuild` + `expo run:android`; splash claro `#fbf8f6`, oscuro
      `#121110` con `cmd uimode night`, iconBackground `#121110`).
- [x] Solo se lanzó `Expo` y se apagó al terminar.

## Notas de cierre (2026-11-07)

- Se usó una ruta temporal `src/app/preview.tsx` para validar los componentes
  base sobre el emulador; se eliminó antes de cerrar (no queda en `src/`).
- Los componentes no consumidos por pantallas todavía (AppBar/TabRow/ListCard)
  se validaron con el preview y quedan listos para 02–06.
- El emulador falló dos veces durante la sesión (ADB "error: closed" y SIGSEGV
  al terminar la instalación); tras reiniciar el AVD la build de 45 s instaló
  sin problemas y toda la verificación es sobre el build regenerado.
- La densidad del grid quedó como la dejó el usuario ("4"); no se tocó.
