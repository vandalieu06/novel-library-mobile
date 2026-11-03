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
  en `global.css`.
- Package manager **pnpm**; dependencias se instalan con `npx expo install`
  (nunca npm/yarn/pnpm add a pelo). `pnpm-workspace.yaml` trae `allowBuilds`
  (v11) para scripts de postinstall aprobados (`unrs-resolver`).
- **Capa de datos** (`src/lib/`): `ApiClient` único con dos implementaciones.
  `MockApiClient` cuando `apiUrl` está vacía (app usable sin servidor) y
  `HttpApiClient` contra `novel-cli web` con `X-Auth-Token` opcional, timeout de
  10 s y mapeo HTTP/red → `ApiError`. `ApiProvider`/`useApi()` eligen el cliente
  y lo recrean al cambiar URL o token en Ajustes.
- **Subida de PDF** (0.3.0-05): el multipart envía `original_filename` (nombre
  real elegido), `title`/`author` opcionales y `kind` (`auto`/`book`/`webnovel`).
  El backend prioriza metadatos > título escrito > nombre original > UUID de
  caché; nunca se renombra el archivo de caché.
- **Archivos** (0.2.0): `expo-file-system` (API moderna `File`/`Directory`/
  `Paths`) guarda los EPUB en `Paths.document/epubs/<slug>/` y
  `expo-sharing` abre el share sheet. Ambos son módulos nativos → rebuild.
- **Jobs** (0.2.0): polling de `GET /api/jobs/{id}` cada 2 s (`src/lib/jobs.ts`,
  timeout 10 min, `AbortSignal`); sin WebSocket ni jobbar global.
- **Tema** (0.3.0): `src/lib/theme.tsx` (`ThemeProvider` + `useAppTheme`).
  `auto` delega en `Uniwind.setTheme("system")`; el esquema real se lee del
  fondo resuelto (`useThemeColor("background")`), no de `useColorScheme()`.

## Configuración clave

| Fichero | Nota |
|---|---|
| `metro.config.js` | `withUniwindConfig` como **wrapper más exterior** (`cssEntryFile: ./global.css`, `dtsFile: ./src/uniwind-types.d.ts`) |
| `global.css` | En la raíz: `tailwindcss` + `uniwind` + `heroui-native/styles` + `@source`, tema light/dark anidado en `:root` y escala `.t-*` |
| `src/app/_layout.tsx` | `GestureHandlerRootView` → `HeroUINativeProvider` → `ApiProvider` → `ThemeProvider` → `RootNavigator` (Stack + `StatusBar`) |
| `src/app/(tabs)/_layout.tsx` | Tabs Inicio · Biblioteca · Ajustes; tint/fondo/borde desde `useAppTheme()` |
| `src/components/screen.tsx` | SafeAreaView + scrim de la barra de estado para las pestañas |
| `src/components/action-button.tsx` | Botón único (`primary` tinta inversa, `secondary`, `ghost`, `danger`) con loading sin opacidad |
| `app.json` | `orientation: "default"`, splash claro/oscuro (`#ffffff`/`#09090b`) y adaptive icon `#09090b`; requiere rebuild |

## Estructura

```
src/app/         # rutas Expo Router (tabs + novel/[slug] + settings/statistics y about)
src/lib/         # types, api (contrato + mock), http-api-client, api-client,
                 # api-provider, theme, settings, covers, stats, downloads,
                 # jobs, languages, grid
src/components/  # action-button, screen, job-row, volume-row, settings-group,
                 # settings-row, segmented-field, novel-card, cover-image,
                 # progress-bar, empty-state
assets/mock/     # covers reales para el mock
specs/0.3.0/     # specs versionadas (fuente de verdad del plan)
docs/            # este documento (referencia viva)
```

## Color y superficies (0.3.0)

Un accent y una escala de grises; el color vive en los datos y las portadas.

