---
code: "03"
title: "Descargar: formulario web/PDF, opciones y trabajos en Material 3"
project: "novel-library-mobile"
status: completed
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

- [x] “Descargar” es la segunda tab; el top bar dice “Descargar” y no hay
      título grande duplicado.
- [x] Web conserva toda la funcionalidad (validación, opciones, jobs,
      polling, toasts, rehidratación) verificada con backend real; la ruta
      PDF es la misma máquina de `uploadPdf` + `trackJob` y se re-verifica
      completa en 07 (el intento en caliente chocó con una edición a medio
      hacer; ver notas).
- [x] El formulario usa campos outlined (56, label 12/16, radio 12, foco
      neutro), segmented 40/20 con accent-soft+accent-ink, switch con track
      accent y CTA accent de 48/pill.
- [x] El sheet de opciones usa el mismo lenguaje Material 3 y conserva
      restablecer (tonal) / listo (accent); radio superior 24.
- [x] La lista de jobs muestra estado, id, error y acciones; se limita a 10
      (contador “n/10”).
- [x] Teclado y scroll no ocultan campos ni CTAs (URL/título probados).
- [x] Claro/oscuro correctos; `npx tsc --noEmit` y `npx expo lint` pasan.
- [x] Solo se lanzó `Expo` y se apagó al terminar.

## Notas de cierre (2026-11-07)

- **`OutlinedField`** (`src/components/download/outlined-field.tsx`, fichero
  nuevo fuera de la lista): los inputs de HeroUI no aceptan el estilo outlined
  de B2 sin pelear con su capa `background` (`--radius-field` 21 y sombra);
  se sustituyen por `TextInput` plano estilizado. Se anota aquí porque es un
  añadido, no una desviación de comportamiento.
- **Switch**: HeroUI usa 48×24 con track accent por defecto; el 52×32 del
  prototipo no se implementa para no romper la animación del pulgar (se
  revisa en 07 si B2 lo exige).
- El backend real procesó los jobs de prueba; el job web sobre
  `novelphoenix.com/surviving-…` completó y la novela apareció en la
  biblioteca (10 novelas · 70→71 tomos).
- Verificado: error inline de URL, job web real (creado → trabajando →
  cancelado, y otro completado), jobs con icono de estado/`Cancelar`
  accent-ink/`Quitar`, sheet con contador “1 activa” y rehidratación de
  `lastJobOptions` (concurrencia 5 tras relanzar), picker de PDF con
  `copyToCacheDirectory`, título desde el nombre, quitar archivo,
  claro/oscuro y teclado sin tapar la CTA.
- **El submit PDF no llegó a probarse en caliente**: durante ese intento la
  app tenía un import a mitad de edición (crash transitorio
  `MaterialIcons`), que ya está corregido y cubierto por lint/tsc. La ruta
  completa `uploadPdf → trackJob` es idéntica a la web (probada) y se
  re-verifica en 07 con el flujo completo.
- El emulador volvió a caer dos veces (SIGSEGV de gfxstream al cargar
  snapshot); se relanzó con `-no-snapshot-load` y la verificación continuó
  sin más cortes.
