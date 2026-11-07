---
code: "03"
title: "Descargar: formulario web/PDF, opciones y trabajos en Material 3"
project: "novel-library-mobile"
status: proposed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, download, material3]
affected_files:
  - "src/app/(tabs)/download.tsx"
  - src/components/download/web-form.tsx
  - src/components/download/pdf-form.tsx
  - src/components/download/jobs-card.tsx
  - src/components/download/advanced-options-sheet.tsx
  - src/components/job-row.tsx
  - src/components/toggle-row.tsx
  - src/components/segmented-field.tsx
  - src/components/action-button.tsx
  - src/components/list-card.tsx
  - src/lib/jobs.ts
  - src/lib/settings.ts
  - src/lib/languages.ts
  - docs/arquitectura.md
---

# 03 — Descargar

## Purpose

Convertir el formulario actual de Inicio en la pantalla **Descargar** de la
segunda tab, con el lenguaje Material 3 de B2 y el mismo comportamiento de
descarga, opciones y seguimiento de jobs.

## Context

`(tabs)/index.tsx` concentra hoy 988 líneas: formulario web, formulario PDF,
opciones avanzadas en `BottomSheet`, jobs, toasts y polling. Funciona, pero el
chrome (título grande, tarjetas, segmented pill) no coincide con B2 y el archivo
es difícil de mantener. El formulario pasa a `(tabs)/download.tsx`.

Referencia: `?variant=native&screen=home&theme=light&width=phone`.

## Proposed change

### Estructura de pantalla

- `AppBar` “Descargar” (22/28), sin acciones.
- Lede 14/20 `muted`: “Pega la URL de la novela o sube un PDF.”
- `SegmentedField` Web · PDF (40, radio 20, seleccionado `accent-soft` +
  `accent-ink`).
- Contenido en `ScrollView` con `keyboardShouldPersistTaps="handled"`.
- Jobs de la sesión debajo del formulario, dentro de una `ListCard`.

### Web

- Campo URL outlined de 56: label 12/16 `muted`, valor 16/24, borde `outline`,
  radio 12; error inline con `FieldError` y borde `danger`.
- CTA “Descargar” primario accent, 48, radio 24, full width.
- Card “Opciones” con filas de 56:
  - “Traducir al terminar” + `Switch` Material (52×32, track accent).
  - “Idioma” + valor + chevron; abre el selector existente.
  - “Opciones avanzadas” + “N activas” + chevron; abre el sheet.
- El sheet de opciones conserva volumen, concurrencia, todos, pendientes,
  force y Playwright; título 20/26, filas 56, `Restablecer` tonal y `Listo`
  accent. Radio superior 24.
- Validación: `isHttpUrl`; no se lanza si hay un job activo. Toast solo para
  errores de API; el error de URL es inline.

### PDF

- Si no hay archivo: `ListRow`/card “Elegir archivo PDF” (48) con icono
  documento.
- Si hay archivo: nombre, tamaño, botón de quitar; target ≥ 44.
- Campos: título (opcional), autor (opcional), tipo (Auto/Libro/Webnovel),
  idioma del PDF, capítulos por tomo; todos outlined de 56, labels 12/16.
- `Switch` de traducir + idioma destino cuando aplica.
- CTA “Subir y convertir” accent, 48.
- Se mantiene `DocumentPicker` con `copyToCacheDirectory`, `titleFromFilename`
  y la heurística de UUID.

### Jobs

- `ListCard` con una fila por job:
  - Icono de estado 28 (`spinner` en pending/running, check en done, alert en
    error, close en cancelled).
  - Título “Descarga web”/“PDF” + estado; id del job y detalle en 12/16
    `muted`; error en `danger`.
  - “Cancelar” en `accent-ink` para jobs activos; “Quitar” cierra la fila.
- Se mantienen `pollJob`, abort al desmontar, toasts de éxito/error y el límite
  de 10 jobs de sesión.

### Estado y persistencia

- El contenedor `download.tsx` conserva el estado del formulario, el `busy`,
  `activeJob`, `jobs`, `pollAbort` y la rehidratación de `lastJobOptions`.
- `currentJobOptions()` y `updateSettings({ lastJobOptions })` se mantienen.
- `resetOptions` restablece volumen 50, concurrencia 4, flags false.
- No se cambia el contrato `ApiClient` ni el backend.

## Technical decision

- Partir el archivo en `web-form`, `pdf-form`, `jobs-card` y
  `advanced-options-sheet`; `download.tsx` queda como contenedor y dueño del
  estado. Esto reduce el archivo actual sin introducir un store global.
- Reutilizar `BottomSheet`, `Select`, `TextField`, `Input` y `Switch` de
  HeroUI Native, estilizados con los tokens de 01. No se añaden dependencias ni
  se migra a `@expo/ui`.
- Extraer el `ToggleRow` local a `src/components/toggle-row.tsx` para
  reutilizarlo en el sheet de opciones y en Ajustes.
- El formulario PDF mantiene los campos actuales; solo cambia la presentación.
- El CTA primario es accent; loading conserva contraste.

## Affected files

`(tabs)/download.tsx` (nuevo, desde el `index.tsx` actual);
`components/download/web-form.tsx`, `pdf-form.tsx`, `jobs-card.tsx`,
`advanced-options-sheet.tsx`; `job-row.tsx`, `toggle-row.tsx`,
`segmented-field.tsx`, `action-button.tsx`, `list-card.tsx`; `lib/jobs.ts`,
`lib/settings.ts`, `lib/languages.ts`; `docs/arquitectura.md` al cierre.

## Tests

**Emuladores**: solo `mobile` → **`Expo`** (1080×2400, Android 37, portrait).
No lanzar `Medium_Tablet`, `Pixel_10` ni `pixel_4a_teikit`.
Arranque: `emulator -avd Expo` solo si no está ya; al terminar
`adb -s <serial> emu kill`.

1. `npx tsc --noEmit` y `npx expo lint`.
2. `make devices`; `make reverse`; `make start`/`make deep-link`.
3. Web: URL inválida → error inline; URL válida en mock → toast “Job creado”,
   fila en “Esta sesión”, polling y estado final; cancelar un job activo;
   quitar uno terminado.
4. Opciones: abrir el sheet, cambiar volumen/concurrencia/flags, “Listo”,
   lanzar, cerrar y reabrir la app; los valores se rehidratan.
5. PDF: `adb push` de un PDF de prueba a `/sdcard/Download`, elegir archivo,
   comprobar nombre/tamaño, título/autor/tipo, idioma, tomo, traducir y
   “Subir y convertir” en mock.
6. Teclado: URL, título y autor; el campo enfocado no queda tapado; el sheet
   no salta al abrir/cerrar el teclado.
7. Claro/oscuro; botón accent/on-accent; cards y bordes.
8. `adb -s <serial> emu kill` al terminar. No lanzar el tablet.

## Acceptance criteria

- [ ] “Descargar” es la segunda tab; el top bar dice “Descargar” y no hay
      título grande duplicado.
- [ ] Web y PDF conservan toda la funcionalidad actual (validación, opciones,
      jobs, polling, toasts, rehidratación).
- [ ] El formulario usa campos outlined, segmented, switch y CTA accent de 01.
- [ ] El sheet de opciones usa el mismo lenguaje Material 3 y conserva
      restablecer/listo.
- [ ] La lista de jobs muestra estado, id, error y acciones; se limita a 10.
- [ ] Teclado y scroll no ocultan campos ni CTAs.
- [ ] Claro/oscuro correctos; `npx tsc --noEmit` y `npx expo lint` pasan.
- [ ] Solo se lanzó `Expo` y se apagó al terminar.
