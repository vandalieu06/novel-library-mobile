---
code: "07"
title: "Inicio: validación inline de URL, memoria de opciones del último job y badge de avanzadas"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/lib/api.ts
  - src/lib/settings.ts
  - src/app/(tabs)/index.tsx
  - docs/arquitectura.md
---

# 07 — Inicio: experiencia de lanzamiento

## Purpose

Mejorar el flujo real de la pantalla de Inicio — lanzar un job rápido y
repetir el mismo job para el siguiente tomo — sin tocar la estructura (una
pantalla = una tarea).

## Context

- La spec 06 cerró el Inicio funcional. El usuario detectó fricción: la URL
  solo se valida al pulsar (toast de error), y cada job nuevo obliga a
  recalcar idioma/tomo/avanzadas al repetir novelas por tomos.
- Decidido con el usuario: mejoras A + C + D (sin portapapeles ni bloque
  Recientes; E y B quedan fuera por ahora).

## Proposed change

1. **Validación inline de URL** (`index.tsx` + `api.ts`):
   - Exportar `isHttpUrl(url: string): boolean` desde `src/lib/api.ts`
     (reutilización de la validación que ya usa el mock).
   - En el panel web: si hay texto y no es http(s) → `TextField isInvalid` +
     `FieldError` con "Debe empezar por http:// o https://"; botón "Lanzar
     descarga" **deshabilitado** mientras la URL no sea válida.
2. **Memoria de opciones del último job** (`settings.ts` + `index.tsx`):
   - Añadir `lastJobOptions` a `AppSettings` (con defaults): translate,
     target_language, volume_size, concurrency, all, translate_pending, force,
     playwright y pdfSourceLang.
   - Al montar Inicio, cargar settings y rehidratar los estados.
   - Tras un submit exitoso (web o PDF), guardar la configuración usada.
3. **Badge de avanzadas activas** (`index.tsx`):
   - Contador en el trigger del accordion: "Opciones avanzadas" + «· N» cuando
     N > 0, contando: volume_size ≠ 50, concurrency ≠ 4, y los checkboxes
     all/pending/force/playwright activos. Coherente con el badge de Filtros.

## Technical decision

- `lastJobOptions` dentro de AppSettings mantiene una única clave de
  AsyncStorage y el patrón existente (load/update/broadcast).
- La validación inline no sustituye al ApiError del mock (se mantiene como
  defensa), solo evita el ciclo error→corrección.
- Sin dependencias nuevas (nada nativo → sin rebuild).

## Affected files

`src/lib/api.ts` (export util), `src/lib/settings.ts` (campo + defaults),
`src/app/(tabs)/index.tsx` (estado, validación, badge), `docs/arquitectura.md`
(nota del nuevo campo y del patrón de validación).

## Tests

- tsc + lint.
- Visual: URL inválida → error inline + botón deshabilitado; URL válida →
  botón activo; cambiar opciones, lanzar job, reabrir pantalla/reload →
  opciones recordadas; badge cuenta bien y desaparece al volver a defaults.

## Acceptance criteria

- [ ] URL inválida muestra error inline y bloquea el botón en el panel web.
- [ ] El último job recuerda idioma, tomo, concurrencia y checkboxes tras
      cerrar la app (web y PDF).
- [ ] Badge "· N" de avanzadas activas correcto y coherente con Filtros.
- [ ] tsc + lint en verde y commit al cerrar la spec.
