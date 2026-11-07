---
code: "04"
title: "Detalle: top bar, progreso, tomos y acciones"
project: "novel-library-mobile"
status: proposed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, detail, material3]
affected_files:
  - "src/app/novel/[slug].tsx"
  - src/components/detail-content.tsx
  - src/components/volume-row.tsx
  - src/components/progress-bar.tsx
  - src/components/cover-image.tsx
  - src/components/action-button.tsx
  - src/components/list-card.tsx
  - src/components/job-row.tsx
  - docs/arquitectura.md
---

# 04 — Detalle

## Purpose

Rehacer el detalle de novela con el lenguaje B2: header nativo, hero de
portada, progreso, CTA accent, tomos en lista y acciones en el menú del header.
Extraer el contenido para reutilizarlo en el panel de tablet de 06.

## Context

El detalle actual (`novel/[slug].tsx`) funciona pero mezcla header con título
largo, hero, dos barras, botones “Sincronizar”/“Más”, menú, alertas y listas de
tomos con el estilo 0.3.0. En B2 el header dice “Detalle” con back y overflow;
el título vive en el hero; la CTA es una píldora accent; los tomos son una
`ListCard` de filas 56.

Referencia: `?variant=native&screen=detail&theme=light&width=phone`.

## Proposed change

### Header

- Stack header nativo: `headerShown: true`, título “Detalle”, back nativo,
  `headerStyle` con `background`, `headerTintColor` `foreground`,
  `headerShadowVisible: false`.
- `headerRight`: icono overflow que abre el `Menu` existente con
  “Retraducir…” y “Tamaño de tomo…”.
- Se elimina el botón “Más” del cuerpo; la CTA principal es la única acción
  visible.

### Hero

- Cover 128×192, radio 8, `expo-image`.
- Título 22/28 500, máximo 4 líneas; autor 14/20 `muted`.
- Meta 12/16 `muted`: `Web|PDF · N por tomo · ES` (idioma si existe).
- Padding 16; separación 20 con el progreso.

### Progreso

- `ListCard` con dos filas de 56:
  - “Descargados” + `N / total` en 14/20 500; barra de 4 px con
    `accent-ink`.
  - “Traducidos” + `N / total`; barra `success`.
- Si no hay traducción, la fila de traducidos muestra `0 / total` y la barra
  vacía; no se oculta para mantener la simetría.

### Acción principal y jobs de acción

- “Sincronizar” primario accent, 48, radio 24, full width.
- Los jobs de sync/retraducir/tamaño se muestran como una `ListCard`/fila
  inline debajo de la CTA: spinner o icono de estado, “En cola/Trabajando/Listo/
  Error”, id y error; “Cancelar” cuando está activo. Se elimina el `Alert`.
- Al terminar un job, se recarga la novela (`load()`) como hoy.

### Tomos

- Sección “Tomos originales · N” con “Descargar todo” (tonal/ghost).
- `ListCard` de filas 56:
  - Rango `1–100` en 16/24; `EPUB` en 12/16 `muted`; icono download 20
    `accent-ink`.
  - Estado por fila: spinner al descargar, check al terminar, alert en error.
  - Press: descarga + share sheet (`openEpub`) como hoy.
- Si hay `epub_translated`, sección “Tomos traducidos · N” con la misma lista y
  `Descargar todo`.
- Se listan **todos** los tomos; no se trunca con “ver más” (el prototipo lo
  hacía solo por espacio).
- `downloadAll` mantiene el progreso `done/total` y no abre shares individuales.

### Estados

- Loading: skeleton de cover 128×192 + título + dos filas.
- Error/404: empty state con “Reintentar” y “Volver”.
- Novela sin tomos: fila “Aún no hay tomos generados”.

## Technical decision

- El header es el **stack header nativo**, no un top bar dibujado; así el back,
  el título y el overflow siguen el patrón Android.
- Se extrae `DetailContent` con props `compact?: boolean`:
  - `compact` = panel de tablet (06): cover 104×156, título 18/23, tres tomos y
    CTA de 44.
  - completo = pantalla de teléfono: cover 128×192, título 22/28, todos los
    tomos.
- Se conservan `download`, `downloadAll`, `epubLabel`, `followJob` y los
  `BottomSheet` de retraducir/tamaño; solo cambia la presentación.
- La CTA sigue siendo “Sincronizar” (no se introduce “Abrir” en 0.4.0).
- Las listas usan `ListCard`/`ListRow` de 01; no cards dentro de cards.

## Affected files

`src/app/novel/[slug].tsx`; nuevo `src/components/detail-content.tsx`;
`volume-row.tsx`, `progress-bar.tsx`, `cover-image.tsx`, `action-button.tsx`,
`list-card.tsx`, `job-row.tsx`; `docs/arquitectura.md` al cierre.

## Tests

**Emuladores**: solo `mobile` → **`Expo`** (1080×2400, Android 37, portrait).
No lanzar `Medium_Tablet`, `Pixel_10` ni `pixel_4a_teikit`.
Arranque: `emulator -avd Expo` solo si no está ya; al terminar
`adb -s <serial> emu kill`.

1. `npx tsc --noEmit` y `npx expo lint`.
2. `make devices`; `make reverse`; `make start`/`make deep-link`.
3. Abrir una novela desde Biblioteca; header “Detalle”, back y overflow; título
   largo a 4 líneas sin romper el hero.
4. Progreso correcto (descargados/traducidos); colores accent/success.
5. “Sincronizar” en mock: job inline, spinner, final; cancelar; retraducir y
   tamaño de tomo desde el menú; error simulado.
6. Descargar un tomo y “Descargar todo”; estados de fila; share sheet en mock;
   novela PDF y novela sin tomos.
7. Loading, 404/error, reintentar/volver; claro/oscuro.
8. `adb -s <serial> emu kill` al terminar. No lanzar el tablet.

## Acceptance criteria

- [ ] Header nativo “Detalle” con back y overflow; sin “Más” en el cuerpo.
- [ ] Hero 128×192, título 22/28, autor y meta; CTA “Sincronizar” accent.
- [ ] Progreso en `ListCard` con barras de 4 px y colores correctos.
- [ ] Tomos originales y traducidos completos, con estados y descarga masiva.
- [ ] Job de acción inline (sin Alert), con id, error y cancelar.
- [ ] Loading, error, 404 y sin tomos cubiertos.
- [ ] `DetailContent` listo para el modo `compact` de tablet.
- [ ] `npx tsc --noEmit` y `npx expo lint` pasan.
- [ ] Solo se lanzó `Expo` y se apagó al terminar.
