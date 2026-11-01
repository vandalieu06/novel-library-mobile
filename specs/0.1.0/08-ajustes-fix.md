---
code: "08"
title: "Ajustes: guardado automático de la URL, estado de conexión fiable y captions explicativas"
project: "novel-library-mobile"
status: completed
version: "0.1.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/app/(tabs)/settings.tsx
  - docs/arquitectura.md
---

# 08 — Ajustes: correcciones y claridad

## Purpose

Corregir dos defectos detectados en revisión y añadir contexto a las secciones
de Ajustes, sin cambiar la estructura (ListGroup + segmented + campos).

## Context

- Bug 1: `apiUrl` solo se persiste al pulsar "Probar conexión"; si el usuario
  escribe y abandona la pantalla, se pierde al recargar.
- Bug 2: el estado "Conexión correcta (mock)" no se invalida al editar la URL,
  mostrando un resultado que ya no corresponde al valor actual.
- Captions ausentes: no se explica que la conexión es simulada en fase 1, que
  "Auto" en Tema sigue al sistema, ni qué resuelve "Auto" en Densidad.

## Proposed change

1. **Guardado automático del URL + estado fiable** (`settings.tsx`):
   - Debounce de ~500 ms al escribir (`useEffect` + `setTimeout`, con cleanup)
     que persiste `apiUrl` vía `updateSettings`; además `onEndEditing` guarda
     inmediato.
   - Cualquier cambio en el draft resetea `connStatus` a idle y limpia el
     mensaje.
   - Indicador "Guardado" transitorio (text-xs + check) junto al campo tras
     persistir.
2. **Captions explicativas**:
   - Servidor: "En fase 1 la conexión se valida localmente (mock); se usará en
     la fase 2 con la API real." (text-xs muted bajo el campo).
   - Tema: caption "Auto sigue al sistema (claro/oscuro)."
   - Densidad: caption "Auto: 3 columnas en móvil y 4/8 en tablet."
3. **Sin cambios de esquema**: `apiUrl` ya vive en `AppSettings`; no se añaden
   campos (el `lastJobOptions` de spec 07 queda intacto).

## Technical decision

- Debounce con efecto + timeout callback (no setState síncrono en el efecto
  → compatible con `react-hooks/set-state-in-effect`).
- "Guardado" como estado local con timeout de 1.5 s; no toast (evita ruido).
- Restablecer ajustes NO entra en esta spec (queda como candidato a fase 2,
  requiere Dialog de confirmación).

## Affected files

`src/app/(tabs)/settings.tsx`, `docs/arquitectura.md` (nota del guardado
automático).

## Tests

- tsc + lint; visual: escribir URL sin probar → reload → permanece; editar
  tras un test OK → el estado verde desaparece; "Guardado" aparece al
  persistir; captions visibles en ambas secciones.

## Acceptance criteria

- [ ] La URL persiste con solo escribir (sin pulsar Probar) y sobrevive al reload.
- [ ] Editar la URL invalida el estado de conexión anterior.
- [ ] Captions de Servidor/Tema/Densidad presentes y en text-xs.
- [ ] "Guardado" transitorio tras persistir; tsc + lint en verde y commit.
