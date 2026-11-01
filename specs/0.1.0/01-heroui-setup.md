---
code: "01"
title: "Integración de HeroUI Native: dependencias, Uniwind, tema y provider"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - package.json
  - pnpm-lock.yaml
  - app.json
  - global.css
  - src/app/_layout.tsx
  - src/app/index.tsx
---

# 01 — Integración de HeroUI Native

## Purpose

Integrar HeroUI Native como sistema de componentes de la app (móvil + tablet), con el tema visual de la web de novel-cli, dejando la base lista para construir las pantallas de las specs 02-04.

## Context

- App actual: Expo SDK 58 (expo ~58.0.22, RN 0.88.1, React 19.3), Expo Router, `expo-dev-client` con `android/` ya generado, `reactCompiler` activo.
- Peers de HeroUI Native ya presentes: reanimated 4.7.1, gesture-handler 3.3.0, safe-area-context 5.10.1, screens 4.30.1. Faltan: `heroui-native`, `react-native-svg` (nativo → rebuild del dev build), `tailwind-variants`, `tailwind-merge` y Uniwind (Tailwind CSS para RN).
- Design system de la web (`translate_novels/DESIGN.md`): accent `#e0575f` (claro) / `#f2777e` (oscuro), bg `#ffffff`/`#09090b`, radios 6px (controles) y 8px (cards), tema claro/oscuro/auto.
- Entorno ya preparado (2026-11-01): skill `heroui-native` instalada y MCP `heroui-native` registrado en el `opencode.json` de la raíz del workspace. **El MCP y las docs de Expo SDK 58 son la fuente de verdad para versiones y pasos exactos** (regla del AGENTS.md: no confiar en memoria).
- Decisión tomada con el usuario: HeroUI Native en vez de componentes propios o `@expo/ui`.

## Proposed change

1. Instalar con `npx expo install`: `heroui-native`, `react-native-svg`, `tailwind-variants`, `tailwind-merge` (versiones exactas según MCP/quick-start). Verificar el peer `react-native-worklets`: tenemos 0.13.0 (requerido por reanimated 4.7); los docs de HeroUI listan `^0.5.1` — confirmar con el MCP que 0.13 es válido y no forzar downgrade.
2. Configurar Uniwind según su quickstart para Expo SDK 58 (`global.css` y config de metro/babel según corresponda).
3. `global.css` con `@import 'tailwindcss'`, `@import 'uniwind'`, `@import 'heroui-native/styles'` y `@source` resolviendo a `node_modules/heroui-native/lib` (path relativo al `global.css`).
4. `src/app/_layout.tsx`: envolver la app con `GestureHandlerRootView` (flex: 1) → `HeroUINativeProvider` (sin anidar dos `GestureHandlerRootView`).
5. Tema: mapear los tokens de la web a las variables de tema de HeroUI Native (accent, fondos, radios) con soporte claro/oscuro/sistema (`useColorScheme`).
6. `app.json`: `orientation` de `"portrait"` a `"default"` (soporte tablet en landscape).
7. Smoke test temporal: un `Button` de heroui-native en `src/app/index.tsx` (se sustituye en la spec 03).
8. Regenerar el dev build (`npx expo run:android`) por el código nativo de `react-native-svg`.

## Technical decision

- HeroUI Native no está recomendada para web: `expo start --web` queda fuera del alcance (objetivo = móvil/tablet nativo).
- Imports granulares (`heroui-native/button`, etc.) para controlar el tamaño del bundle.
- HeroUI Native no tiene componente Progress → barra custom mínima en la spec 03.
- `@expo/ui` se deja instalada aunque sin uso; su retirada se valora en otra iteración.

## Affected files

- `package.json`, `pnpm-lock.yaml` (dependencias)
- `app.json` (orientation)
- `global.css` (nuevo) y config de Uniwind que aplique
- `src/app/_layout.tsx` (providers)
- `src/app/index.tsx` (smoke test temporal)

## Tests

- `npx expo-doctor` sin errores de dependencias.
- `npx tsc --noEmit` y `npx expo lint` en verde.
- Smoke manual en el dev build: la app arranca y el `Button` de prueba renderiza con el tema (claro/oscuro).

## Acceptance criteria

- [ ] `heroui-native` + peers instalados con versiones compatibles (expo-doctor limpio).
- [ ] Uniwind operativo (`className` funciona en pantalla).
- [ ] Provider montado sin `GestureHandlerRootView` duplicado.
- [ ] Accent `#e0575f` visible en el componente de prueba en claro, y tema oscuro correcto.
- [ ] `orientation: "default"` en `app.json`.
- [ ] Dev build regenerado; app arrancando en Android.
- [ ] `tsc --noEmit` y `expo lint` en verde.
