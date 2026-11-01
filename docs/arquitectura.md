# Arquitectura — novel-library-mobile

Referencia técnica viva del proyecto. El plan por versión vive en `specs/` y el
estado de cada spec en su frontmatter; este documento describe lo que hay.

## Stack

- **Expo SDK 58** (expo ~58.0.22, RN 0.88.1, React 19.3, React Compiler activo) con
  Expo Router (`src/app/`) y dev client Android (`expo-dev-client`, CNG con `android/`).
- **TypeScript strict** (`tsconfig` con alias `@/* → src/*`; `example/` excluida de
  typecheck y lint por ser código de referencia del starter).
- **HeroUI Native 1.0.11** + **Uniwind 1.13.1** (Tailwind 4) como sistema de UI.
  Tema mapeado desde el design system de la web (`translate_novels/DESIGN.md`)
  en `global.css`: accent `#e0575f` / `#f2777e`, bg `#ffffff` / `#09090b`,
  radios 8px base (md 6 / lg 8).
- Package manager **pnpm**; dependencias se instalan con `npx expo install`
  (nunca npm/yarn/pnpm add a pelo). `pnpm-workspace.yaml` trae `allowBuilds`
  (v11) para scripts de postinstall aprobados (`unrs-resolver`).
- **Capa de datos** (`src/lib/`): `ApiClient` único con dos implementaciones.
  `MockApiClient` cuando `apiUrl` está vacía (app usable sin servidor) y
  `HttpApiClient` contra `novel-cli web` con `X-Auth-Token` opcional, timeout de
  10 s y mapeo HTTP/red → `ApiError`. `ApiProvider`/`useApi()` eligen el cliente
  y lo recrean al cambiar URL o token en Ajustes.
- **Archivos** (0.2.0): `expo-file-system` (API moderna `File`/`Directory`/
  `Paths`) guarda los EPUB en `Paths.document/epubs/<slug>/` y
  `expo-sharing` abre el share sheet. Ambos son módulos nativos → rebuild.
- **Jobs** (0.2.0): polling de `GET /api/jobs/{id}` cada 2 s (`src/lib/jobs.ts`,
  timeout 10 min, `AbortSignal`); sin WebSocket ni jobbar global.

## Configuración clave

| Fichero | Nota |
|---|---|
| `metro.config.js` | `withUniwindConfig` como **wrapper más exterior** (`cssEntryFile: ./global.css`, `dtsFile: ./src/uniwind-types.d.ts`) |
| `global.css` | En la raíz: `tailwindcss` + `uniwind` + `heroui-native/styles` + `@source` + tema (light/dark anidado en `:root`) |
| `src/app/_layout.tsx` | Import de `global.css` → `GestureHandlerRootView` (flex: 1) → `HeroUINativeProvider` → `ApiProvider` (settings + cliente HTTP/mock) |
| `src/app/(tabs)/_layout.tsx` | Tabs Inicio · Books · Ajustes con iconos Ionicons; colores del bar fijados con `useColorScheme` (no heredan CSS vars) |
| `app.json` | `orientation: "default"` (tablet en landscape) y plugin `expo-sharing`; los cambios de config nativa requieren rebuild |
| `eslint.config.js` | Flat config con `eslint-config-expo`; ignora `node_modules/`, `android/`, `example/` |

## Estructura

```
src/app/         # rutas Expo Router (tabs + novel/[slug] + settings/statistics)
src/lib/         # types, api (contrato + mock), http-api-client, api-client,
                 # api-provider, settings, covers, stats, downloads, jobs,
                 # languages, grid
src/components/  # novel-card, cover-image, progress-bar, empty-state
assets/mock/     # covers reales para el mock
specs/0.2.0/     # specs versionadas (fuente de verdad del plan)
docs/            # este documento (referencia viva)
```

## Tokens de espaciado (móvil)

Escala Tailwind (4px base). Regla: nada de espaciados "a ojo"; solo valores de
esta lista. Documentado al pulir la UI (spec 05).

| Uso | Token | Valor |
|---|---|---|
| Gutter de página | `px-4` | 16 |
| Título de página → primer control | `pt-3` | 12 |
| Bloques hermanos de una página | `gap-4` | 16 |
| Fila densa (chips, metadatos) | `gap-2` / `gap-3` | 8 / 12 |
| Label ↔ control / intra-card | `gap-1` / `gap-1.5` | 4 / 6 |
| Grid: aire entre columnas | `gap-3` (columnWrapper) | 12 |
| Grid: aire entre filas | `pb-4` por card | 16 |
| Fin de contenido de página | `pb-12` | 48 |

Auditoría (spec 05): Books (header `px-4`, grid `px-4` + `gap-3` + `pb-4`),
Inicio (página `gap-4`, bloque título `pt-3`, selector centrado), detalle
(appbar `px-3 py-1.5`, hero `px-4`).

## Tokens de tipografía

Escala Tailwind aplicada de forma estricta (spec 06): ningún texto supera a
los títulos de la pantalla salvo las cifras destacadas.

| Uso | Token | px |
|---|---|---|
| Título de página (o appbar nativo) | `text-2xl font-bold` | 24 |
| Sección | `text-lg font-semibold` | 18 |
| Card / hero | `text-base font-semibold` | 16 |
| Cuerpo | `text-sm` | 14 |
| Caption / meta / label / chips | `text-xs` | 12 |
| Cifras destacadas (contadores) | `text-xl font-semibold` | 20 |

