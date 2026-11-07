---
code: "01"
title: "Contrato API 0.3.1: totales reales, lock 409 y estado cancelling"
project: "novel-library-mobile"
status: proposed
version: "0.5.0"
date: 2026-11-07
tags: [spec, sdd, api, jobs, errores, progreso]
affected_files:
  - src/lib/types.ts
  - src/lib/api.ts
  - src/lib/http-api-client.ts
  - src/lib/jobs.ts
  - src/lib/novel-detail.ts
  - src/lib/downloads.ts
  - "src/app/(tabs)/download.tsx"
  - src/components/job-row.tsx
  - src/components/detail-content.tsx
  - src/components/detail-sheets.tsx
  - docs/arquitectura.md
---

# 01 — Contrato API novel-cli 0.3.1

## Purpose

Adaptar el frontend a los cambios de semántica de la API 0.3.1 sin cambiar
endpoints ni campos: totales reales del TOC, conflicto 409 por novela y estado
`cancelling`. El objetivo es que la app no muestre progreso falso, no entre en
bucles de reintento y mantenga la barra de job activa durante la cancelación.

## Context

- `chapters_total` ahora es el tamaño real del TOC; `chapters_downloaded` y
  `chapters_translated` pueden ser menores. Un manifest antiguo puede seguir
  diciendo “completo” hasta que un job resuelva el TOC.
- `POST /api/jobs`, `/api/novels/{slug}/sync` y `/retranslate` pueden devolver
  **409** con `detail: { message, job_id }` si ya hay un job para la misma
  novela (URL normalizada, sin barra final). `detail` también puede seguir
  siendo un string en 400/404.
- `POST /api/jobs/{id}/cancel` puede devolver `{ cancelled: true, state:
  "cancelling" }`; `cancelling` no es terminal. Los estados son `pending |
  running | cancelling | done | error | cancelled`.
- Al cancelar, el backend conserva `raw/` y un job nuevo reanuda; la app puede
  decir “se reanudará desde donde se quedó”.
- Tras regenerar/reparar una novela, el slug no cambia: hay que refrescar ficha
  y biblioteca, y los EPUB locales antiguos deben renovarse al re-descargar.

Referencia: contrato API novel-cli 0.3.1 (nota del usuario, 2026-11-07).

## Proposed change

### 1. Progreso real

- `chapters_total` se usa como denominador en Detalle y Estadísticas; no se
  asume que `chapters_downloaded === chapters_total` ni que la novela está
  completa.
- La fila “Descargados” del Detalle muestra `N / total (P %)` con
  `P = round(N / total * 100)`, cifras tabulares y barra clampeada a 0–100.
  “Traducidos” mantiene su barra `success` con el mismo formato.
- El contador de la biblioteca no cambia (novelas/tomos); las cifras derivadas
  de Estadísticas se recalculan con la nueva semántica.
- Al terminar un job se refresca la ficha (`load()`) y, al volver a Biblioteca,
  `useFocusEffect` recarga la lista. No se cachea `chapters_total`.
- Manifest antiguo: si el backend devuelve un total menor o igual al descargado
  pero el job de sync está pendiente, no se pinta “completo” de forma especial;
  se muestra la cifra real y se refresca al terminar.

### 2. Lock 409 al crear jobs

- `ApiError` gana `detail?: unknown` y `jobId?: string | null`.
- `HttpApiClient.toApiError` parsea `detail` string **o** objeto:
  - string → mensaje actual;
  - objeto con `message`/`job_id` → mensaje y `jobId` disponibles.
- `ApiClient.createJob`, `uploadPdf`, `syncNovel` y `retranslateNovel` siguen
  devolviendo `{ job_id }` en éxito; el 409 se propaga como `ApiError` 409.
- En Descargar (`submitWeb`, `submitPdf`) un 409 con `jobId`:
  1. no reintenta;
  2. llama a `trackJob(job_id, source)` para adjuntarse al job existente;
  3. muestra el aviso “Ya hay una descarga en curso para esta novela. Puedes
     seguirla en la barra de progreso.”;
  4. si no hay `jobId`, muestra el `message` del backend sin bucle.
- `trackJob` deduplica por `id` antes de añadir a la lista de trabajos.
- En Detalle (`runSync`, `runRetranslate`) un 409 con `jobId` llama a
  `followJob(jobId, kind)` y muestra el mismo aviso; el job inline se actualiza.
- Cualquier 409 (también sin `jobId`) se trata como error de conflicto, nunca
  como reintento automático.

### 3. Estado cancelling

- `JobState` incluye `"cancelling"`.
- `TERMINAL_STATES` sigue siendo `done | error | cancelled`: `cancelling` se
  sigue sondeando.
- `isActiveState` incluye `cancelling` para mantener la barra/fila activa y
  bloquear nuevas acciones.
- `JOB_LABELS.cancelling = "Cancelando…"`; la fila muestra spinner.
- `ApiClient.cancelJob` devuelve `{ cancelled: boolean; state?: JobState }`.
- En Descargar (`cancelJob`) y Detalle (`cancelActionJob`):
  - no se aborta el polling al recibir `cancelling`;
  - se actualiza la fila a `cancelling` y se mantiene el `Cancelar`
    deshabilitado/oculto hasta `cancelled`;
  - si la respuesta no trae `state` (backend antiguo), se asume `cancelled` y se
    aborta como hoy;
  - si cancel devuelve 404, se hace `GET /api/jobs/{id}` para refrescar; si el
    job ya no existe, se quita de la lista con un aviso, sin inventar estado.
