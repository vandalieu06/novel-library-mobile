---
code: "06"
title: "Pulido de UI round 2: appbar nativo, drawer de filtros, cards limpias y escala tipográfica"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/app/_layout.tsx
  - src/app/novel/[slug].tsx
  - src/app/(tabs)/books.tsx
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/settings.tsx
  - src/app/settings/statistics.tsx
  - src/app/settings/about.tsx
  - src/components/novel-card.tsx
  - src/components/back-bar.tsx
  - package.json
  - docs/arquitectura.md
---

# 06 — Pulido de UI round 2 (feedback del usuario)

## Purpose

Segunda tanda de pulido tras revisar 05: appbar nativo en las pantallas de
stack, search + filtros compactados con un Drawer, cards sin métricas y una
escala tipográfica estricta documentada (nada más grande que el título).

## Context

- v1.0.0 cerrada (01-05 completed). El usuario detecta: el back-link custom
  no es nativo, la fila de búsqueda+filtros ocupa demasiado, las cards de
  novelas llevan ruido (caps + barras de progreso) y hay textos que superan
  en tamaño a los títulos.

## Proposed change

1. **Appbar nativo** (expo-router / react-navigation):
   - Root `_layout`: `Stack` con `screenOptions` tematizados con
     `useColorScheme` (headerStyle `#ffffff`/`#121215`, title color).
   - `novel/[slug]`, `settings/statistics`, `settings/about`: `headerShown:
     true` con título (el de novela dinámico vía `<Stack.Screen options>`
     dentro de la pantalla).
   - **Fuera** `BackBar` custom (componente + usos); el back ahora lo pone la
     barra nativa. Los tabs siguen con su barra inferior nativa.
2. **Filtros en Drawer + buscador compacto** (`books.tsx`):
   - Una sola fila: `SearchField` compacto (flex-1) + botón "Filtros" con
     icono (funnel) que abre un **BottomSheet** (@gorhom/bottom-sheet, peer
     opcional de HeroUI, JS puro sin rebuild).
   - Dentro del sheet: switches "Solo traducidas" y "Solo PDF", y
     segmented de orden (Recientes/Título). Cambios en vivo; **badge con el
     nº de filtros activos** en el botón.
   - Se eliminan las filas de chips del header.
3. **Cards limpias** (`novel-card.tsx`): cover + título (2 líneas) +
   autor + chips (ES/Web). **Fuera** barra de progreso y texto "caps.".
4. **Escala tipográfica** (documentada en `docs/arquitectura.md` y aplicada):
   - Título de página: **text-2xl bold** (24) — uno por pantalla.
   - Título de sección: **text-lg semibold** (18).
   - Título de card/hero: **text-base semibold** (16).
   - Cuerpo: **text-sm** (14). Caption/meta/labels/chips: **text-xs** (12).
   - Cifras destacadas (stats): text-xl semibold (20) — bajo el título.
   - "Acerca de": el título de la novela en detalle lo lleva el appbar nativo;
     el hero pierde su texto duplicado. Page→content gap tokens siguen la
     regla de 05.
5. Detalle de implementación: detalle/statistics/about pierden su bloque
   de título (locals) a favor del appbar nativo; settings (tab) conserva su
   título en pantalla.

## Technical decision

- `@gorhom/bottom-sheet` como peer declarado por HeroUI para BottomSheet;
  sin código nativo → sin rebuild. Se usa el `BottomSheet` heroui sobre el
  sheet de @gorhom según la doc del MCP.
- Header nativo tematizado con `useColorScheme` + hex (igual que la barra de
  tabs: las CSS vars no llegan a las barras de navegador).
- `back-bar.tsx` se elimina (chore dentro de la spec, llega a no usarse).

## Affected files

(listados en frontmatter; incluye eliminación de `back-bar.tsx`)

## Tests

- tsc + lint; visual: header nativo con back en detalle/estadísticas/about,
  drawer con filtros en vivo y badge, cards limpias, jerarquía tipográfica
  en claro y oscuro.

## Acceptance criteria

- [ ] Back nativo (sin BackBar custom) en detail/statistics/about con título correcto.
- [ ] Search compacta en una fila con botón "Filtros" que abre drawer; filtros en vivo; badge.
- [ ] Cards sin "caps." ni barras.
- [ ] Escala tipográfica documentada y aplicada; ningún texto supera al título de página fuera de cifras destacadas a text-xl.
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Extensión (round 3 — feedback: cards y drawer)

1. **Cards menos largas**: la cover pasa de `aspect-[2/3]` a `aspect-[3/4]` (más
   compacta en 3 columnas) y el gap interno baja a `gap-1.5`; el título queda
   en 2 líneas máximo.
2. **BottomSheet mejor compuesto**: `p-5` + `pb-10` (safe gestual), título
   `text-lg` + descripción `text-xs`, filas de switch con label + caption
   (`text-sm`/`text-xs`) y `gap-4` entre ellas, `Separator` antes del bloque
   Orden, y el segmented de Orden alineado a la izquierda con `gap-2` y su
   caption `text-xs`.
3. Jerarquía de tamaños del sheet alineada a los tokens (nada supera al
   título del sheet; captions en 12).

**ACs añadidos**:
- [ ] Card compacta (cover 3:4) sin saltos de alto raros en 2/3/4 columnas.
- [ ] Sheet con padding y espaciados consistentes; segmentado de Orden legible.
- [ ] tsc + lint en verde y commit del fix referenciando spec 06.
