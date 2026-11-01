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
  en `global.css` (`@layer theme` con `@variant light/dark`): accent `#e0575f` /
  `#f2777e`, bg `#ffffff` / `#09090b`, radios `radius: 8px` (md 6 / lg 8).
- Package manager **pnpm**; dependencias se instalan con `npx expo install`
  (nunca npm/yarn/pnpm Add a pelo). `pnpm-workspace.yaml` trae `allowBuilds`
  (v11) para scripts de postinstall aprobados (`unrs-resolver`).

## Configuración clave

| Fichero | Nota |
|---|---|
| `metro.config.js` | `withUniwindConfig` como **wrapper más exterior** (`cssEntryFile: ./global.css`, `dtsFile: ./src/uniwind-types.d.ts`) |
| `global.css` | En la raíz: `tailwindcss` + `uniwind` + `heroui-native/styles` + `@source` + tema (light/dark) |
| `src/app/_layout.tsx` | `Global.css` import → `GestureHandlerRootView` (flex: 1) → `HeroUINativeProvider` (de `heroui-native/provider`, import granular) |
| `app.json` | `orientation: "default"` (tablet en landscape); cualquier cambio de config nativa requiere `npx expo prebuild -p android` + rebuild |
| `eslint.config.js` | Flat config con `eslint-config-expo`; ignora `node_modules/`, `android/`, `example/` |

## Estructura

```
src/app/         # rutas Expo Router (tabs Inicio · Books · Ajustes + novel/[slug] + statistics)
src/lib/         # lógica: types, api (MockApiClient → HttpApiClient), mock/data, settings, grid
src/components/  # componentes compartidos (spec 03+)
assets/mock/     # covers reales para el mock
specs/0.1.0/     # specs versionadas (fuente de verdad del plan)
docs/            # este documento (referencia viva)
```

## Comandos

```bash
npx expo install <pkg>   # SOLO herramienta de dependencias (resuelve versiones SDK)
npx expo start           # dev server (Metro en 8081; adb reverse tcp:8081 tcp:8081 en emulador)
npx expo run:android     # prebuild + gradle + install (o manual: npx expo prebuild -p android && cd android && ./gradlew installDebug)
pnpm lint                # npx expo lint
npx tsc --noEmit         # typecheck (debe estar en verde antes de cerrar cualquier tarea)
npx expo-doctor          # validación de dependencias y config
```

Deep link del dev client (slug, no el scheme de app.json):
`exp+novel-library-mobile://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`

## Estado actual

- Specs 0.1.0: `01-heroui-setup` **completed**; `02-arquitectura-mock`, `03-pantallas`
  y `04-ajustes-estadisticas` **approved**.
- Pendiente conocido: `src/uniwind-types.d.ts` (autocompletado exacto de clases de
  Uniwind) no se autogenera; `npx tsc --noEmit` pasa igualmente. Se vigila en
  siguientes installed de Metro.
- Abrir la web (`expo start --web`) queda fuera de alcance: HeroUI Native no está
  recomendada para web (spec 01).
