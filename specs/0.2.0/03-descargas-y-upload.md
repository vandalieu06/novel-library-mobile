---
code: "03"
title: "Descargas reales de EPUB y subida real de PDF"
project: "novel-library-mobile"
status: completed
version: "0.2.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - package.json
  - pnpm-lock.yaml
  - src/lib/types.ts
  - src/lib/api.ts
  - src/lib/http-api-client.ts
  - src/lib/downloads.ts
  - src/app/novel/[slug].tsx
  - src/app/(tabs)/index.tsx
---

# 03 — Descargas reales de EPUB y subida real de PDF

## Purpose

Descargar los EPUB de la biblioteca real al dispositivo y abrirlos con el lector del sistema, y subir un PDF real al servidor para crear un job de conversión. Es la primera spec que añade módulos nativos, así que exige rebuild del dev build.

## Context

- Endpoints ya disponibles: `GET /api/novels/{slug}/epub/{filename}` (FileResponse `application/epub+zip`) y `POST /api/upload` (multipart: `file`, `source_language`, `translate`, `target_language`, `volume_size`). Ambos requieren `X-Auth-Token` si el servidor lo tiene configurado.
- Hoy `downloadEpub` devuelve `{ ok: true }` tras latencia simulada y la pantalla muestra "Descarga lanzada (mock)". `uploadPdf` solo valida el nombre del archivo; Inicio guarda únicamente `pdfFile` (el nombre) y `pickPdf` usa `copyToCacheDirectory: false`, así que no hay URI legible para subir.
- `expo-document-picker ~58.0.4` ya está instalado. **No** están `expo-file-system` ni `expo-sharing` → son módulos nativos: `npx expo install` + rebuild con `pnpm run android` (avisar al usuario antes).
- API vigente de `expo-file-system` en SDK 58 (docs `v58.0.0/sdk/filesystem`): clases `File`, `Directory`, `Paths`; `File.downloadFileAsync(url, destination, options)` con `headers` en `DownloadOptions`; `new File(uri)` implementa `Blob` y `File.createUploadTask`. La API antigua (`FileSystem.downloadAsync`, `uploadAsync`) está deprecada y solo existe bajo `expo-file-system/legacy`.
- `expo-sharing`: `Sharing.isAvailableAsync()` + `Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle })`.
- `expo/fetch` (el fetch de Expo) acepta `File` de `expo-file-system` como valor de `FormData` (documentado en la guía de file-system v58).
- EPUBs reales: hasta 4 tomos por novela (~1-5 MB cada uno).

## Proposed change