| Rol | Claro | Oscuro | Ratio |
|---|---|---|---|
| `background` | `#f7f7f8` | `#09090b` | — |
| `surface` | `#ffffff` | `#121215` | 1 paso sobre el fondo |
| `surface-secondary` | `#f1f1f3` | `#1c1c20` | filas, segmented, campos |
| `border` / `separator` | `#e7e7ea` / `#efeff1` | `#27272a` / `#1f1f23` | 1.23:1 |
| `muted` | `#6b6b73` | `#a1a1aa` | 4.93:1 |
| `accent` | `#bd4048` | `#f2777e` | 5.26:1 / 6.87:1 |
| `primary` | `#18181b` | `#fafafa` | 16.97:1 |
| `focus-ring` | `#18181b` | `#fafafa` | foco neutro (≠ error) |

- **El accent no es el color de la interfaz**: acción principal en tinta
  inversa, accent para datos (progreso), chips de idioma y tab activo.
- **Radios**: controles 8, superficies 12, overlay 16. Sin botones pill.
- **Foco vs error**: foco con `android:focus:border-foreground` /
  `ios:focus:outline-foreground`; error con `--danger` + mensaje visible.
- **Superficies por tono**, no por borde: las tarjetas ya no necesitan borde.

## Tokens de espaciado (móvil)

Escala Tailwind (4px base). Regla: nada de espaciados "a ojo".

| Uso | Token | Valor |
|---|---|---|
| Gutter de página | `px-4` | 16 |
| Título de página → primer control | `pt-3` | 12 |
| Bloques hermanos de una página | `gap-6` | 24 |
| Fila densa (chips, metadatos) | `gap-2` / `gap-3` | 8 / 12 |
| Label ↔ control / intra-card | `gap-1` / `gap-1.5` | 4 / 6 |
| Grid: aire entre columnas | `gap-3` (columnWrapper) | 12 |
| Grid: aire entre filas | `pb-4` por card | 16 |
| Fin de contenido de página | `pb-12` | 48 |

## Tokens de tipografía

Clases semánticas en `global.css` (fuera de `@layer` para ganar a las
utilidades de HeroUI). No se usan `text-xl/lg/2xl` sueltos en pantallas.

| Clase | px / interlineado / peso | Uso |
|---|---|---|
| `.t-page` | 24 / 30 / 700, tracking -0.5 | título de página (uno por pantalla) |
| `.t-section` | 16 / 22 / 600 | título de sección / sheet |
| `.t-card` | 16 / 22 / 600 | título de card |
| `.t-body` | 14 / 20 / 400 | cuerpo, filas, labels de botón |
| `.t-label` | 13 / 18 / 500 | label de campo/control (gris `text-muted`) |
| `.t-meta` | 12 / 16 / 400 | caption, meta, chips |
| `.t-figure` | 24 / 28 / 600 | cifras destacadas (tabular) |

Cifras con `[font-variant-numeric:tabular-nums]`; el detalle de novela lleva el
título en el appbar nativo.

## Navegación y pantallas (0.3.0)

- **Inicio**: tarjeta de tarea (URL/archivo → primario debajo del campo),
  `Traducir` + `Opciones avanzadas` como filas; opciones en `BottomSheet`
  (tomo, stepper de concurrencia, 4 switches, restablecer). Debajo, **Trabajos
  de esta sesión** (historial en memoria, máximo 10).
- **Navegación en tablet**: con ancho ≥768 dp la barra inferior pasa a un **rail
  lateral izquierdo** de 96 dp (icono + label) con los 3 destinos centrados
  verticalmente (`paddingTop` calculado). En móvil se mantiene la barra
  inferior. Usa la copia vendored de bottom-tabs de Expo Router
  (`tabBarPosition: "left"`, `tabBarVariant: "material"`).
