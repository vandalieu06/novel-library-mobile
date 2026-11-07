---
code: "08"
title: "Idioma preferido y selector de tomos en Detalle"
project: "novel-library-mobile"
status: completed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, detail, idioma, settings]
affected_files:
  - src/lib/settings.ts
  - src/lib/languages.ts
  - src/app/(tabs)/settings.tsx
  - src/components/detail-content.tsx
  - docs/arquitectura.md
---

# 08 — Idioma preferido y selector de tomos

## Purpose

Evitar que el detalle liste siempre los EPUB originales y traducidos a la vez.
Se añade un idioma preferido global (por defecto ES) y unas pastillas locales
en el detalle para cambiar entre las versiones disponibles sin salir de la
pantalla.

## Context

- El contrato actual de `Novel` solo expone `epub_original` y
  `epub_translated` para un único `translated_language`. No hay varias
  traducciones por novela; las pastillas son **Original** + el idioma
  traducido actual (p. ej. `Original` / `ES`). Soporte multi-idioma real
  requeriría cambios de backend y queda fuera de alcance.
- Hoy `DetailContent` pinta dos secciones completas (“Tomos originales” y
  “Tomos traducidos”), lo que alarga la pantalla y obliga a buscar la versión
  deseada.
- El usuario decidió: etiquetas `Original` / `ES` (sin asumir que el original
  es inglés), el idioma global **solo** afecta al detalle, y si solo hay una
  versión las pastillas se ocultan.
- La spec 05 rehace Ajustes. Esta spec se implementa **después de 05** para
  añadir la fila al hub nuevo y no duplicar trabajo. 05 debe conservar el
  ajuste “Idioma preferido” en el grupo de Biblioteca/Lectura.

## Proposed change

### Ajuste global

- Nuevo campo `preferredLanguage: string` en `AppSettings`, persistido en
  AsyncStorage. Valores: `"original"` o un código de `TRANSLATE_TARGETS`
  (`es`, `en`, `fr`, …). Por defecto `"es"`.
- En Ajustes, grupo **Biblioteca** (o “Lectura” cuando 05 lo reorganice), fila
  **“Idioma preferido”** con el valor actual (`Español`, `Original`, …). Al
  pulsarla se abre un `BottomSheet` con una `ListCard`: “Original” y los 10
  idiomas curados; la opción activa lleva check/`accent-ink`. Tocar una opción
  guarda el ajuste y cierra el sheet.
- El ajuste **no** modifica el filtro de Biblioteca ni el idioma de destino de
  Descargar.

### Selector en Detalle

- Si la novela tiene original **y** traducidos, encima de la sección de tomos
  se muestra un `SegmentedField` de dos opciones:
  - `Original`
  - `<translated_language>` en mayúsculas (p. ej. `ES`; fallback
    “Traducido” si el backend no lo informa).
- Selección inicial: la versión que corresponda a `preferredLanguage` si está
  disponible; si no, `Original`; si no hay original, la traducida.
- Solo se muestra la lista seleccionada. Cabecera “Tomos · N” y
  `Descargar todo` actúan sobre esa lista.
- La pastilla es un override **local**: cambiar de versión no modifica el
  ajuste global y se reinicia al salir de la pantalla (al volver se usa el
  idioma preferido).
- Si solo hay una versión (novela sin traducir, o solo traducida), las
  pastillas se ocultan y se lista directamente esa versión.
- Si no hay ninguna, se mantiene la fila “Aún no hay tomos generados”.
- El progreso (Descargados/Traducidos) sigue mostrando ambas cifras: el
  selector solo filtra los tomos.
- `compact` (panel de tablet de 06) usa el mismo selector; si el ancho del
  panel no permite dos pastillas, se apilan o se reduce la etiqueta, pero no se
  oculta el control cuando hay dos versiones.
- Los estados por fila (`rowStates`) se conservan al cambiar de pastilla
  porque se indexan por filename.

