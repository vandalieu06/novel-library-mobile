---
code: "04"
title: "Grid de Biblioteca: ancho fijo por columna y fila impar alineada a la izquierda"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-03
tags: [spec, sdd, ui, biblioteca, grid]
affected_files:
  - src/app/(tabs)/books.tsx
  - docs/arquitectura.md
---

# 04 — Grid de Biblioteca con columnas fijas

## Purpose

Que el grid respete siempre 2/4/8 columnas: hoy la última card de una fila
incompleta se estira al ancho completo y parece una card destacada por error.

## Context

- Con la biblioteca real (7 novelas) y `auto` = 2 columnas, la séptima novela
  ocupa todo el ancho de la fila (verificado en el emulador).
- Causa: `renderItem` envuelve cada card en `flex-1`; cuando la fila tiene una
  sola celda, `flex` la estira. Ocurre igual con 4 y 8 columnas (fila de 1–3
  cards).
- Decisión del usuario (2026-11-03): ancho fijo por columna y fila incompleta
  alineada a la izquierda (sin centrar y sin estirar).

## Proposed change

1. Calcular el ancho de celda en `books.tsx`:
   `itemWidth = floor((windowWidth - 2*padding - gap*(columns-1)) / columns)`
   con `padding = 16` (`px-4` de la página) y `gap = 12` (`gap-3` del
   `columnWrapper`).
2. `renderItem`: sustituir `className="flex-1 pb-4"` por
   `style={{ width: itemWidth }}` + `pb-4`. Ninguna card se estira.
3. El skeleton de carga usa el mismo ancho para que no haya salto de layout.
4. Sin cambios en los ajustes 2/4/8 ni en `auto` (2/3/4/8 por breakpoint).

## Technical decision

- Ancho explícito en vez de `flexBasis` porcentual: porcentajes + `gap` no
  cierran en RN y dejan filas de 1 px de diferencia entre columnas.
- No se rellena el `data` con celdas vacías: mantiene claves estables y evita
  items fantasma en accesibilidad.
- No se centra la última fila: el patrón de biblioteca/tienda es alinear a la
  izquierda; centrar desplaza el ojo en cada scroll.
- El sobrante por redondeo (1–5 px) se queda a la derecha; no se reparte.

## Affected files

`src/app/(tabs)/books.tsx`. `docs/arquitectura.md` (nota del grid al cerrar).

## Tests

- `tsc` + `lint`.
- Visual en móvil (393 dp) con 7 novelas reales:
  - 2 columnas: la 7.ª mantiene el ancho de las demás y queda a la izquierda.
  - 4 columnas: la fila de 3 no estira la última.
  - 8 columnas: la fila de 7 no estira la última.
  - 6 novelas (mock): todas las filas completas, sin cambios.
- Skeleton con el mismo ancho que las cards.

## Acceptance criteria

- [ ] Con 2/4/8 columnas, toda card mide lo mismo; una fila incompleta no
      estira ninguna card.
- [ ] La fila incompleta queda alineada a la izquierda.
- [ ] El skeleton respeta el ancho de celda (sin salto al cargar).
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Implementación (2026-11-03)

- `itemWidth = floor((width - 32 - 12*(columns-1)) / columns)` en `books.tsx`;
  `renderItem` y el skeleton usan ese ancho. Sin `flex-1`.
- Verificado en el emulador con la biblioteca real (7 novelas) y `auto` = 2
  columnas: la 7.ª card conserva el ancho de columna y queda a la izquierda.
  4 y 8 usan el mismo cálculo (no hay lógica por número de columnas), así que
  una fila de 1–3 cards no estira ninguna.