- **Biblioteca**: grid `auto` = 2 columnas en móvil portrait, 3 en ≥600,
  4 en ≥768 y 8 en ≥1200. El ancho de celda es fijo
  (`(ancho - 32 - 12*(columnas-1)) / columnas`): una fila incompleta no estira
  la última card y queda alineada a la izquierda. Cards sin `"/tomo"`; chips
  solo si hay traducción o PDF. Filtros componibles (origen + solo traducidas + idiomas) con chips
  removibles; sheet con `Restablecer`/`Listo`. Dos empty states distintos.
- **Detalle**: hero con cover 120×168, chips y dos barras (descargados /
  traducidos) con cifras tabulares. Una acción principal (`Sincronizar`) + menú
  (`Retraducir…`, `Tamaño de tomo…`). Tomos en dos `ListGroup` con icono de
  descarga y `Descargar todo` secuencial con contador; `Alert` para el job y
  capítulos vacíos.
- **Ajustes**: grupos Servidor / Apariencia / Biblioteca / App, una superficie
  por grupo con separadores; auto-guardado con sello "Guardado"; Estadísticas
  dentro de Biblioteca; sin jerga de desarrollo.
- **Estadísticas**: bloque 2×2 con cifra líder, origen en barra de dos
  segmentos, idiomas con conteo y `Abrir biblioteca`.
- **Acerca de**: qué hace, conectar el servidor (3 pasos), glosario,
  diagnóstico (con `Share`) y créditos.

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
  rebuild con `pnpm run android`. `expo-file-system` y `expo-sharing` (0.2.0)
  también. Cambios de splash/icon en `app.json` requieren rebuild.
- **`expo-file-system` SDK 58**: usar la API moderna (`File`, `Directory`,
  `Paths`); `FileSystem.downloadAsync/uploadAsync` están deprecados y lanzan en
  runtime. Para subir multipart: `FormData` + `File` con `expo/fetch` (fallback
  `file.createUploadTask` con `UploadType.MULTIPART`).
- **Covers con token**: `expo-image` acepta `source={{ uri, headers }}`; para
  `className` en componentes de terceros se envuelve con `withUniwind`
  (`CoverImage`). Un `<Image>` de RN no puede enviar `X-Auth-Token`.
- **Ratio de cover**: la utilidad `aspect-[2/3]` de Uniwind no calcula bien; se
  pasa `aspect={2/3}` y `CoverImage` lo aplica como `style` (`aspectRatio`).
- **Polling de jobs**: `pollJob` cada 2 s con `AbortController`; al desmontar
  hay que abortar o React avisa de setState tras unmount. Sin servidor, el mock
  resuelve `done` tras latencia simulada. El historial de Inicio es en memoria
  (no hay endpoint de jobs).
- **401**: el backend responde `detail: "token invalido"`; la app muestra
  "Token inválido. Revisa el token en Ajustes" y ofrece reintentar.
- **Uniwind `global.css`**: los overrides de tema van anidados
  `@layer theme { :root { @variant light/dark { … } } }`; FUERA de `:root` el
  parser de Uniwind los descarta silenciosamente y vuelve el tema default de
  HeroUI (azul).
- **Escala tipográfica**: `.t-*` vive **fuera** de `@layer` a propósito; dentro
  de `@layer components` las utilidades de HeroUI (p. ej. `text-base` del
  `Label`) ganan y la jerarquía desaparece.
- **`Label` de HeroUI**: su `className` aplica al contenedor, no al texto (el
  tamaño/color está en `.label__text`). Para labels de campo se usa un `<Text
  className="t-label text-muted">` dentro del `TextField`.
- **Portales de HeroUI** (`BottomSheet`, `Dialog`, `Menu`) **no heredan el
  contexto de la app** en Android: `useAppTheme()` lanza dentro de ellos. Para
  colores, usar `useThemeColor` de `heroui-native/hooks`, que sí resuelve en el
  portal (así lo hace `ActionButton`).