- Mientras un job esté `pending|running|cancelling`:
  - CTA “Sincronizar” y acciones del sheet (Retraducir/Tamaño) quedan
    bloqueadas para esa novela;
  - en Descargar no se lanza otro job de sesión (ya existe `activeJob`);
  - al recibir `cancelled`, se muestra “Descarga cancelada. Al reanudar se
    continuará desde donde se quedó.”.
- El copy del toast de cancelación deja de ser solo el id.

### 4. Caché local tras reparar/regenerar

- `downloads.ts` añade `clearEpubs(slug)` para borrar el directorio local de la
  novela (`Paths.document/epubs/<slug>`).
- En Detalle, tras un job `done` se compara la firma de tomos
  (`epub_original` + `epub_translated` + `volume_size`) antes/después de
  `load()`:
  - si cambió, se limpia la caché local del slug, se resetean `rowStates` y se
    avisa “Novela reparada: N capítulos y M tomos disponibles. Vuelve a
    descargar los EPUBs.”;
  - si no cambió, solo se refresca la ficha.
- `runVolumeSize` limpia la caché local al terminar (los nombres/rangos de tomo
  cambian) y avisa que hay que volver a descargar.
- No se borra nada si el job falla o se cancela.
- El panel de tablet usa el mismo hook, así que hereda la limpieza y el aviso.

### 5. Mock

- `MockApiClient.cancelJob` devuelve `{ cancelled: true, state:
  "cancelling" }` y el siguiente `getJob` devuelve `cancelled` (registro en
  memoria por id).
- Se añade un job mock que tarda varios polls para poder probar `cancelling`
  sin backend; el resto de jobs siguen terminando en `done`.
- El mock sigue aceptando el contrato 0.3.1 sin 409 salvo un caso forzado de
  test (si se añade una opción de depuración, documentarla).

## Technical decision

- La semántica de `chapters_total` no requiere cambio de tipos, solo de copy y
  de no asumir completitud.
- El 409 se modela en `ApiError` en vez de crear una excepción nueva: las
  pantallas ya discriminan por `status`. `jobId` evita parsear de nuevo el
  cuerpo.
- `cancelling` se añade al tipo compartido y a los labels; `pollJob` no cambia
  de lógica salvo que sigue sondeando porque no es terminal.
- La cancelación deja de abortar el `AbortController` en el camino feliz; el
  polling termina por sí solo al recibir `cancelled`.
- La limpieza de EPUBs es explícita y acotada al slug; no se borra toda la
  carpeta de descargas. Es destructiva, así que solo ocurre cuando cambia la
  firma de tomos o el tamaño de tomo, y se avisa al usuario.
- No se añaden endpoints ni dependencias.

## Affected files

`src/lib/types.ts`, `src/lib/api.ts`, `src/lib/http-api-client.ts`,
`src/lib/jobs.ts`, `src/lib/novel-detail.ts`, `src/lib/downloads.ts`;
`src/app/(tabs)/download.tsx`; `src/components/job-row.tsx`,
`detail-content.tsx`, `detail-sheets.tsx`; `docs/arquitectura.md` y
`specs/0.5.0/00-changelog.md` al cierre.

## Tests

**Emulador**: `Expo` (móvil) para los flujos de jobs/errores; `Medium_Tablet`
solo si se toca el panel (el hook es compartido). Secuencial, nunca a la vez.

1. `npx tsc --noEmit` y `npx expo lint`.
2. Con API 0.3.1 real: una novela con `chapters_total` 513 y
   `chapters_downloaded` 50 muestra `50 / 513 (10 %)` y barra al 10 %.
3. Lanzar un job y, con otro cliente/curl, lanzar el mismo para provocar 409:
   la app se adjunta al `job_id`, muestra el aviso y no crea otra fila.
4. Probar 409 en `/sync` y `/retranslate` desde Detalle: job inline
   actualizado, sin `Alert`, sin reintento.
5. Cancelar un job largo: estado `cancelling`, spinner, “Cancelando…”, CTA y
   acciones bloqueadas; al llegar `cancelled`, toast con “se continuará desde
   donde se quedó” y botones habilitados.
6. Cancelar un job ya terminado (404): refresco de `GET /api/jobs`, sin estado
   inventado.
7. Reparar/regenerar una novela: la ficha y la biblioteca muestran el total
   nuevo; la caché local del slug se limpia y se avisa de re-descargar.
8. Cambiar tamaño de tomo: caché local limpia y tomos nuevos listados.
9. Mock: job lento, cancelación `cancelling → cancelled` y aviso.
10. Claro/oscuro y font scale 1.0/1.3 en los textos nuevos.

## Acceptance criteria

- [ ] El progreso usa `chapters_total` real y muestra `N / total (P %)`.
- [ ] Un 409 con `job_id` adjunta el job existente sin reintentar ni duplicar.
- [ ] El 409 muestra el aviso acordado y funciona también en sync/retranslate.
- [ ] `detail` string y objeto se parsean sin romper 400/404.
- [ ] `cancelling` existe en el tipo, labels y UI; no es terminal.
- [ ] Cancelar mantiene el polling, bloquea acciones y termina en `cancelled`.
- [ ] Un 404 al cancelar refresca el job real.
- [ ] Al cancelar se informa de que se reanudará desde lo descargado.
- [ ] Reparar/regenerar refresca ficha/biblioteca y limpia la caché del slug.
- [ ] El mock permite probar `cancelling` sin backend.
- [ ] `npx tsc --noEmit` y `npx expo lint` pasan.
- [ ] Un solo emulador a la vez; se apaga al terminar.
