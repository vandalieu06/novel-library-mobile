---
code: "04"
title: "Jobs con polling y acciones reales del detalle (sync, retraducir, tamaño de tomo)"
project: "novel-library-mobile"
status: proposed
version: "0.2.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/lib/types.ts
  - src/lib/api.ts
  - src/lib/http-api-client.ts
  - src/lib/jobs.ts
  - src/lib/languages.ts
  - src/app/(tabs)/index.tsx
  - src/app/novel/[slug].tsx
---

# 04 — Jobs con polling y acciones reales del detalle

## Purpose

Cerrar la fase real con jobs visibles en la app (polling de estado, sin WebSocket) y las acciones secundarias del detalle contra el backend: sincronizar capítulos, retraducir a otro idioma y regenerar los tomos con otro tamaño.

## Context

- Backend (`routes.py`, `jobs.py`): `GET /api/jobs/{id}` devuelve `{ id, url, state, error, slug, result, events }`; `state` ∈ `pending | running | done | error | cancelled` (constantes `JOB_*` en `jobs.py`). `POST /api/jobs/{id}/cancel` → `{ cancelled: true }` o 404 si no es cancelable.
- Acciones: `POST /api/novels/{slug}/sync` → `{ job_id }`; `POST /api/novels/{slug}/retranslate` con body `{ target_language }` → `{ job_id }`; `POST /api/novels/{slug}/volume-size` con body `{ volume_size }` (o `null` = sin división, `>= 1`) → **síncrono** `{ ok, volume_size, epub_original, epub_translated }` (no crea job).
- Hoy Inicio muestra un toast "Job creado (mock)" y olvida el `job_id`; el detalle no tiene acciones. `TRANSLATE_TARGETS`, `TRANSLATE_OPTIONS` y `VOLUME_SIZES` viven dentro de `(tabs)/index.tsx`.
- `ApiClient` (specs 01-03) cubre novelas, jobs de creación, upload y descarga; faltan `getJob`, `cancelJob`, `syncNovel`, `retranslateNovel` y `changeVolumeSize`.
- Regla de UI ya aprendida: `SelectOption` es `{value,label}` y puede ser `undefined`; `Select.Value` exige `placeholder`; BottomSheet necesita `contentContainerClassName` para padding/gap; nada de jobbar global ni WebSocket en esta fase (decisión del usuario).

## Proposed change

1. **Tipos** (`src/lib/types.ts`): `JobState`, `JobInfo { id, url, state, error, slug, result }`, `VolumeSizeResult { ok, volume_size, epub_original, epub_translated }` (espejo del payload real).
2. **`ApiClient`** (`src/lib/api.ts`) gana:
   - `getJob(jobId): Promise<JobInfo>`
   - `cancelJob(jobId): Promise<{ cancelled: boolean }>`
   - `syncNovel(slug): Promise<{ job_id: string }>`
   - `retranslateNovel(slug, targetLanguage): Promise<{ job_id: string }>`
   - `changeVolumeSize(slug, volumeSize: number | null): Promise<VolumeSizeResult>`
   - `HttpApiClient` los implementa con `request()` (token, timeout, mapeo `detail`/401/red). `MockApiClient` mantiene la app usable sin servidor: `getJob` devuelve `done` tras latencia simulada, sync/retranslate devuelven ids mock y `changeVolumeSize` devuelve los mismos EPUBs de la novela con el nuevo `volume_size`.
3. **`src/lib/jobs.ts`** (nuevo): `pollJob(api, jobId, { intervalMs = 2000, timeoutMs = 10 * 60 * 1000, signal?, onUpdate? }): Promise<JobInfo>`.
   - Consulta inmediata y luego cada `intervalMs`; llama `onUpdate` en cada respuesta.
   - Resuelve al llegar a `done | error | cancelled`; al superar `timeoutMs` lanza `ApiError("El job tardó demasiado", 0)`.
   - Cancela el timer y respeta `AbortSignal` (desmontaje de pantalla); un 404 → `ApiError` del backend.
4. **`src/lib/languages.ts`** (nuevo): mover `TRANSLATE_TARGETS`, `TRANSLATE_OPTIONS`, `VOLUME_SIZES` (`[50, 100, 150, 200]`) desde Inicio; añadir `volumeSizeOptions(includeAll)` para el sheet del detalle (`Todos` = `null`). Inicio pasa a importarlos.
5. **Inicio — job inline** (`(tabs)/index.tsx`):
   - Tras `createJob`/`uploadPdf`, guardar `{ id, source: "web" | "pdf" }` en estado `activeJob` y lanzar `pollJob`.
   - Tarjeta inline bajo el botón (no modal): `Spinner` + etiqueta por estado ("En cola", "Trabajando…", "Listo", "Error", "Cancelado"), `error` del backend si lo hay, y botón "Cancelar" mientras `pending | running` (llama `cancelJob` y detiene el polling).
   - Al terminar en `done`: toast con `result`/slug si viene; al cerrar la tarjeta se limpia el estado. Un nuevo submit mientras hay job activo se bloquea con aviso.
