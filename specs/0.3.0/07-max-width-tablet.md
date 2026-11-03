---
code: "07"
title: "Tablet: ancho máximo de contenido en formularios y pantallas de lectura"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-03
tags: [spec, sdd, ui, tablet, layout]
affected_files:
  - src/lib/layout.ts
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/settings.tsx
  - src/app/settings/statistics.tsx
  - src/app/settings/about.tsx
  - src/app/novel/[slug].tsx
  - docs/arquitectura.md
---

# 07 — Ancho máximo de contenido en tablet

## Purpose

Evitar que los formularios y pantallas de contenido se estiren de borde a borde
en tablet (1280 dp): limitar el ancho y centrar el contenido, manteniendo el
grid de Biblioteca a ancho completo.

## Context

Con el rail lateral (spec 06) el contenido dispone de ~1180 dp. Inicio y Ajustes
pintan inputs y botones de más de 1000 dp, lo que se lee mal y aleja las
etiquetas de sus controles. El diseño móvil está pensado para 16 px de gutter y
una sola columna, no para ese ancho.

## Proposed change

1. `src/lib/layout.ts` con dos constantes:
   - `PAGE_CONTENT = "w-full max-w-[600px] self-center"`.
   - `WIDE_CONTENT = "w-full max-w-[760px] self-center"`.
2. Aplicar en el `contentContainerClassName` del ScrollView:
   - Inicio, Ajustes, Estadísticas y Acerca de → `PAGE_CONTENT`.
   - Detalle de novela → `WIDE_CONTENT` (hero + listas de tomos).
3. Biblioteca se queda a ancho completo: es un grid y aprovecha las columnas.
4. En móvil `max-w-*` no aplica (el ancho ya es menor), así que no cambia nada.

## Technical decision

- Se limita el **contenedor de contenido** del ScrollView con `w-full max-w-*`
  + `self-center`; no se toca cada bloque, así todos los hijos comparten el
  mismo eje y el gutter `px-4` sigue funcionando.
- anchos explícitos de 600 dp para formularios y 760 dp para el detalle
  por el ancho del hero (cover 120 + texto) y las filas de EPUB.
- No se añade un wrapper nuevo por pantalla ni se duplican estilos.
- El rail (96 dp) queda fuera del área de contenido, por lo que el centrado es
  respecto al espacio restante, no a la pantalla completa.

## Affected files

`src/lib/layout.ts` (nuevo), `src/app/(tabs)/index.tsx`,
`src/app/(tabs)/settings.tsx`, `src/app/settings/statistics.tsx`,
`src/app/settings/about.tsx`, `src/app/novel/[slug].tsx`.
`docs/arquitectura.md` al cerrar.

## Tests

- `tsc` + `lint`.
- Tablet 1280×800: Inicio, Ajustes, Estadísticas y Acerca de centrados a
  672 dp; detalle a 768 dp; el fondo ocupa el resto.
- Móvil (540 dp): sin cambios, contenido a ancho completo.
- Biblioteca: el grid sigue ocupando todo el ancho disponible.

## Acceptance criteria

- [ ] En tablet, Inicio/Ajustes/Estadísticas/Acerca de no superan 600 dp y
      quedan centrados.
- [ ] El detalle no supera 760 dp.
- [ ] En móvil no cambia nada.
- [ ] El grid de Biblioteca sigue a ancho completo.
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Implementación (2026-11-03)

- Constantes en `src/lib/layout.ts` con valores explícitos (`max-w-[600px]`,
  `max-w-[760px]`): `max-w-2xl` de Uniwind resolvía a ~500 dp por su base de
  `rem`, demasiado justo.
- Aplicado a Inicio, Ajustes, Estadísticas, Acerca de (600) y detalle (760);
  Biblioteca sigue a ancho completo.
- Verificado en tablet 1280×800: columnas centradas, rail intacto y sin
  cambios en móvil.
