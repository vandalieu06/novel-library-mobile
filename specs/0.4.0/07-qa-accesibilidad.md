---
code: "07"
title: "QA, accesibilidad, estados y cierre visual del rediseño"
project: "novel-library-mobile"
status: proposed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, qa, a11y, tablet, mobile]
affected_files:
  - global.css
  - "src/app/(tabs)/index.tsx"
  - "src/app/(tabs)/download.tsx"
  - "src/app/(tabs)/settings.tsx"
  - "src/app/novel/[slug].tsx"
  - src/app/settings/statistics.tsx
  - src/app/settings/about.tsx
  - docs/arquitectura.md
  - specs/0.4.0/00-changelog.md
---

# 07 — QA y accesibilidad

## Note sobre la tab bar (propuesta de resolución)

**Qué significa "bar vendido"**: Expo Router incluye una copia modificada
("vendored") del `BottomTabBar` de react-navigation
(`expo-router/build/react-navigation/bottom-tabs/views/BottomTabBar.js`) con
opciones extra del router. Esa copia adjetiva `tabBarVariant: "material"`
(bar Material 3) **solo cuando el bar está a los lados** (`tabBarPosition:
"left"/"right", rail): en franja inferior ("bottom") lanza
`The 'material' variant is only supported when 'tabBarPosition' is set to
'left' or 'right'`, como vimos en 02. Por eso la franja inferior de 0.4.0 usa
`tabBarVariant: "uikit"` con iconos Material y colores de token.

**Qué revisa 07**: el look real de la franja inferior (hoy parece un bar
uikit de iOS con iconos Material; no es un *navigation bar* de Material 3 con
indicador activo tipo pastilla). Decidir entre: (a) mantenerlo y ajustar
colores/altura/labels a B2; (b) usar un custom bar si B2 lo pide vs (c)
cubrir con SDK oficial más nuevo si Expo añade material en bottom. Dejar
explícito por qué se elige cada opción.

## Purpose

Cerrar 0.4.0 con una pasada transversal de calidad: navegación, estados,
contraste, Dynamic Type, targets, tablet y rendimiento. No añade features;
registra y corrige defectos encontrados en las specs 01–06.

## Context

01–06 cambian tokens, rutas, grid, Descargar, Detalle, Ajustes y tablet. Las
pruebas por spec cubren su superficie, pero falta una matriz única que compare
móvil/tablet, claro/oscuro, estados y accesibilidad. Esta spec es el gate antes
de marcar 0.4.0 como `completed`.

## Proposed change

- Matriz de verificación:
  - Pantallas: Biblioteca, Descargar, Detalle, Ajustes, Estadísticas, Acerca.
  - Temas: claro y oscuro.
  - Estados: carga, vacío, sin resultados, error 401, error de red, job
    activo/error, novela sin tomos.
  - Tamaño de fuente: 1.0, 1.3 y 2.0 (`adb shell settings put system
    font_scale …`).
  - Tablet: landscape 1280×800 y portrait 800×1280.
- Correcciones permitidas: solo defectos de las specs 01–06 (clipping,
  contraste, target < 48, texto truncado, orden de foco, estado que falta). No
  se rediseña ni se añaden pantallas.
- Capturas finales: una por pantalla/tema y una de tablet landscape/portrait en
  `/tmp/opencode/novel-library-0.4.0/`.
- Actualizar `docs/arquitectura.md` y el changelog al cerrar.

## Technical decision

- Se usa el dev client ya instalado; no se añaden dependencias. Si 01 cambió
  splash/icono, el rebuild se hace una vez antes de esta spec.
- La matriz de emuladores es **secuencial** para no saturar la RAM: primero
  móvil, se apaga, después tablet. Nunca dos `emulator` a la vez.
- La revisión de accesibilidad es manual + tokens: contraste de las parejas de
  01, TalkBack en Android, targets de 48 dp, orden de foco y textos
  alternativos de portadas.
- La performance se comprueba en el flujo real: scroll de biblioteca, cambio
  de tabs, apertura de detalle, sheet y teclado. No se añaden memoizaciones
  preventivas.
- Si un defecto requiere cambio de comportamiento, se anota como enmienda en
  la spec dueña (02–06), no aquí.

## Affected files

`global.css`; `(tabs)/index.tsx`, `(tabs)/download.tsx`, `(tabs)/settings.tsx`,
`novel/[slug].tsx`, `settings/statistics.tsx`, `settings/about.tsx`; `docs/arquitectura.md`;
`specs/0.4.0/00-changelog.md` al cierre.

## Tests

**Emuladores**: `mobile` y `tablet` **secuencialmente**.
1. `mobile` → **`Expo`** (1080×2400, Android 37, portrait). Verificar, capturar
   y apagar.
2. `tablet` → **`Medium_Tablet`** (2560×1600, Android 35, landscape; 1280×800
   lógico). Verificar landscape, rotar a portrait, capturar y apagar.
No lanzar `Expo` y `Medium_Tablet` a la vez. No usar `Pixel_10` ni
`pixel_4a_teikit`.

```bash
# móvil
emulator -avd Expo
make devices && make reverse && make start   # o make deep-link
# ... verificar ...
adb -s <serial> emu kill

# tablet (solo después de apagar el móvil)
emulator -avd Medium_Tablet
make devices && make reverse && make start
# ... verificar landscape y portrait ...
adb -s <serial> emu kill
```

### Checklist

1. `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` sin errores nuevos.
2. Navegación: `/` Biblioteca; tab Descargar; detalle push; back; Ajustes hub;
   estadísticas/acerca; el back no vuelve a estados imposibles.
3. Biblioteca: 2 columnas móvil / 3 tablet; búsqueda, tabs, filtros, sort,
   vacío, sin resultados, 401, red, pull-to-refresh, skeleton.
4. Descargar: web y PDF; URL inválida; job; cancelar; opciones; teclado;
   rehidratación.
5. Detalle: header, overflow, sync, retraducir, tamaño, descargar tomo/todos,
   share, job inline, 404, sin tomos.
6. Ajustes: hub, servidor (demo/config/ok/error, test, guardar), tema,
   densidad, stats, acerca.
7. Tablet: rail, 3 columnas, panel, selección, settings side, portrait sin
   panel.
8. Accesibilidad: `font_scale` 1.3 y 2.0 en Biblioteca, Detalle y Ajustes; sin
   clipping; TalkBack lee portadas, tabs, botones y estados; targets ≥ 48;
   contraste de tokens; `prefers-reduced-motion`/Reduce Motion en Android.
9. Estados: forzar API caída/token inválido; comprobar mensajes y recuperación.
10. Rendimiento: scroll de 66 tomos, cambio de tabs, apertura de sheet; sin
    saltos ni tirones evidentes.
11. Capturas y limpieza: `adb -s <serial> emu kill`; Metro detenido.

## Acceptance criteria

- [ ] Matriz móvil/tablet, claro/oscuro y estados sin defectos críticos.
- [ ] Font scale 1.3/2.0 sin clipping en las pantallas clave.
- [ ] TalkBack con etiquetas útiles; targets ≥ 48; contraste AA.
- [ ] Sin regresiones de navegación ni de rutas (`/` Biblioteca, `/download`).
- [ ] Layout de tablet y portrait correctos; solo un emulador a la vez.
- [ ] `npx tsc --noEmit`, `npx expo lint` y `npx expo-doctor` pasan.
- [ ] `docs/arquitectura.md` y `00-changelog.md` actualizados al cerrar.
- [ ] 0.4.0 lista para `completed`; el usuario aprueba el cierre.
