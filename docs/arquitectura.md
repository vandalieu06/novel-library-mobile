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
- **regla `react-hooks/set-state-in-effect`** (nueva): marca el patrón
  fetch-on-mount estándar; se desactiva puntualmente con comentario
  justificativo en los efectos de carga inicial.

## Estado actual

- Specs 0.1.0: `01-heroui-setup`, `02-arquitectura-mock` y `03-pantallas`
  **completed**; `04-ajustes-estadisticas` **approved**.
- Abrir la web (`expo start --web`) queda fuera de alcance: HeroUI Native no
  está recomendada para web (spec 01).
- Pendiente v1: conectar `HttpApiClient` contra la `apiUrl` de Ajustes
  (Tailscale DNS/IP), acciones secundarias del detalle (sync/retraducir/
  tamaño de tomo) y jobbar/estados en vivo (fase 2).
