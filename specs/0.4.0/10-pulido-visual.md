---
code: "10"
title: "Pulido visual: notificaciones, icono y splash"
project: "novel-library-mobile"
status: completed
version: "0.4.0"
date: 2026-11-08
tags: [spec, sdd, ui, visual, android]
affected_files:
  - global.css
  - app.json
  - assets/images/icon.png
  - assets/images/android-icon-foreground.png
  - assets/images/splash-icon-android.png
  - assets/images/favicon.png
  - docs/arquitectura.md
---

# 10 — Pulido visual

## Purpose

Cerrar los detalles visuales detectados al validar 0.4.0 en tablet/móvil:
notificaciones más planas, icono de la app con fondo blanco opaco (sin
transparencia que se vea negra al instalar) y un splash con identidad propia en
lugar de solo un cambio de color.

## Context

- El Toast de HeroUI usa `background: overlay`, radio 24 y una sombra fuerte;
  el usuario pide “notificaciones sin tanto borde”. El aviso rojo/oscuro de
  `LogBox` que aparece en dev no es una notificación de producto: es el overlay
  de Fast Refresh y desaparece en cold start.
- El icono actual no tiene fondo opaco; en algunos launchers se ve negro.
- El splash actual solo cambia el fondo; no tiene marca.
- El rail ya quedó con píldora activa de fila completa `accent-soft`, radio 16
  y 6 dp de margen; se mantiene.

## Proposed change

### Notificaciones (Toast)

- Override de `.toast__root` y `.toast__background` en `global.css`:
  - radio 16 (no 24), padding 12×16, fondo `surface`;
  - sin borde; sombra suave `0 4px 14px rgba(28,25,23,0.10)`;
  - se conservan los colores de label/description por variante.
- Validar en claro/oscuro con toast de éxito, warning y danger.
- No se toca `LogBox`; se documenta como artefacto de desarrollo.

### Icono

- Icono principal con **fondo blanco opaco** (sin alfa) y marca B2 legible.
- Adaptive icon de Android con `backgroundColor: "#ffffff"` en `app.json`.
- Comprobar que el launcher no muestre fondo negro ni transparencia.

### Splash

- Splash con fondo `#fbf8f6` (claro) / `#121110` (oscuro) y una insignia
  circular crema con el gato, centrada y dentro del área segura del icono.
- Android 12+ recorta el splash con una máscara circular: un lockup horizontal
  con wordmark se corta, así que se usa la insignia cuadrada; el nombre de la
  app queda en el launcher.
- Usar el plugin de splash de Expo; no editar `android/` a mano.
- Rebuild de dev client/release para validar (los assets nativos no se ven con
  Fast Refresh).

### Rail / switch

- Rail: mantener la píldora de fila completa (decisión del usuario) y el
  indicador accent-ink.
- Switch: se mantiene el de HeroUI 48×24 por ahora; si el usuario pide 52×32 se
  hará en una spec aparte.

## Technical decision

- El Toast se ajusta por CSS global, no por un componente nuevo: menos código y
  aplica a todos los `toast.show` existentes.
- Icono/splash se generan como PNG opacos y se declaran en `app.json`; el
  rebuild es obligatorio para verlos en el launcher/splash.
- Solo Android; no se toca iOS/web.

## Tests

1. `npx tsc --noEmit` y `npx expo lint`.
2. Toast de éxito/warning/danger en claro y oscuro: sin borde, sombra suave,
   radio 16, texto legible.
3. Icono en el launcher Android: fondo blanco opaco, sin negro ni transparencia.
4. Splash en cold start claro/oscuro: marca centrada, sin recortes.
5. `adb -s <serial> emu kill` al terminar.

## Acceptance criteria

- [x] Toast plano, radio 16, sombra suave y sin borde en claro/oscuro.
- [x] Icono con fondo blanco opaco y adaptive icon correcto.
- [x] Splash con insignia, no solo color de fondo.
- [x] Rail de fila completa intacto.
- [x] `npx tsc --noEmit` y `npx expo lint` pasan.
- [x] Solo Android y un emulador a la vez.

## Notas de cierre (2026-11-08)

- El Toast se ha ajustado por CSS en `global.css`: radio 16, padding 12×16,
  fondo `surface`, sin borde y sombra suave.
- Icono: `icon.png` con fondo blanco + tile crema; adaptive icon con
  `backgroundColor: "#ffffff"` y un disco crema con el gato dentro del safe zone
  (250 px de 512, 66 %). En el launcher circular se ve el gato y el libro
  completos, sin recortes, y el nombre visible es **Novel Library**.
- Splash: Android 12 recorta con máscara circular; se sustituyó el lockup
  horizontal por una insignia circular crema con el gato, validada en cold
  start. El lockup horizontal se descartó para Android.
- `expo-doctor`, TalkBack con audio y límites de fuente quedan para la pasada
  de QA/mantenimiento.
