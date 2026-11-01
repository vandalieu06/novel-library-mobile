---
code: "01"
title: "HttpApiClient real, token y selección de cliente por URL"
project: "novel-library-mobile"
status: completed
version: "0.2.0"
date: 2026-11-01
tags: [spec, sdd]
affected_files:
  - src/lib/api.ts
  - src/lib/http-api-client.ts
  - src/lib/api-client.ts
  - src/lib/api-provider.tsx
  - src/lib/settings.ts
  - src/app/_layout.tsx
  - src/app/(tabs)/settings.tsx
  - src/app/(tabs)/books.tsx
  - src/app/(tabs)/index.tsx
  - src/app/novel/[slug].tsx
---

# 01 — HttpApiClient real, token y selección de cliente por URL

## Purpose

Sustituir el mock como única fuente de datos por un cliente HTTP real contra `novel-cli web`, conservando `MockApiClient` para cuando no hay servidor configurado. Incluye el token de autenticación (`X-Auth-Token`) y una prueba de conexión real en Ajustes.

## Context

- Backend FastAPI ya disponible en `translate_novels/src/novel_cli/web/routes.py` (no se toca): todo bajo `/api`, protegido por header `X-Auth-Token` **solo si** el servidor define `NOVEL_WEB_TOKEN` (`app.py` responde `401 {"detail": "token invalido"}`).
- Endpoints que usa esta spec: `GET /api/novels`, `GET /api/novels/{slug}`, `POST /api/jobs`, `POST /api/upload`, `GET /api/novels/{slug}/epub/{filename}`.
- Errores del backend: `HTTPException` con `detail` string (400/401/404). La app debe mostrarlo tal cual (`ApiError.message`) y conservar el status.
- Hoy `src/lib/api.ts` exporta `ApiClient`, `ApiError`, `MockApiClient`, `isHttpUrl` y una instancia global `api`. Las pantallas importan `{ api }` directamente; `testConnection` es mock puro (solo valida la URL).
- `AppSettings` (`src/lib/settings.ts`) tiene `apiUrl`, `theme`, `gridDensity`, `lastJobOptions`; no hay token. Ajustes ya guarda `apiUrl` con debounce + `onEndEditing` (spec 0.1.0-08).
- CORS no aplica (cliente nativo). La URL llega por Tailscale DNS o IP privada.

## Proposed change

1. **`src/lib/http-api-client.ts`** (nuevo): `HttpApiClient implements ApiClient`.
   - Constructor recibe `{ baseUrl, token }`; normaliza la URL (trim, sin `/` final).
   - Helper privado `request<T>(path, init?)` que añade `X-Auth-Token` si `token !== ""`, `Accept: application/json` y un `AbortController` con timeout de 10 s.
   - Mapeo de errores: respuesta `!ok` → lee el body JSON y lanza `ApiError(detail ?? "Error HTTP <status>", status)`; fallo de red/abort → `ApiError("Sin conexión con el servidor", 0)`.
   - Implementa `getNovels`, `getNovel(slug)`, `createJob(request)` y `uploadPdf(request)`.
   - `uploadPdf`: `FormData` con `file` + `source_language`, `translate`, `target_language`, `volume_size` (solo los definidos, como strings).
   - `downloadEpub(slug, filename)`: `fetch` binario con token y `AbortController`; devuelve `{ ok: true }` en esta spec (la escritura a disco y el share sheet son la spec 03).
   - `testConnection(url)`: `GET {url}/api/novels` con el token actual. 200 → `{ ok: true }`; 401 → `ApiError("Token inválido o no configurado", 401)`; red/timeout → `ApiError("Sin conexión con el servidor", 0)`; URL no http(s) → `ApiError` de validación.
