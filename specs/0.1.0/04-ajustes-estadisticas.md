---
code: "04"
title: "Ajustes y Estadísticas"
project: "novel-library-mobile"
status: approved
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/app/(tabs)/settings.tsx
  - src/app/settings/statistics.tsx
---

# 04 — Ajustes y Estadísticas

## Purpose

Pantallas de configuración e información: URL del backend, tema, densidad del grid, info de la app y estadísticas de la librería.

## Context

- Motivación central de la app: conectarse al backend por Tailscale DNS o IP privada sin abrir el navegador. En fase 1 la URL se guarda pero la conexión es mock (decisión del usuario).
- Estadísticas derivadas del mock: 6 novelas, 66 EPUBs, 1 PDF/5 web.

## Proposed change

1. **Ajustes** (`(tabs)/settings.tsx`), con ListGroup por secciones:
   - Servidor: TextField URL (`http://` o `https://`, placeholder `http://<tailscale-dns-o-ip>:8000`) + Button "Probar conexión" → mock (éxito si la URL es sintácticamente válida, error si no) + estado guardado.
   - Apariencia: tema auto/claro/oscuro (Select o segmented), con efecto inmediato.
   - Biblioteca: densidad del grid Auto/2/4/8 (override de la spec 02).
   - Info de la app: versión, stack (Expo 58 + HeroUI Native).
   - Páginas extra: enlace a Estadísticas y a una página "Acerca de / Ayuda" estática.
2. **Estadísticas** (`settings/statistics.tsx`): cards con contadores: novelas totales, EPUBs originales, EPUBs traducidos, total, origen (web/PDF), capítulos descargados y traducidos acumulados, idiomas de traducción presentes.

## Technical decision

- "Probar conexión" mock puro, sin red: valida sintácticamente la URL y responde con toast/alerta.
- Estadísticas calculadas desde `src/lib/mock/data.ts` (no hardcodeadas) para que sirvan igual con la API real.

## Affected files

Modificados: `src/app/(tabs)/settings.tsx`, `src/app/settings/statistics.tsx` (sustituyen a los stubs de la spec 02).

## Tests

- `npx tsc --noEmit` + `npx expo lint`.
- Smoke manual: cambiar tema/densidad y verificar persistencia + efecto inmediato; URL inválida → error mock; estadísticas cuadran con el mock (6 novelas / 66 EPUBs / 1 PDF / 5 web).

## Acceptance criteria

- [ ] Ajustes completo con persistencia y efecto inmediato de tema y densidad.
- [ ] "Probar conexión" mock con feedback visual claro.
- [ ] Estadísticas correctas y derivadas de los datos (no hardcodeadas).
- [ ] Navegación Ajustes → Estadísticas y páginas extra operativa.
- [ ] `tsc --noEmit` y `expo lint` en verde.
