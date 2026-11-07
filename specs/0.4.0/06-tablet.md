---
code: "06"
title: "Tablet: rail, biblioteca de 3 columnas y panel de detalle"
project: "novel-library-mobile"
status: proposed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, tablet, responsive, material3]
affected_files:
  - "src/app/(tabs)/_layout.tsx"
  - "src/app/(tabs)/index.tsx"
  - "src/app/(tabs)/settings.tsx"
  - "src/app/novel/[slug].tsx"
  - src/components/detail-panel.tsx
  - src/components/detail-content.tsx
  - src/components/novel-card.tsx
  - src/components/settings/server-form.tsx
  - src/lib/grid.ts
  - src/lib/layout.ts
  - docs/arquitectura.md
---

# 06 — Tablet

## Purpose

Adaptar B2 a tablet Android: navigation rail, biblioteca de **3 columnas** y
panel de detalle; Ajustes con panel lateral de servidor. Nada de móvil estirado
ni web encogida.

## Context

Hoy `(tabs)/_layout.tsx` usa un rail de 96 a partir de 768 y las pantallas
centran el contenido a 600/760. La biblioteca queda a ancho completo y el
detalle es una ruta completa. B2 propone:

- Rail de 88 con 3 destinos y labels.
- Biblioteca de 3 columnas + panel de detalle de 340 a partir de 1024.
- Ajustes con hub + panel lateral de servidor.
- 768–1023: rail + 3 columnas, sin panel; el detalle sigue siendo ruta.

Referencias: `?variant=native&screen=books&width=tablet` y
`?variant=native&screen=settings&width=tablet`.

## Proposed change

### Breakpoints y medidas

| Constante | Valor | Uso |
| --- | --- | --- |
| `RAIL_DP` | 768 | a partir de aquí: rail, no bottom nav |
| `SPLIT_DP` | 1024 | a partir de aquí: panel de detalle/servidor |
| `RAIL_WIDTH` | 88 | ancho del rail |
| `PANEL_WIDTH` | 340 | detalle / servidor |
| `PAGE_CONTENT` | 640 | descargar, ajustes, subpáginas |

El ancho útil del grid es:

```
contentWidth = windowWidth - (isTablet ? RAIL_WIDTH : 0) - (hasPanel ? PANEL_WIDTH : 0)
```

`useWindowDimensions` decide el rail/panel; la grid usa `contentWidth`, no el
ancho de ventana. Así no se cuela contenido bajo el rail ni bajo el panel.

### Rail

- `Tabs` con `tabBarPosition: "left"` a partir de 768 y
  `tabBarVariant: "material"`.
- Ancho 88; icono 24 + label 11/14; activo `accent-ink` con indicador
  `accent-soft`; inactivo `muted`; borde derecho `outline`.
- Orden: Biblioteca, Descargar, Ajustes.
- En tablet no se muestra bottom nav; el gesto de Android va al pie.

### Biblioteca en tablet

- 3 columnas en 768–1023 y también en >=1024 con panel (3 es la decisión
  aprobada).
- `auto` = 2 en móvil, 3 en tablet; `2/4/8` manual se respeta, pero con panel
  se capa a 4 para no dejar cards ilegibles.
- `FlatList` con `key={columns}` y `itemWidth` calculado con `contentWidth`.
- A partir de 1024: `DetailPanel` de 340 a la derecha; la selección de card
  actualiza el panel. Al cargar, se selecciona la primera novela; al refrescar,
  se conserva la selección; si desaparece, se selecciona la primera visible.
- 768–1023: sin panel; tap en card → `/novel/[slug]`.
- El panel de 1024 usa `DetailContent compact`: cover 104×156, título 18/23,
  progreso, 3 tomos, CTA “Sincronizar” de 44. El detalle completo sigue
  disponible en la ruta para móvil/portrait.

### Ajustes en tablet

- Hub en el área principal (`PAGE_CONTENT`), igual que 05.
- A partir de 1024: `ServerForm` en panel lateral de 340; la fila “Servidor”
  queda seleccionada. Tema/densidad siguen en sheets.