2. **`src/lib/api.ts`**: se mantienen `ApiError`, `ApiClient` y `MockApiClient` (la app sigue usable sin servidor). Se retira la instancia global `api` y se conserva `isHttpUrl`. `ApiClient` gana en esta spec solo lo necesario (`testConnection` ya existe); el resto de métodos nuevos llega en 03/04.
3. **`src/lib/api-client.ts`** (nuevo): `createApiClient(settings: AppSettings): ApiClient` → si `settings.apiUrl.trim() === ""` devuelve `new MockApiClient()`, si no `new HttpApiClient({ baseUrl, token: settings.webToken })`.
4. **`src/lib/api-provider.tsx`** (nuevo, fuera de `src/app/`): `ApiProvider` carga settings al montar, crea el cliente con `createApiClient`, se suscribe a `onSettingsChange` para recrearlo cuando cambien `apiUrl`/`webToken`, y expone `useApi(): { api: ApiClient; settings: AppSettings; isReady: boolean }`. Mientras `isReady === false` no se renderizan hijos (evita una carga mock prematura).
5. **`src/app/_layout.tsx`**: envolver el árbol con `ApiProvider` dentro de `HeroUINativeProvider`.
6. **`src/lib/settings.ts`**: `AppSettings.webToken: string` (default `""`) y merge seguro en `loadSettings` (settings antiguos sin token → `""`).
7. **Ajustes** (`src/app/(tabs)/settings.tsx`): campo "Token (opcional)" (secureTextEntry, guardado con el mismo debounce que la URL), y "Probar conexión" pasa a usar `HttpApiClient.testConnection(url)` con el token; mensajes diferenciados OK / 401 (token) / sin red. Nota bajo el campo: el token es el `NOVEL_WEB_TOKEN` del servidor.
8. **Pantallas**: `Books`, `Detalle` e `Inicio` dejan de importar la instancia global y usan `const { api } = useApi()`. Solo se sustituye el origen del cliente; la lógica de cada pantalla no cambia en esta spec.

## Technical decision

- Contexto React (`ApiProvider`) en vez de una instancia global mutable: cambiar URL/token en Ajustes recrea el cliente y las pantallas lo reciben sin reiniciar la app; no se añade state management externo (coherente con 0.1.0-02).
- Mock como fallback con URL vacía: la app no se rompe sin servidor y sigue siendo testeable sin Tailscale. Un fallo de red **no** cae a mock: se muestra error (comportamiento explícito, spec 02).
- Timeout por petición con `AbortController` (10 s) en vez de un cliente con interceptores: suficiente para el alcance y sin dependencias nuevas.
- `formData` con strings para los campos de `/api/upload` (FastAPI `Form(...)` no acepta números en multipart de forma fiable).
- El token se guarda en `AsyncStorage` (no en `expo-secure-store`): es un token de un servidor privado en Tailscale y el proyecto ya persiste settings ahí; migrar a secure-store queda fuera de alcance.

## Affected files

Nuevos: `src/lib/http-api-client.ts`, `src/lib/api-client.ts`, `src/lib/api-provider.tsx`.
Modificados: `src/lib/api.ts` (quitar instancia global), `src/lib/settings.ts` (`webToken`), `src/app/_layout.tsx` (`ApiProvider`), `src/app/(tabs)/settings.tsx` (token + test real), `src/app/(tabs)/books.tsx`, `src/app/(tabs)/index.tsx`, `src/app/novel/[slug].tsx` (`useApi()`).

## Tests

- `npx tsc --noEmit` y `npx expo lint` en verde.
- Smoke con servidor local (`uv run novel-cli web`) y sin él:
  - URL vacía → mock (6 novelas, comportamiento idéntico a 0.1.0).
  - URL real sin token contra servidor con `NOVEL_WEB_TOKEN` → Books muestra error 401 con mensaje de token.
  - URL + token correcto → lista real; `GET /api/novels` coincide con la del navegador.
  - Parar el servidor → "Sin conexión con el servidor" (no cae a mock).
  - Servidor con token y "Probar conexión" sin token → 401; con token → OK; servidor caído → sin red.

## Acceptance criteria

- [ ] `HttpApiClient` implementa el contrato con timeout, token y mapeo HTTP/red → `ApiError` (incluye `detail` y status).
- [ ] `createApiClient` elige mock con URL vacía y HTTP con URL configurada.
- [ ] `ApiProvider`/`useApi()` montado en el layout; Books, Detalle e Inicio consumen el cliente del contexto.
- [ ] `AppSettings.webToken` persiste y settings antiguos cargan con token vacío.
- [ ] Ajustes guarda el token y "Probar conexión" distingue OK / 401 / sin red.
- [ ] Con URL vacía la app sigue funcionando en mock sin cambios visibles.
- [ ] `tsc --noEmit` y `expo lint` en verde.