El detalle de novela lleva el título en el appbar nativo (dinámico); el hero
muestra autor, chips y progreso sin texto duplicado.

## Comandos

```bash
pnpm run android         # CAMINO RECOMENDADO: prebuild + gradle + install + bundler
npx expo run:android     # alias equivalente
npx expo start           # solo bundler (Metro 8081)
npx expo install <pkg>   # dependencias: resuelve versiones compatibles con el SDK
pnpm lint                # npx expo lint
npx tsc --noEmit         # typecheck (en verde antes de cerrar cualquier tarea)
npx expo-doctor          # validación de dependencias y config
```

Deep link del dev client (usa el slug, no el scheme de `app.json`):
`exp+novel-library-mobile://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`

## Convenciones y gotchas

- **Cada spec cerrada = git commit** (cambios + fila en el changelog de la spec).
- **Módulos nativos nuevos** (`expo-document-picker`, `async-storage`…): requieren
  rebuild con `pnpm run android` — el red screen `Cannot find native module X`
  es exactamente eso. `expo-file-system` y `expo-sharing` (0.2.0) también.
- **`expo-file-system` SDK 58**: usar la API moderna (`File`, `Directory`,
  `Paths`); `FileSystem.downloadAsync/uploadAsync` están deprecados y lanzan en
  runtime. Para subir multipart: `FormData` + `File` con `expo/fetch` (fallback
  `file.createUploadTask` con `UploadType.MULTIPART`).
- **Covers con token**: `expo-image` acepta `source={{ uri, headers }}`; para
  `className` en componentes de terceros se envuelve con `withUniwind`
  (`CoverImage`). Un `<Image>` de RN no puede enviar `X-Auth-Token`.
- **Polling de jobs**: `pollJob` cada 2 s con `AbortController`; al desmontar
  hay que abortar o React avisa de setState tras unmount. Sin servidor, el mock
  resuelve `done` tras latencia simulada.
- **401**: el backend responde `detail: "token invalido"`; la app muestra
  "Token inválido. Revisa el token en Ajustes" y ofrece reintentar.
- **Uniwind `global.css`**: los overrides de tema van anidados
  `@layer theme { :root { @variant light/dark { … } } }`; FUERA de `:root` el
  parser de Uniwind los descarta silenciosamente y vuelve el tema default de
  HeroUI (azul).
- **Barra de tabs (expo-router)**: no hereda las CSS vars del tema; el tint y el
  fondo se fijan en `screenOptions` con `useColorScheme` y hex por tema.
- **Emulador**: la resolución física real se consulta con `adb shell wm size`
  (1080×1920 aquí); el gear del dev-client flota y puede interceptar taps;
  capturas con `adb exec-out screencap -p`.
- **Metro con grafo envejecido**: tras refactor grande (+ @gorhom), el bundler
  en caliente puede mezclar módulos viejos/nuevos y fallar con errores raros
  (p. ej. BottomSheet sin contexto). Se corrige reiniciando el bundler; si
  persiste, `--clear` (o borrar `$(mktemp -d %)/metro-cache`).
- **BottomSheet (HeroUI)**: el padding/gap del contenido va en
  `contentContainerClassName` (no en `className`, que aplica a la superficie
  del sheet); con sizing dinámico la altura se ajusta al contenido + padding.
- **Aspect ratio en Uniwind**: `aspect-[2/3]` no se calcula bien en esta
  versión (covers desproporcionadas); usar alturas fijas (`h-44`) para las
  covers del grid.
- **regla `react-hooks/set-state-in-effect`** (nueva): marca el patrón
  fetch-on-mount estándar; se desactiva puntualmente con comentario
  justificativo en los efectos de carga inicial.

## Estado actual

- Specs 0.1.0: `01-heroui-setup`, `02-arquitectura-mock`, `03-pantallas`,
  `04-ajustes-estadisticas`, `05-ui-polish` y `06-ui-polish-2` **completed** —
  v1.0.0 (mock) cerrada.
- Specs 0.2.0: `01-http-api-client`, `02-biblioteca-real`,
  `03-descargas-y-upload` y `04-jobs-y-acciones` **completed** — fase 2 (API
  real) cerrada.
- `AppSettings` añade `webToken`; Ajustes guarda URL y token con debounce y
  "Probar conexión" distingue OK / 401 / sin red con `HttpApiClient`.
- Con `apiUrl` vacía la app funciona 100% en mock (6 novelas, covers de assets,
  jobs simulados). Con URL usa la biblioteca real: covers autenticadas, datos,
  estadísticas, descargas con share sheet y subida de PDF.
- Inicio muestra el job en una tarjeta inline (estado/error/cancelar) y el
  detalle ofrece sync (con diálogo), retraducir (sheet de idioma) y tamaño de
  tomo (síncrono, 50/100/150/200/Todos). Books se refresca al recuperar foco.
- `@gorhom/bottom-sheet` instalado (peer opcional de HeroUI, JS puro) para los
  drawers/sheets de filtros y acciones.
- `AppSettings.lastJobOptions` (spec 07) persiste la configuración del último
  job lanzado (idioma, tomo, concurrencia, checkboxes); Inicio la rehidrata
  al montar y la vuelve a guardar tras cada submit exitoso.
- Abrir la web (`expo start --web`) queda fuera de alcance: HeroUI Native no
  está recomendada para web (spec 01).
- Fuera de alcance por ahora: WebSocket `/ws` (progreso fino), bandeja global
  de jobs, `expo-secure-store` para el token, descargas masivas y limpieza de
  EPUB descargados.
