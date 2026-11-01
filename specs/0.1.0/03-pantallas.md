---
code: "03"
title: "Pantallas Inicio, Biblioteca y detalle de novela"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/books.tsx
  - src/app/novel/[slug].tsx
  - src/components/novel-card.tsx
  - src/components/progress-bar.tsx
  - src/components/empty-state.tsx
---

# 03 — Pantallas Inicio, Biblioteca y detalle

## Purpose

Implementar las tres pantallas principales de la experiencia de librería con componentes HeroUI Native, consumiendo el `ApiClient` mock de la spec 02.

## Context

- Equivalencias web: `index.html` (Nueva descarga), `library.html` (Biblioteca), `novel.html` (detalle).
- Alcance acordado con el usuario: el detalle SOLO muestra info + capítulos + descarga del tomo (sync/retraducir/tamaño de tomo → fase 2); sin jobbar ni estados de jobs en vivo.
- HeroUI Native no tiene componente Progress → barra custom.

## Proposed change

1. **Inicio** (`(tabs)/index.tsx`): Tabs "Desde web"/"Desde PDF"; TextField URL con validación http(s) o selección de PDF (expo-document-picker, simulado en mock); Switch "Traducir" + Select idioma; opciones avanzadas colapsables (Checkbox: todos los capítulos, traducir pendientes, forzar re-descarga, forzar Playwright; Select tomo 50/100/150/200; concurrencia); Button "Lanzar descarga" → `createJob` (mock) → Toast.
2. **Biblioteca** (`(tabs)/books.tsx`): SearchField (título/autor), chips de filtro (Todas/Traducidas/PDF), orden (Recientes/Título); grid responsive 2/4/8 (`src/lib/grid.ts`); `NovelCard` con cover, título, autor, chips (ES/PDF) y `ProgressBar` de capítulos; Skeleton durante carga; pull-to-refresh.
3. **Detalle** (`novel/[slug].tsx`): hero con cover + título + autor + meta (origen, idioma, tamaño de tomo) + progreso descarga/traducción + aviso si `chapters_empty > 0`; lista de tomos con EPUB original y `(ES)` por tomo y botón de descarga → `downloadEpub` (mock) → Toast; sin acciones secundarias (fase 2).
4. Componentes compartidos en `src/components/` (fuera de `src/app/`): `NovelCard`, `ProgressBar`, `EmptyState`.

## Technical decision

- Navegación a detalle por slug (`useLocalSearchParams`).
- Los toasts mock simulan el resultado de las acciones sin red.
- Textos en español, consistente con la web; imports granulares de `heroui-native`.

## Affected files

Nuevos: `src/components/novel-card.tsx`, `src/components/progress-bar.tsx`, `src/components/empty-state.tsx`. Modificados: `src/app/(tabs)/index.tsx`, `src/app/(tabs)/books.tsx`, `src/app/novel/[slug].tsx` (sustituyen a los stubs de la spec 02; `expo-document-picker` se instala aquí si se usa).

## Tests

- `npx tsc --noEmit` + `npx expo lint`.
- Smoke manual en móvil y tablet: portrait/landscape, grid 2/4/8 correcto por dispositivo, dark mode, flujo completo Inicio → Books → detalle → descarga (toast).

## Acceptance criteria

- [ ] Formulario de Inicio completo con ambas fuentes y validación de URL.
- [ ] Grid de Biblioteca con búsqueda, filtros, orden y densidad correcta por dispositivo.
- [ ] Detalle con info fiel al mock y descarga de tomo simulada (toast).
- [ ] Skeletons y empty states visibles en carga y lista vacía.
- [ ] Dark mode correcto en las tres pantallas.
- [ ] `tsc --noEmit` y `expo lint` en verde.
