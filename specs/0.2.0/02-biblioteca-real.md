---
code: "02"
title: "Biblioteca real: covers con token, datos del servidor, estadísticas y estados de error"
project: "novel-library-mobile"
status: completed
version: "0.2.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/lib/covers.ts
  - src/lib/stats.ts
  - src/lib/mock/data.ts
  - src/components/cover-image.tsx
  - src/components/empty-state.tsx
  - src/components/novel-card.tsx
  - src/app/(tabs)/books.tsx
  - src/app/novel/[slug].tsx
  - src/app/settings/statistics.tsx
---

# 02 — Biblioteca real: covers, datos, estadísticas y estados de error

## Purpose

Mostrar la biblioteca real del servidor (novelas, covers, capítulos y EPUBs) con el cliente de la spec 01, incluyendo covers autenticadas con `expo-image`, estadísticas sobre datos reales y estados de error con reintento. Sin cambios nativos.

## Context

- `Novel.cover` en la API real es `"/api/novels/{slug}/cover"` o `null` (payload `_novel_payload` en `routes.py`). Requiere el header `X-Auth-Token` cuando el servidor tiene `NOVEL_WEB_TOKEN`: un `<Image source={{ uri }}>` normal no puede enviarlo.
- `expo-image ~58.0.18` ya está instalado y su `source` acepta `{ uri, headers }`.
- En mock, las covers vienen de assets locales con `coverSource(slug)` (`src/lib/mock/data.ts`); hay 6 `cover.jpg` en `assets/mock/covers/`.
- `mockLibraryStats(novels)` en `src/lib/mock/data.ts` ya es genérica (recibe la lista) pero vive en el módulo mock; Estadísticas y la propia pantalla la importan desde ahí.
- Books carga datos con `api.getNovels()` sin `catch` (un error de red deja la lista vacía y el skeleton se apaga); Detalle hace `router.back()` ante cualquier error. No hay estado "error" ni reintento.
- `NovelCard` y Detalle usan `Image` de `react-native` + `coverSource`; el grid usa alturas fijas (`h-44`) porque `aspect-[…]` no calcula bien en Uniwind.

## Proposed change

1. **`src/lib/covers.ts`** (nuevo): `resolveCover(novel, settings): { uri: string; headers?: Record<string, string> } | null`.
   - Si `settings.apiUrl` está vacía → `coverSource(novel.slug)` (assets, comportamiento mock actual).
   - Si hay URL y `novel.cover !== null` → `{ uri: settings.apiUrl.replace(/\/$/, "") + novel.cover, headers: token ? { "X-Auth-Token": token } : undefined }`.
   - Si hay URL y `novel.cover === null` → `null` (placeholder de superficie).
2. **`NovelCard`**: recibe `cover` resuelta por el padre (o lee `useApi().settings`); usa `Image` de `expo-image` con `source={{ uri, headers }}`, `contentFit="cover"`, manteniendo `h-44 w-full rounded-lg bg-surface-tertiary`. Sin cover → mismo bloque vacío que hoy.
3. **Detalle** (`novel/[slug].tsx`): cover con el mismo helper + `expo-image`; el resto del hero (chips, progreso, tomos) no cambia. Los tomos ya vienen de `epub_original`/`epub_translated` reales.
4. **`src/lib/stats.ts`** (nuevo): mover `mockLibraryStats` → `libraryStats(novels: Novel[]): LibraryStats` (misma implementación); `mock/data.ts` deja de exportarlo (o reexporta para no romper imports internos) y Estadísticas lo importa desde `src/lib/stats`.
5. **Books** (`(tabs)/books.tsx`):
   - `const { api, settings } = useApi()`; `load()` con `try/catch` → estado `error: string | null`; en éxito limpia error.
   - Error de red/HTTP: reemplaza el grid por `EmptyState` (`icon="cloud-offline-outline"`, título "No se pudo cargar la biblioteca", descripción = `ApiError.message`) + botón "Reintentar" que vuelve a llamar a `load()`.
   - 401 → descripción específica "Revisa el token en Ajustes" y botón secundario que navega a `/(tabs)/settings`.
   - `FlatList` recibe covers resueltas; refresco (pull-to-refresh) mantiene el comportamiento actual.
6. **Detalle**: si la carga falla, no hace `router.back()` inmediato: muestra estado de error con "Reintentar" y "Volver"; 401 → mensaje de token en Ajustes.
7. **Estadísticas** (`settings/statistics.tsx`): usa `useApi()` para `getNovels()`, calcula `libraryStats(novels)` y los idiomas presentes desde los datos reales; skeleton + estado de error con reintento; texto final sin "datos del mock".

## Technical decision

- Helper `resolveCover` centralizado en vez de repetir la concatenación URL+headers en cada pantalla: una sola regla para mock y real.
- `expo-image` (ya instalado) en vez de `Image` de RN: soporta headers por request sin trucos de `fetch` + base64; el cambio es JS, no requiere rebuild.
- El error **no** cae a mock (decisión de 01): con servidor configurado y caído se informa y se ofrece reintentar; el mock solo aplica con URL vacía.
- `libraryStats` sale del módulo mock porque es lógica de dominio genérica; así Estadísticas no depende de `mock/` en modo real.
- Se mantiene `NovelCard` sin fetch propio: recibe el `Novel` y resuelve la cover con settings del contexto (evita N suscripciones).

## Affected files

Nuevos: `src/lib/covers.ts`, `src/lib/stats.ts`.
Modificados: `src/lib/mock/data.ts` (mover estadísticas), `src/components/novel-card.tsx` (expo-image + helper), `src/app/(tabs)/books.tsx` (error/retry + covers), `src/app/novel/[slug].tsx` (cover real + error/retry), `src/app/settings/statistics.tsx` (datos reales).

## Tests

- `npx tsc --noEmit` y `npx expo lint` en verde.
- Smoke en Android contra el servidor real:
  - Con token: las 6 covers reales cargan en el grid y en el detalle (comparar con la web).
  - Sin token / token malo: covers con placeholder y mensaje 401 al cargar la lista.
  - Servidor caído: Books y Detalle muestran error + "Reintentar"; al levantarlo, reintentar funciona.
  - Estadísticas: contadores coinciden con `GET /api/novels` (novelas, EPUBs originales/traducidos, capítulos).
  - URL vacía: mock intacto (covers de assets, 6 novelas).

## Acceptance criteria

- [ ] Covers reales se renderizan con `expo-image` enviando `X-Auth-Token` cuando hay token.
- [ ] Books, Detalle y Estadísticas muestran datos del servidor real (no mock) con URL configurada.
- [ ] Books y Detalle tienen estado de error con mensaje del backend y botón "Reintentar".
- [ ] El caso 401 dirige a revisar el token en Ajustes.
- [ ] Estadísticas se calculan desde la lista real (helper fuera de `mock/`).
- [ ] Con URL vacía se conserva el comportamiento mock (covers de assets).
- [ ] `tsc --noEmit` y `expo lint` en verde.
