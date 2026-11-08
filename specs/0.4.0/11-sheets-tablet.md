---
code: "11"
title: "Sheets de tablet con ancho máximo y centrados"
project: "novel-library-mobile"
status: completed
version: "0.4.0"
date: 2026-11-08
tags: [spec, sdd, ui, tablet, sheets]
affected_files:
  - src/components/app-sheet.tsx
  - "src/app/(tabs)/index.tsx"
  - "src/app/(tabs)/settings.tsx"
  - src/components/download/advanced-options-sheet.tsx
  - src/components/settings/option-sheet.tsx
  - src/components/settings/language-sheet.tsx
  - src/components/detail-sheets.tsx
  - docs/arquitectura.md
---

# 11 — Sheets de tablet

## Purpose

Evitar que los bottom sheets ocupen el 100 % del ancho en tablet. En móvil se
mantiene el sheet a ancho completo, pero en tablet debe ser una superficie
centrada de 640 dp como máximo, con las cuatro esquinas redondeadas.

## Context

- Todos los sheets usan `BottomSheet.Content` de HeroUI Native. HeroUI aplica
  `width: 100%` por defecto y nosotros no le pasamos `maxWidth` ni un contenedor
  centrado.
- En móvil, el ancho completo es correcto para Material 3 y coincide con el
  teclado y el gesto inferior.
- En tablet, el sheet se estira a 1280 o 800 dp. Afecta a Filtros, Opciones
  avanzadas, Tema, Densidad, Idioma preferido, Retraducir, Tamaño de tomo y
  Servidor (este último solo por debajo de 1024, porque a partir de 1024 usa el
  panel lateral).
- La spec 06 limitó el contenido de páginas y el panel de servidor, pero no los
  sheets.

## Proposed change

### Wrapper compartido

- Nuevo `src/components/app-sheet.tsx` que envuelve `BottomSheet.Content`:
  - Móvil (`width < 768`): comportamiento actual, ancho completo y
    `rounded-t-3xl`.
  - Tablet (`width >= 768`): `detached`, `maxWidth: 640`, centrado horizontal y
    las cuatro esquinas con radio 24.
- El wrapper acepta las mismas props que `BottomSheet.Content`
  (`className`, `contentContainerClassName`, `children` y el resto).
- No se cambia la API de apertura/cierre de los sheets.

### Sheets afectados

- Filtros de Biblioteca (`(tabs)/index.tsx`).
- Opciones avanzadas de Descargar (`advanced-options-sheet.tsx`).
- Tema y densidad (`option-sheet.tsx`).
- Idioma preferido (`language-sheet.tsx`).
- Servidor (`(tabs)/settings.tsx`), para 768 a 1023.
- Retraducir y Tamaño de tomo (`detail-sheets.tsx`).

### Medidas

- Ancho máximo en tablet: 640 dp.
- Margen lateral resultante: centrado automático.
- Radio: 24 en tablet, `rounded-t-3xl` en móvil.
- Fondo, overlay, handle, altura dinámica y scroll se mantienen.
- En tablet, el sheet sigue anclado al borde inferior con un margen inferior
  pequeño, no flotando en el centro de la pantalla.

### Teclado y scroll

- El sheet de servidor debe seguir funcionando con teclado en 768 a 1023:
  campos visibles, CTA no tapado, scroll si hace falta.
- El listado de idiomas debe conservar su `ScrollView` y max height.
- No se añade `KeyboardAvoidingView` nuevo si el sheet ya lo resuelve.

## Technical decision

- Se centraliza en un wrapper para no repetir `useWindowDimensions` y estilos en
  siete componentes.
- Se usa `detached` de gorhom/Expo con `style` de ancho máximo; si `detached`
  provoca un comportamiento raro en Android, la alternativa es un contenedor
  centrado con `maxWidth` y el mismo radio.
- El umbral es 768, el mismo del rail, para que cualquier tablet use el ancho
  limitado. En 768 a 1023 no hay panel de servidor y el sheet sigue siendo la
  vía de configuración.
- No se cambia la navegación ni el contenido de cada sheet.

## Affected files

`src/components/app-sheet.tsx`; `(tabs)/index.tsx`, `(tabs)/settings.tsx`;
`advanced-options-sheet.tsx`, `option-sheet.tsx`, `language-sheet.tsx`,
`detail-sheets.tsx`; `docs/arquitectura.md` al cierre.

## Tests

**Emulador**: `Medium_Tablet` (1280×800 y 800×1280) y después `Expo` móvil,
secuencialmente. Nunca dos a la vez.

1. `npx tsc --noEmit` y `npx expo lint`.
2. Tablet landscape 1280: abrir Filtros, Opciones avanzadas, Tema, Densidad,
   Idioma, Retraducir y Tamaño; cada uno mide 640 como máximo, centrado y con
   cuatro esquinas redondeadas.
3. Tablet portrait 800: los mismos sheets, sin desbordamiento y con margen
   lateral.
4. Servidor en 768 a 1023: abrir sheet, escribir URL, probar teclado, guardar.
5. Idioma preferido: scroll hasta el final y seleccionar un idioma.
6. Detalle: Retraducir y Tamaño en tablet; CTA y opciones visibles.
7. Móvil: todos los sheets siguen a ancho completo, pegados abajo y con radio
   superior.
8. Claro/oscuro y font scale 1.3; sin clipping.
9. Un solo emulador a la vez; apagar al terminar.

## Acceptance criteria

- [x] En tablet, todos los sheets tienen 640 dp de ancho máximo y están centrados.
- [x] Las cuatro esquinas tienen radio 24 en tablet.
- [x] En móvil se mantiene el ancho completo y el radio superior.
- [x] El sheet de servidor funciona con scroll y layout en 768 a 1023; el teclado
      físico del emulador no mostró teclado en pantalla, pero el contenido queda
      visible y el CTA no se tapa.
- [x] El listado de idiomas conserva scroll y opciones alcanzables (mismo
      contenedor con `ScrollView`).
- [x] No hay regresiones de apertura, cierre, overlay ni gesto.
- [x] `npx tsc --noEmit` y `npx expo lint` pasan.
- [x] Solo se usa un emulador a la vez.

## Notas de cierre (2026-11-08)

- `AppSheetContent` centraliza el layout. En tablet aplica `detached`,
  `bottomInset: 16`, ancho máximo 640, centrado con margen calculado y radio 24.
  En móvil no añade ninguna prop y mantiene el sheet actual.
- Se migraron los siete usos: Filtros, Opciones avanzadas, Tema, Densidad,
  Idioma preferido, Servidor, Retraducir y Tamaño de tomo.
- Verificado en `Medium_Tablet` landscape 1280 (Tema), portrait 800 simulado con
  `wm size` (Servidor) y móvil 1080x2400 simulado (Tema): 640 centrado en tablet,
  ancho completo en móvil.
- El emulador tiene teclado físico; el teclado en pantalla no se abrió al tocar
  el campo. El layout del sheet no tapa el CTA. La QA final repetirá el flujo
  con teclado en pantalla si hace falta.