1. **Dependencias**: `npx expo install expo-file-system expo-sharing`; rebuild con `pnpm run android` (prebuild + gradle + install + bundler). Sin plugins de `app.json` (no se necesita file sharing con la app Files; se usa el share sheet).
2. **`src/lib/downloads.ts`** (nuevo):
   - `downloadsDirectory(slug)` → `new Directory(Paths.document, "epubs", slug)`; `create({ intermediates: true, idempotent: true })`.
   - `sanitizeFilename(name)`: rechaza `/`, `\` y `..` (defensa ante paths del servidor).
   - `saveEpub(slug, filename, bytes: Uint8Array): Promise<string>` → escribe con `new File(dir, filename).write(bytes)` y devuelve `uri`.
   - `openEpub(uri)`: si `Sharing.isAvailableAsync()` → `Sharing.shareAsync(uri, { mimeType: "application/epub+zip", UTI: "org.idpf.epub-container", dialogTitle: filename })`; si no, `new File(uri).preview()` como fallback.
3. **Contrato** (`src/lib/api.ts` + `src/lib/types.ts`):
   - `downloadEpub(slug, filename): Promise<{ ok: true; bytes: Uint8Array | null }>` — `HttpApiClient` hace `fetch` con token y `response.bytes()` (siempre bytes en real); `MockApiClient` devuelve `{ ok: true, bytes: null }` tras latencia.
   - `UploadPdfRequest` gana `uri: string` (URI local del PDF). `filename` se mantiene para validación/mock.
4. **`HttpApiClient.uploadPdf`**: `const file = new File(request.uri)`; `FormData` con `form.append("file", file)` + `source_language`, `translate` ("true"/"false"), `target_language` y `volume_size` (strings, solo si no son null); `expo/fetch(`${baseUrl}/api/upload`, { method: "POST", headers: token, body: form })`; parsea `{job_id}` y aplica el mismo mapeo de errores que `request()`.
   - **Fallback documentado**: si el `FormData`/`expo/fetch` falla (TypeError de multipart o 4xx/5xx inesperado), reintentar una vez con `file.createUploadTask(url, { uploadType: UploadType.MULTIPART, fieldName: "file", mimeType: "application/pdf", parameters: {...}, headers })` y parsear `result.body`/`status`. Se deja comentado en el código el motivo y la diferencia con el FormData.
5. **Inicio** (`(tabs)/index.tsx`):
   - `pickPdf`: `copyToCacheDirectory: true`; guardar `{ uri, name, size }` en estado (`pdfFile` pasa de `string` a objeto) y mostrar nombre + tamaño.
   - `submitPdf`: enviar `uri` en `UploadPdfRequest`; el resto del formulario no cambia. Con mock (URL vacía) sigue funcionando sin tocar el archivo.
6. **Detalle** (`novel/[slug].tsx`):
   - Estado por fila: `type RowState = "idle" | "downloading" | "ok" | "error"` en un `Record<filename, RowState>`; botón muestra `Spinner` mientras descarga, check al terminar y texto de error en la fila si falla (además del toast).
   - `download(filename)`: `const { bytes } = await api.downloadEpub(...)`; si `bytes === null` (mock) → toast "Descarga simulada (mock)" y fin; si hay bytes → `saveEpub` → `openEpub(uri)` → toast "EPUB descargado" con el nombre. Un 401 se muestra como error de token.
   - Deshabilitar solo la fila en curso (no todos los botones, como ahora).
7. **Changelog/arquitectura**: al cerrar, documentar que `expo-file-system`/`expo-sharing` son módulos nativos (rebuild obligatorio tras pull).

## Technical decision

- **`expo-file-system` moderno** (`File`/`Directory`/`Paths`), no `/legacy`: la API antigua está deprecada y lanza en runtime en SDK 58. `File.downloadFileAsync` soporta `headers`, pero se usa `fetch` + `write` para reutilizar el mapeo de errores HTTP (`detail`/401) que ya tiene `HttpApiClient`; `downloadFileAsync` queda como plan B si `bytes()` falla con archivos grandes.
- Destino `Paths.document` (persistente) y no `Paths.cache`: el usuario descarga para leer; la caché puede ser purgada por el sistema. Sin limpieza automática en esta spec.
- `expo-sharing` como camino principal (requisito del usuario: "abrir con el lector"); `File.preview()` solo como fallback sin share sheet.
- `FormData` + `File` de `expo/fetch` como camino principal de subida (API documentada en SDK 58 y sin depender de la forma `{uri,name,type}` de RN, que no es fiable en la nueva arquitectura); `createUploadTask` como fallback nativo.
- El mock no escribe archivos ni abre share sheet: devuelve `bytes: null` para no ensuciar el dispositivo.
- Sin descarga masiva ni cola persistente: una descarga por toque, estado en memoria.

## Affected files

Nuevos: `src/lib/downloads.ts`.
Modificados: `package.json`, `pnpm-lock.yaml` (expo-file-system, expo-sharing), `src/lib/types.ts` (`UploadPdfRequest.uri`), `src/lib/api.ts` (firma `downloadEpub` + mock), `src/lib/http-api-client.ts` (bytes + multipart/upload task), `src/app/novel/[slug].tsx` (descarga real por fila), `src/app/(tabs)/index.tsx` (picker con URI y upload real).

## Tests

- `npx expo install` + `pnpm run android` sin errores; `npx expo-doctor` limpio.
- `npx tsc --noEmit` y `npx expo lint` en verde.
- Verificado en emulador (2026-11-01) con `novel-cli web` local: descarga de un EPUB real guardado en Documentos y share sheet abierto; subida de un PDF de 4,9 MB con `job_id` y conversión real completada (biblioteca de prueba en `/tmp`); descarga simulada y estados por fila en mock.
- Smoke real en emulador contra el servidor:
  - Descargar un EPUB original y uno traducido: spinner → check → share sheet con "Abrir con" y el lector lo abre; el archivo existe en Documentos (`epubs/<slug>/`).
  - Servidor caído durante la descarga → fila en error + toast, sin share sheet; reintentar funciona.
  - Token inválido → error 401 visible (mensaje de token).
  - Subir un PDF: picker conserva URI, `POST /api/upload` devuelve `job_id` y el toast lo muestra; el job aparece en el servidor (`GET /api/jobs`).
  - URL vacía (mock): descarga simulada y upload simulado siguen funcionando sin archivos.

## Acceptance criteria

- [x] `expo-file-system` y `expo-sharing` instalados con `npx expo install` y dev build regenerado.
- [x] Descargar un EPUB real lo guarda en el dispositivo y abre el share sheet con un lector compatible.
- [x] Cada fila de tomo tiene estado downloading/ok/error y no bloquea las demás.
- [x] Subir un PDF real crea un job en el servidor y la app muestra el `job_id`.
- [x] Los errores HTTP (incluido 401) y de red se muestran con el mensaje del backend.
- [x] Con URL vacía el modo mock sigue funcionando sin escribir archivos.
- [x] `tsc --noEmit` y `expo lint` en verde.
