---
code: "02"
title: "Arquitectura mock-first: rutas, tipos, ApiClient, datos y ajustes"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - package.json
  - pnpm-lock.yaml
  - src/app/_layout.tsx
  - src/app/(tabs)/_layout.tsx
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/books.tsx
  - src/app/(tabs)/settings.tsx
  - src/app/novel/[slug].tsx
  - src/app/settings/statistics.tsx
  - src/lib/types.ts
  - src/lib/api.ts
  - src/lib/mock/data.ts
  - src/lib/settings.ts
  - src/lib/grid.ts
  - assets/mock/covers/
---

# 02 — Arquitectura mock-first

## Purpose

Montar el esqueleto de navegación y la capa de datos desacoplada (mock) para construir las pantallas (specs 03-04) sin backend, y poder sustituir el mock por la API real de novel-cli web en una fase posterior sin tocar pantallas.

## Context

- API de la web (`translate_novels/src/novel_cli/web/routes.py`): `GET /api/novels`, `GET /api/novels/{slug}`, `POST /api/jobs`, `POST /api/upload`, `GET /api/novels/{slug}/epub/{filename}`, `GET /api/novels/{slug}/cover`. El payload `_novel_payload` define el contrato de datos.
- Biblioteca real (`NOVEL_OUTPUT_DIR=~/Dev/projects/personal-tools-novels/library-novels`): 6 novelas, 66 EPUBs, 1 origen PDF y 5 web. Los manifests son la fuente del mock.
- Fase 1 = 100% mock (decisión del usuario): sin jobs en vivo ni WebSocket. La URL del backend (Tailscale DNS o IP privada) se configura en Ajustes, pero "Probar conexión" es mock puro.
- Grid: auto por breakpoint (2 <768dp, 4 ≥768dp, 8 ≥1200dp) + override manual en Ajustes (decisión del usuario).

## Proposed change

1. Rutas (Expo Router):
   - `src/app/_layout.tsx`: stack raíz sobre los providers de la spec 01.
   - `src/app/(tabs)/_layout.tsx`: tabs inferiores Inicio · Books · Ajustes.
   - Stubs navegables (contenido real en specs 03-04): `(tabs)/index.tsx`, `(tabs)/books.tsx`, `(tabs)/settings.tsx`, `novel/[slug].tsx`, `settings/statistics.tsx`.
2. `src/lib/types.ts`: tipos TS espejo del payload de la API (`Novel`, `EpubGroup`, `LibraryStats`, `JobRequest`, `UploadRequest`, …).
3. `src/lib/api.ts`: interfaz `ApiClient` (`getNovels`, `getNovel`, `createJob`, `uploadPdf`, `downloadEpub`, `testConnection`) con `MockApiClient` como única implementación de esta fase; `HttpApiClient` queda como hueco documentado de la fase real.
4. `src/lib/mock/data.ts`: las 6 novelas reales (slug, título, autor, contadores, `epub_original`/`epub_translated`, timestamps) fieles a los manifests; helpers de estadísticas derivadas.
5. `assets/mock/covers/`: copia única de las 6 `cover.jpg` reales (decisión del usuario); el mock resuelve la cover por slug.
6. `src/lib/settings.ts`: persistencia con AsyncStorage (`@react-native-async-storage/async-storage`, instalar con `npx expo install` tras verificar soporte en SDK 58): `apiUrl` (default vacío), `theme` (auto|light|dark), `gridDensity` (auto|2|4|8).
7. `src/lib/grid.ts`: helper de densidad con breakpoints + override desde settings.

## Technical decision

- `MockApiClient` con latencia simulada (200-400 ms) para que los Skeletons de la spec 03 se comporten de forma realista.
- Covers en assets (no red): la app es offline en esta fase.
- Sin state management global (zustand/redux): React state + hooks sobre el ApiClient bastan para el alcance.
- No se implementa `HttpApiClient` en esta fase: solo el contrato (tipos) para que la sustitución posterior sea trivial.

## Affected files

Nuevos: `src/lib/types.ts`, `src/lib/api.ts`, `src/lib/mock/data.ts`, `src/lib/settings.ts`, `src/lib/grid.ts`, `src/app/(tabs)/_layout.tsx`, stubs de pantallas, `assets/mock/covers/*`. Modificados: `src/app/_layout.tsx`, `package.json`, `pnpm-lock.yaml`.

## Tests

- `npx tsc --noEmit` + `npx expo lint`.
- Verificación del mock contra los manifests reales: 6 novelas, 66 EPUBs totales, 1 PDF/5 web, contadores por novela correctos.

## Acceptance criteria

- [ ] Navegación por tabs funcional con las 5 rutas navegables (stubs).
- [ ] `MockApiClient` devuelve las 6 novelas con datos fieles a los manifests.
- [ ] Covers accesibles desde assets por slug.
- [ ] Settings persisten entre arranques (apiUrl, theme, gridDensity).
- [ ] Helper de densidad resuelve 2/4/8 por breakpoint y override.
- [ ] `tsc --noEmit` y `expo lint` en verde.