- **Tema auto**: `Uniwind.setTheme("system")` sigue al sistema aunque
  `useColorScheme()` de RN no emita el cambio (visto con `cmd uimode`). El
  esquema para tab bar/headers/StatusBar se deriva del fondo resuelto, no del
  hook de RN.
- **Barra de estado**: `Screen` combina `SafeAreaView` con un scrim absoluto;
  con edge-to-edge el `ScrollView` sigue pintando bajo la barra y el scrim evita
  que el texto se cruce con la hora.
- **Focus de inputs**: HeroUI usa `focus:border-accent` (rojo de marca), que se
  confundía con `isInvalid`. Se sobreescribe por plataforma con
  `android:focus:border-foreground` / `ios:focus:outline-foreground`.
- **`ActionButton`**: `loading` no usa `isDisabled` (HeroUI aplica 0.5 de
  opacidad y el texto deja de leerse); el primario es tinta inversa, nunca el
  accent.
- **Menú con descripción**: `Menu.ItemTitle` + `Menu.ItemDescription` deben ir
  envueltos en `<View className="flex-1">` y el item con `className="items-start"`;
  como hermanos directos el layout se rompe (títulos partidos en vertical).
- **Barra de tabs (expo-router)**: no hereda las CSS vars del tema; el tint y el
  fondo se fijan en `screenOptions` con `useAppTheme()`.
- **Emulador**: la resolución física real se consulta con `adb shell wm size`
  (1080×1920 aquí); el gear del dev-client flota y puede interceptar taps;
  capturas con `adb exec-out screencap -p`.
- **Metro con grafo envejecido**: tras refactor grande, el bundler en caliente
  puede mezclar módulos viejos/nuevos y fallar con errores raros (p. ej.
  "debe usarse dentro de <Provider>"). Se corrige reiniciando el bundler; si
  persiste, `--clear`.
- **BottomSheet (HeroUI)**: el padding/gap del contenido va en
  `contentContainerClassName` (no en `className`, que aplica a la superficie
  del sheet); con sizing dinámico la altura se ajusta al contenido + padding.
- **regla `react-hooks/set-state-in-effect`**: marca el patrón fetch-on-mount
  estándar; se desactiva puntualmente con comentario justificativo en los
  efectos de carga inicial.

## Estado actual

- Specs 0.1.0 y 0.2.0 **completed** (v1.0.0 mock y fase 2 API real cerradas).
- Specs 0.3.0 **completed** (`01-tokens-y-chrome`, `02-inicio-y-ajustes`,
  `03-biblioteca-detalle-stats-about`): rediseño visual/UX sobre capturas
  reales del emulador. `04-grid-columnas-impar` corrige el grid, `05`
  conserva el nombre real del PDF y permite editar título/autor/tipo, y `06`
  añade el rail lateral en tablet.
- Tokens accesibles (accent AA, primario tinta inversa, foco neutro), escala
  tipográfica `.t-*`, tema resuelto al arrancar y en caliente, StatusBar legible
  y radios 8/12/16.
- Inicio reestructurado con tarjeta de tarea, opciones en sheet y trabajos de la
  sesión; Ajustes por grupos con taxonomía corregida.
- Biblioteca en 2 columnas en móvil, filtros componibles con chips, detalle con
  `ListGroup` + `Descargar todo`, Estadísticas en una superficie y Acerca de
  para usuario.
- Con `apiUrl` vacía la app funciona 100% en mock (6 novelas, covers de assets,
  jobs simulados). Con URL usa la biblioteca real.
- **Pendiente conocido**: arte propio del icono/splash (solo se cambiaron los
  fondos); "Restablecer ajustes" (spec futura); persistir filtros de Biblioteca
  entre sesiones.
- Fuera de alcance por ahora: WebSocket `/ws` (progreso fino), bandeja global
  de jobs, `expo-secure-store` para el token, descargas masivas por selección y
  limpieza de EPUB descargados.
