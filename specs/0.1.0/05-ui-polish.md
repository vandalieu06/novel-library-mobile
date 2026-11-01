---
code: "05"
title: "Pulido de UI: grid de 3 columnas, filtros compactos, selector centrado, appbar en detalle y tokens de espaciado"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/lib/grid.ts
  - src/app/(tabs)/books.tsx
  - src/app/(tabs)/index.tsx
  - src/app/novel/[slug].tsx
  - docs/arquitectura.md
---

# 05 — Pulido de UI (feedback del usuario)

## Purpose

Aplicar el feedback visual post-spec 03: más densidad en Books, filtros menos
ruidosos, selector de origen mejor integrado en Inicio, back-navigation propia
en el detalle de novela y una **regla de espaciado documentada** para que el
layout no quede a ojo.

## Context

- La spec 03 quedó completed y se revisó en el emulador; el usuario detectó:
  bounce grid de 2 columnas (poca densidad), filtros que ocupan demasiado
  (3 filas de controles), selector Desdeweb/PDF desconectado del diseño y
  pegado a la descripción, detalle sin appbar de retroceso, y ausencia de
  regla clara de espaciados entre pantallas.
- La regla de espaciado se documenta en `docs/arquitectura.md` siguiendo el
  espíritu del block "Tokens"/"Layout" del web (`translate_novels/DESIGN.md`).

## Proposed change

1. **Grid Books — 3 columnas en móvil** (`src/lib/grid.ts`):
   `auto` ⇢ 3 columnas <768dp (antes 2), 4 ≥768dp y 8 ≥1200dp sin cambio.
2. **Books más respirable** (`books.tsx`):
   - Contenedor del grid con gutter generoso: `px-3` + `columnWrapperClassName="gap-3 px-3"`
     y separación vertical entre filas `pb-4` por tarjeta (antes 2/3).
   - **Filtros compactos**: de 3 filas a 2 —
     fila 1: SearchField (completa); fila 2: chips de filtro a la izquierda +
     Select de orden compacto (`size`-menor vía `className h-9`) alineado a la
     derecha con `flex-1` separador (antes la fila de orden era independiente
     y ocupaba su propia línea).
3. **Inicio — selector centrado y separado** (`index.tsx`):
   - `contentContainerClassName` de la página con `gap-4` (Separación entre la
     descripción y el bloque de tabs; ya no se pegan).
   - Tabs switch centrado: `Tabs.List` con `self-center` (la píldora se ajusta
     a su contenido y se centra, en lugar de arrancar pegada a la izquierda).
4. **Detalle — appbar de retroceso** (`novel/[slug].tsx`):
   Fila superior con `useSafeAreaInsets` + botón chevron-back + texto
   "Biblioteca" estilo back-link de la web; `router.back()` al pulsar.
   El del sistema sigue funcionando; ahora hay una vía visible.
5. **Tokens de espaciado** (`docs/arquitectura.md`, nueva sección "Tokens de
   espaciado") y auditoría de las tres pantallas para ajustarse:
   - Página: `px-4` + insets-safe-area top + `pb-12`.
   - Título de página → primer control: `pt-3`.
   - Bloques hermanos dentro de una página: `gap-4` (16).
   - Elementos en fila densa: `gap-2` (8) o `gap-3` (12).
   - Label/description ↔ control: `gap-1` (4) o `gap-1.5` (6).
   - Separación grande entre secciones distintas: `mt-4` / `gap-4`.
   - Repaso con los componentes existentes: no se inventan tamaños nuevos.

## Technical decision

- La regla de espaciado es documentación viva (como los tokens en la web);
  no se implementa con CSS vars porque el gutter del grid y los paddings són
  `className` directos — se vigila por revisión visual.
- El botón de retroceso usa `router.back()` (consistente con deep-link y
  tabs); no hardcode `/biblioteca` porque la pantalla también abre desde
  notificaciones/de/buscar en el futuro.
- Grid 3 col en móvil: las covers son `useWindowDimensions`-relativas, el
  NovelCard ya se adapta (texto 2 líneas + chips + barras).

## Affected files

- `src/lib/grid.ts` (breakpoints)
- `src/app/(tabs)/books.tsx` (gutters, filtros compactos)
- `src/app/(tabs)/index.tsx` (separación + selector centrado)
- `src/app/novel/[slug].tsx` (appbar de retroceso)
- `docs/arquitectura.md` (sección tokens de espaciado + estado)

## Tests

- `npx tsc --noEmit` + `npx expo lint`.
- Visual en emulador: Books en 3 col, filtros en 2 filas, Inicio con gap y
  selector centrado, detalle con appbar (tap de vuelta funciona).
- Dark y light side-by-side.

## Acceptance criteria

- [ ] Grid `auto` entrega 3 columnas en móvil.
- [ ] Los filtros y el orden caben en 2 filas, sin saltos de línea raros.
- [ ] Inicio: hay padding visible entre descripción y selector; selector centrado.
- [ ] Detalle: appbar con retroceso funcional.
- [ ] `docs/arquitectura.md` documenta los tokens de espaciado.
- [ ] tsc + lint en verde y commit al cerrar la spec.