6. **Detalle — acciones** (`novel/[slug].tsx`), fila de botones secundarios bajo el hero ("Sincronizar", "Retraducir", "Tomos"):
   - Estado compartido `actionBusy: "sync" | "retranslate" | "volume" | null` y `actionJob: { id, state, error } | null`; tarjeta de progreso reutilizable mientras corre un job.
   - **Sync**: `Dialog` (heroui) de confirmación ("Descargar capítulos nuevos puede tardar") → `syncNovel` → `pollJob` → al terminar `load()` de la novela y toast con el resultado (`error` del job si falló).
   - **Retraducir**: `BottomSheet` con `Select` de `TRANSLATE_OPTIONS` (excluye el idioma actual si existe; `placeholder` obligatorio) + botón "Retraducir a X" → `retranslateNovel` → `pollJob` → al terminar `load()` y toast.
   - **Tamaño de tomo**: `BottomSheet` con opciones 50/100/150/200 + "Todos (sin dividir)" → `changeVolumeSize(slug, value)` (síncrono) → actualizar el `novel` en estado con `volume_size`, `epub_original` y `epub_translated` devueltos, toast "Tomos regenerados" y cerrar el sheet. Sin polling.
   - Errores: `ApiError.message` en la tarjeta/sheet (401 → "Revisa el token en Ajustes"); nunca cerrar la pantalla ante un fallo de acción.
7. **Refresco cruzado**: al volver del detalle a Books, el listado se recarga con `useFocusEffect` (una vez por foco) para reflejar sync/retraducción sin reiniciar la app.

## Technical decision

- **Polling cada 2 s** en vez de WebSocket `/ws`: suficiente, sin gestión de reconexión, y el backend ya expone `GET /api/jobs/{id}` (decisión del usuario: sin jobbar global).
- Polling encapsulado en `pollJob` para no duplicar timers entre Inicio y Detalle; `AbortSignal` evita actualizar estado tras desmontar (regla `set-state-in-effect`).
- Los jobs de sync/retranslate se muestran **dentro** de la pantalla que los lanza; no hay bandeja global de jobs (fuera de alcance).
- `volume-size` es síncrono (regenera EPUBs en el request): no se hace polling, se aplica la respuesta directamente al estado local. `null` = "Todos", que el backend interpreta como sin división.
- Idiomas y tamaños compartidos en `src/lib/languages.ts`: evita que Inicio y Detalle diverjan del catálogo del backend (`TRANSLATE_TARGET_LANGUAGES`).
- Confirmación explícita solo en sync (operación larga y costosa); retraducir y cambiar tomos ya llevan una acción explícita en el sheet.
- Books se refresca con `useFocusEffect` (sin caché global) para reflejar cambios sin introducir un store.

## Affected files

Nuevos: `src/lib/jobs.ts`, `src/lib/languages.ts`.
Modificados: `src/lib/types.ts` (JobInfo/JobState/VolumeSizeResult), `src/lib/api.ts` (contrato + mock), `src/lib/http-api-client.ts` (5 métodos), `src/app/(tabs)/index.tsx` (job inline + imports de languages), `src/app/novel/[slug].tsx` (acciones, sheets, diálogo y refresco).

## Tests

- `npx tsc --noEmit` y `npx expo lint` en verde.
- Verificado en emulador (2026-11-01): upload real → tarjeta "Trabajando…" → "Listo" con polling; `volume-size` real de 50→100 regenerando los tomos (2 EPUBs) sobre una copia en `/tmp`; sync y retraducir en mock (diálogo/sheet, job y refresco). Sync/retraducir reales no se ejecutaron para no lanzar descargas/traducciones sobre la biblioteca del usuario; comparten el mismo `pollJob` verificado con el upload.
- Smoke real en emulador contra el servidor:
  - Inicio: lanzar un job → tarjeta "En cola"/"Trabajando…" → "Listo"; cancelar un job en curso → "Cancelado" y `GET /api/jobs/{id}` en el servidor refleja el estado.
  - Servidor caído a mitad de polling → tarjeta de error con mensaje; no crashea.
  - Detalle → Sync con confirmación → job visible → al terminar, contadores de capítulos actualizados.
  - Detalle → Retraducir a otro idioma → job → al terminar, `translated_language` y EPUBs actualizados.
  - Detalle → tamaño 100 → tomos recalculados en la lista (y `GET /api/novels/{slug}` coincide).
  - URL vacía (mock): los tres flujos responden y muestran estados simulados.

## Acceptance criteria

- [x] `getJob`, `cancelJob`, `syncNovel`, `retranslateNovel` y `changeVolumeSize` existen en el contrato y en HTTP/mock.
- [x] Inicio muestra tarjeta inline con estado/error del job y permite cancelar mientras corre.
- [x] Sync del detalle confirma, crea job visible, hace polling y refresca la novela al terminar.
- [x] Retraducir abre sheet con idiomas, lanza el job y actualiza el idioma/EPUBs al terminar.
- [x] Tamaño de tomo abre sheet (50/100/150/200/Todos) y actualiza la lista de EPUBs con la respuesta síncrona.
- [x] Los errores (HTTP, 401, red, timeout) se muestran sin cerrar la pantalla.
- [x] Books refleja los cambios al volver del detalle.
- [x] Con URL vacía los flujos siguen funcionando en mock.
- [x] `tsc --noEmit` y `expo lint` en verde.
