---
code: "08"
title: "Identidad de la app: emblema de gato con libro y set de iconos"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-03
tags: [spec, sdd, branding, iconos]
affected_files:
  - assets/branding/emblem.svg
  - assets/images/icon.png
  - assets/images/android-icon-foreground.png
  - assets/images/android-icon-monochrome.png
  - assets/images/splash-icon.png
  - assets/images/favicon.png
  - app.json
  - docs/arquitectura.md
---

# 08 — Emblema de gato con libro

## Purpose

Sustituir los iconos de plantilla de Expo por una identidad propia: un gato
crema leyendo un libro rojo, legible a 48 px y válido para icono normal,
adaptive icon, splash y favicon.

## Context

- `assets/images/*` y `assets/expo.icon/` eran los assets por defecto del
  starter (símbolo de Expo y fondo azul).
- La generación de imagen por IA no estaba disponible (sin fondos en la
  cuenta), así que se dibuja en vector: más control, transparencia real y
  resultado reproducible.
- La app ya usa tinta `#18181b`, crema de superficie y accent `#bd4048`; el
  icono reutiliza esa paleta.

## Proposed change

1. Fuente vectorial `assets/branding/emblem.svg` (1024×1024): gato crema con
   ojos cerrados, orejas, bigotes, pecho y cola; libro abierto con cubierta
   crimson y páginas crema; patas sobre el libro. Contorno de tinta para que
   funcione sobre fondo claro y oscuro.
2. Derivados generados con `rsvg-convert` + PIL:
   - `icon.png` 1024×1024, fondo `#09090b`, arte al 70 % (sin alfa, requisito
     de App Store).
   - `android-icon-foreground.png` 512×512 transparente, arte al 64 % (zona
     segura del adaptive icon).
   - `android-icon-monochrome.png` 432×432, silueta blanca desde el alfa.
   - `splash-icon.png` 512×512 transparente, arte al 74 %.
   - `favicon.png` 48×48 desde el icono principal.
3. `app.json`:
   - `ios.icon` pasa del `.icon` de plantilla al PNG 1024.
   - `android.adaptiveIcon`: se elimina `backgroundImage` (queda
     `backgroundColor: "#09090b"` + foreground + monochrome).
   - Se eliminan `assets/expo.icon/` y `android-icon-background.png`, ya sin
     uso.

## Technical decision

- **Vector, no IA**: el emblema es plano y geométrico; SVG permite ajustar
  colores/geometría y regenerar todos los tamaños sin pérdida.
- **Contorno de tinta** en todas las formas: el mismo asset sirve en splash
  claro y oscuro; sin él, el gato crema desaparecía sobre blanco.
- **Adaptive icon**: foreground transparente con el arte al 64 %, dentro de la
  zona segura de 66 %; el fondo se pinta con `backgroundColor` para evitar
  costuras al recortar la máscara.
- **Monocromo** derivado del canal alfa (no de un dibujo aparte), así el
  themed icon de Android coincide exactamente con el emblema.
- El splash reutiliza el símbolo transparente; el fondo lo pone el plugin
  (`#ffffff` claro / `#09090b` oscuro).
- Los PNG nativos se generan en prebuild/rebuild; el dev client actual seguirá
  mostrando el icono viejo hasta reinstalar.

## Affected files

`assets/branding/emblem.svg` (nuevo), `assets/images/icon.png`,
`android-icon-foreground.png`, `android-icon-monochrome.png`,
`splash-icon.png`, `favicon.png`, `app.json`, `docs/arquitectura.md`.
Se eliminan `assets/expo.icon/` y `android-icon-background.png`.

## Tests

- Inspección visual a 1024, 512, 48 px y sobre fondo blanco/negro.
- `npx expo prebuild --platform android` genera los mipmap con el nuevo icono.
- `tsc` + `lint` (sin cambios de código; solo config/assets).
- Rebuild (`make android` o `make android-release`) para verlo en el launcher.

## Acceptance criteria

- [x] `icon.png` 1024 sin alfa, legible a 48 px.
- [x] Adaptive foreground transparente con el arte dentro de la zona segura.
- [x] Monocromo blanco derivado del alfa.
- [x] Splash transparente válido en claro y oscuro.
- [x] `app.json` apunta a los assets nuevos y no quedan restos de plantilla.
- [x] Prebuild genera los recursos nativos.