- 768–1023: hub sin panel; servidor en sheet.

### Descargar en tablet

- Rail + contenido `PAGE_CONTENT` 640, centrado; sin split. El formulario y los
  jobs no se estiran a 1280.

### Orientación

- Landscape (1280×800 lógico): rail + 3 columnas + panel (>=1024).
- Portrait (800×1280 lógico): rail + 3 columnas, **sin panel**; tap a card
  abre el detalle completo.
- El layout no debe asumir una orientación; `useWindowDimensions` decide.

## Technical decision

- `src/lib/grid.ts` expone `resolveGridColumns(contentWidth, setting, hasPanel)`
  y `src/lib/layout.ts` las constantes de rail/panel/página. Se elimina el
  cálculo de ancho de ventana para la grid.
- El rail es el de Expo Router, no un componente propio; se ajustan
  `tabBarStyle`, ancho y labels. Esto conserva el comportamiento nativo de
  tabs.
- `DetailPanel` es un componente nuevo que reutiliza `DetailContent compact` de
  04; no duplica la lógica de descarga.
- La selección del panel es estado local de Biblioteca; no se añade store
  global.
- El panel lateral de Ajustes reutiliza `ServerForm` de 05.
- El web output usa el mismo layout de tablet; no se crea un shell web aparte.
- No se toca el móvil salvo los breakpoints compartidos; 02–05 lo cubren.

## Affected files

`(tabs)/_layout.tsx`, `(tabs)/index.tsx`, `(tabs)/settings.tsx`,
`novel/[slug].tsx`; nuevo `components/detail-panel.tsx`; `detail-content.tsx`,
`novel-card.tsx`, `settings/server-form.tsx`; `lib/grid.ts`, `lib/layout.ts`;
`docs/arquitectura.md` al cierre.

## Tests

**Emuladores**: solo `tablet` → **`Medium_Tablet`** (2560×1600, Android 35,
landscape; 1280×800 lógico). No lanzar `Expo`, `Pixel_10` ni
`pixel_4a_teikit`. Arranque: `emulator -avd Medium_Tablet` solo si no está ya;
al terminar `adb -s <serial> emu kill`.

1. `npx tsc --noEmit` y `npx expo lint`.
2. `make devices`; `make reverse`; `make start`/`make deep-link`.
3. Landscape: rail de 88 con 3 destinos; biblioteca 3 columnas; panel de
   detalle; seleccionar otra card actualiza el panel; 3 tomos; “Sincronizar”.
4. Ajustes: hub + panel de servidor; tema/densidad en sheets; probar/guardar.
5. Descargar: rail + contenido 640; formulario y jobs sin estirarse.
6. Rotar a portrait (800×1280): rail + 3 columnas sin panel; tap a card abre el
   detalle completo; Ajustes sin panel; volver a landscape.
7. Claro/oscuro; títulos largos; sin overflow bajo el rail/panel; targets 48.
8. `adb -s <serial> emu kill` al terminar. No lanzar el móvil; si se sospecha
   una regresión móvil, se anota para 07 y se valida allí, no aquí.

## Acceptance criteria

- [ ] A partir de 768: rail de 88 y sin bottom nav.
- [ ] Biblioteca de 3 columnas; ancho calculado con `contentWidth`, sin solaparse
      con rail/panel.
- [ ] A partir de 1024: panel de detalle de 340 con selección y CTA.
- [ ] 768–1023: sin panel; card abre el detalle completo.
- [ ] Ajustes con panel lateral de servidor a partir de 1024.
- [ ] Descargar limitado a 640, sin estirarse.
- [ ] Portrait y landscape correctos; sin asumir orientación.
- [ ] Claro/oscuro y targets 48; `npx tsc --noEmit` y `npx expo lint`.
- [ ] Solo se lanzó `Medium_Tablet` y se apagó al terminar (sin `Expo` en
      paralelo).
