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

## Configuración clave

| Fichero | Nota |
|---|---|
| `metro.config.js` | `withUniwindConfig` como **wrapper más exterior** (`cssEntryFile: ./global.css`, `dtsFile: ./src/uniwind-types.d.ts`) |
| `global.css` | En la raíz: `tailwindcss` + `uniwind` + `heroui-native/styles` + `@source` + tema (light/dark anidado en `:root`) |
| `src/app/_layout.tsx` | Import de `global.css` → `GestureHandlerRootView` (flex: 1) → `HeroUINativeProvider` (imports granulares) |
| `src/app/(tabs)/_layout.tsx` | Tabs Inicio · Books · Ajustes con iconos Ionicons; colores del bar fijados con `useColorScheme` (no heredan CSS vars) |
| `app.json` | `orientation: "default"` (tablet en landscape); los cambios de config nativa requiren rebuild |
| `eslint.config.js` | Flat config con `eslint-config-expo`; ignora `node_modules/`, `android/`, `example/` |

## Estructura

```
src/app/         # rutas Expo Router (tabs + novel/[slug] + settings/statistics)
src/lib/         # types, api (MockApiClient → HttpApiClient), mock/data, settings, grid
src/components/  # novel-card, progress-bar, empty-state
assets/mock/     # covers reales para el mock
specs/0.1.0/     # specs versionadas (fuente de verdad del plan)
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
  es exactamente eso.
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
- **regla `react-hooks/set-state-in-effect`** (nueva): marca el patrón
  fetch-on-mount estándar; se desactiva puntualmente con comentario
  justificativo en los efectos de carga inicial.

## Estado actual

- Specs 0.1.0: `01-heroui-setup`, `02-arquitectura-mock`, `03-pantallas`,
  `04-ajustes-estadisticas`, `05-ui-polish` y `06-ui-polish-2` **completed** —
  v1.0.0 (mock) cerrada.
- `@gorhom/bottom-sheet` instalado (peer opcional de HeroUI, JS puro) para el
  drawer de filtros de spec 06.
- Abrir la web (`expo start --web`) queda fuera de alcance: HeroUI Native no
  está recomendada para web (spec 01).
- Pendiente v1: conectar `HttpApiClient` contra la `apiUrl` de Ajustes
  (Tailscale DNS/IP), acciones secundarias del detalle (sync/retraducir/
  tamaño de tomo) y jobbar/estados en vivo (fase 2).