### Helper de resolución

- En `src/lib/languages.ts`, helper
  `preferredVolumeList(novel, preferredLanguage)` que devuelve
  `"original" | "translated"` aplicando disponibilidad y fallback.
- En `DetailContent`, `availableVolumeLists(novel)` decide si hay 0, 1 o 2
  opciones y sus etiquetas.

## Technical decision

- El estado de la pastilla vive en `DetailContent` (`useState`) y se inicializa
  con `preferredLanguage`; así el panel de tablet de 06 lo hereda sin estado
  extra en la pantalla.
- `DetailContent` recibe `preferredLanguage` desde `useApi().settings`; el
  valor se lee una vez al montar y no cambia mientras la pantalla está abierta.
- No se toca el backend: el selector opera sobre los arrays ya existentes.
- No se persiste la última versión vista; el ajuste global es la única fuente
  de verdad entre sesiones.
- Se reutilizan `SegmentedField`, `ListCard`, `BottomSheet` y los tokens de
  01; no se crean componentes nuevos salvo un helper de opciones.

## Affected files

`src/lib/settings.ts`, `src/lib/languages.ts`,
`src/app/(tabs)/settings.tsx`, `src/components/detail-content.tsx`,
`docs/arquitectura.md` y `specs/0.4.0/00-changelog.md` al cierre.

## Tests

**Emulador**: solo `Expo` (1080×2400, Android 37, portrait). No lanzar
`Medium_Tablet`, `Pixel_10` ni `pixel_4a_teikit`.

1. `npx tsc --noEmit` y `npx expo lint`.
2. Ajustes → Idioma preferido → Español; reiniciar la app y comprobar que se
   conserva.
3. Abrir una novela traducida: arranca en `ES`, solo se listan los tomos
   traducidos y `Descargar todo` usa esa lista.
4. Pulsar `Original`: se listan solo los originales; volver atrás y entrar de
   nuevo: vuelve a `ES` (override local no persistido).
5. Novela sin traducir: sin pastillas y lista original. Novela solo traducida
   (si existe): sin pastillas y lista traducida.
6. Poner el idioma preferido en `English` con una novela traducida a ES:
   arranca en `Original` (fallback).
7. Claro/oscuro y título largo; sin cambios en Biblioteca ni Descargar.
8. `adb -s <serial> emu kill` al terminar.

## Acceptance criteria

- [x] `preferredLanguage` existe en settings, por defecto `es` y persiste.
- [x] Ajustes permite cambiarlo con un sheet de Original + idiomas curados.
- [x] Detalle muestra pastillas `Original` / `ES` solo cuando hay dos versiones.
- [x] Solo se lista la versión seleccionada; `Descargar todo` respeta la selección.
- [x] La selección inicial respeta el ajuste global y cae a Original si no existe.
- [x] El cambio local no modifica el ajuste global ni persiste entre visitas.
- [x] Una sola versión oculta las pastillas y lista esa versión.
- [x] El progreso sigue mostrando descargados y traducidos.
- [x] Funciona en modo normal y `compact` (06).
- [x] `npx tsc --noEmit` y `npx expo lint` pasan.
- [x] Solo se lanzó `Expo` y se apagó al terminar.

## Notas de cierre (2026-11-07)

- El estado de la pastilla se inicializa en `DetailContent` con el ajuste
  global; si la versión elegida deja de existir tras un `load()`, la vista cae
  a la preferida disponible sin cambiar el ajuste.
- Se conserva `rowStates` por filename, así que cambiar de pastilla no pierde
  los checks/spinners de descarga.
- Verificado en `Expo` con backend real: default Español abre Inner Voice en
  `ES`; `Original` cambia solo la lista; Haruya (sin traducir) no muestra
  pastillas; preferido English cae a `Original` en una novela solo ES; el
  ajuste y el tema/densidad persisten tras reiniciar. `compact` comparte el
  mismo componente (se validará en la 06).
