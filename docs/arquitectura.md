# Arquitectura — novel-library-mobile

Referencia técnica viva del proyecto. El plan por versión vive en `specs/` y el
estado de cada spec en su frontmatter; este documento describe lo que hay.

## Stack

- **Expo SDK 58** (expo ~58.0.22, RN 0.88.1, React 19.3, React Compiler activo) con
  Expo Router (`src/app/`) y dev client Android (`expo-dev-client`, CNG con `android/`).
- **TypeScript strict** (`tsconfig` con alias `@/* → src/*`; `example/` excluida de
  typecheck y lint por ser código de referencia del starter).
- **HeroUI Native 1.0.11** + **Uniwind 1.13.1** (Tailwind 4) como sistema de UI.
  Tema Material 3 del rediseño B2 (`prototypes/design-directions/`) en
  `global.css`.
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
| `global.css` | En la raíz: `tailwindcss` + `uniwind` + `heroui-native/styles` + `@source`, tema light/dark anidado en `:root`, mapa de colores propios en `@theme` y escala `.t-*` |
| `src/app/_layout.tsx` | `GestureHandlerRootView` → `HeroUINativeProvider` → `ApiProvider` → `ThemeProvider` → `RootNavigator` (Stack + `StatusBar`; header nativo leído de los tokens) |
| `src/app/(tabs)/_layout.tsx` | Tabs Inicio · Biblioteca · Ajustes; Diseñar tab bar Material 3 en la 0.4.0-02. En la 0.4.0-01 ya lee tint/fondo/borde de los tokens |
| `src/components/screen.tsx` | SafeAreaView + scrim de la barra de estado para las pestañas |
| `src/components/action-button.tsx` | Botón único Material 3 (`primary` accent + blanco, `secondary` tonal, `ghost`, `danger`) con loading sin opacidad |
| `src/components/app-bar.tsx` | Top app bar Material 3 de 56 con acciones de 40×40 (nuevo en 0.4.0-01) |
| `src/components/tab-row.tsx` | Tabs de categoría de 48 con subrayado accent-ink (nuevo en 0.4.0-01) |
| `src/components/list-card.tsx` | `ListCard` radio 16 + `ListRow` 56 + `StatusDot` con separadores inset 16 (nuevo en 0.4.0-01) |
| `app.json` | `orientation: "default"`, splash claro/oscuro (`#fbf8f6`/`#121110`) y adaptive icon `#121110`; requiere rebuild |

## Estructura

```
src/app/         # rutas Expo Router (tabs + novel/[slug] + settings/statistics y about)
src/lib/         # types, api (contrato + mock), http-api-client, api-client,
                 # api-provider, theme, settings, covers, stats, downloads,
                 # jobs, languages, grid
src/components/  # action-button, screen, app-bar, tab-row, list-card, job-row,
                 # volume-row, settings-group, settings-row, segmented-field,
                 # novel-card, cover-image, progress-bar, empty-state
assets/mock/     # covers reales para el mock
specs/0.3.0/     # specs versionadas (fuente de verdad del plan)
docs/            # este documento (referencia viva)
```

## Color y superficies (0.4.0)

Material 3 del prototipo B2: superficies neutras cálidas y accent terracota con
dos roles separados. Una sola elevación: borde de 1 px, sin sombras salvo el
sheet.

| Rol | Claro | Oscuro | Ratio objetivo |
|---|---|---|---|
| `background` | `#fbf8f6` | `#121110` | — |
| `surface` | `#ffffff` | `#1d1b1a` | +1 paso |
| `surface-secondary` | `#f2ece8` | `#262320` | filas, campos |
| `surface-tertiary` | `#e8e0db` | `#322e2b` | track de progreso, placeholder |
| `outline` (`border`/`separator`) | `#d8cfc9` | `#6b625c` | 3.2:1 en oscuro |
| `muted` / `muted-2` | `#6b6561` / `#8a8480` | `#b0a8a3` / `#8a8480` | 5.0:1 / 8.4:1 |
| `accent` (relleno) | `#a8433c` | `#b84a42` | blanco encima 5.9:1 / 5.1:1 |
| `accent-ink` (texto/estado) | `#a8433c` | `#f0a9a2` | sobre fondo 9.8:1 en oscuro |
| `accent-soft` | `#f7e7e3` | `#3a2421` | tonal (segmented, botón secundario) |
| `primary` / `primary-foreground` | accent / `#ffffff` | accent / `#ffffff` | Material filled |
| `focus-ring` | `#1d1b1a` | `#ede8e4` | foco neutro (≠ error) |
| `success` | `#356b47` | `#8fbf9d` | conectado, traducido |
| `danger` (+ `danger-foreground`) | `#b3372f` / `#ffffff` | `#e5736a` / `#121110` | tanto texto como relleno AA |

- **Relleno nunca es texto**: `--accent` para CTA, badge y switch; `--accent-ink`
  para tabs, enlaces, nav activa y progreso.
- Los colores que HeroUI no mapea (o mapea como mix) se registran en un bloque
  `@theme { --color-*: var(--*) }`: `accent-ink`, `accent-soft`, 
  `accent-soft-foreground` (= accent-ink) y `muted-2`.
- **Radios**: portadas 8, campos 12 (`--radius`), cards 16, botones 24
  (pill 48), sheets 24. Sin sombras salvo el sheet.
- **Foco vs error**: foco neutro (`--focus-ring`); error con `--danger` +
  mensaje visible. El danger en oscuro usa texto oscuro encima (tono claro).

## Branding (0.3.0-08)

- **Emblema**: gato crema con ojos cerrados leyendo un libro crimson sobre
  fondo tinta `#09090b`. Fuente vectorial: `assets/branding/emblem.svg`.
- **Paleta**: tinta `#18181b`, crema `#f4ead7`, crimson `#bd4048`. Contorno de
  tinta para que funcione sobre claro y oscuro.
- **Derivados** (`assets/images/`): `icon.png` 1024 sin alfa, adaptive
  foreground 512 transparente (arte al 64 %), monocromo 432 (silueta desde el
  alfa), splash 512 transparente y favicon 48.
- iOS usa el PNG 1024 (`ios.icon`); Android adaptive con
  `backgroundColor: "#09090b"` + foreground + monochrome (sin backgroundImage).
- Cambiar iconos/splash requiere **prebuild + rebuild** (`make android` o
  `make android-release`); el dev client no lo coge en caliente.

## Ancho de contenido en tablet (0.3.0-07)

- Inicio, Ajustes, Estadísticas y Acerca de: `PAGE_CONTENT`
  (`w-full max-w-[600px] self-center`).
- Detalle de novela: `WIDE_CONTENT` (`w-full max-w-[760px] self-center`).
- Biblioteca se mantiene a ancho completo (grid).
- Constantes en `src/lib/layout.ts`. No usar `max-w-2xl`: en Uniwind resuelve
  a ~500 dp por su base de `rem`; los px explícitos son predecibles.

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

## Tokens de tipografía (0.4.0)

Tipografía del sistema (Roboto en Android, SF Pro en iOS): sin fuente propia.
Clases semánticas en `global.css` (fuera de `@layer` para ganar a las
utilidades de HeroUI). No se usan `text-xl/lg/2xl` sueltos en pantallas.

| Clase | px / interlineado / peso | Uso |
|---|---|---|
| `.t-page` | 22 / 28 / 500 | título de top app bar y detalle |
| `.t-section` | 16 / 24 / 500 | títulos de sección |
| `.t-card` | 14 / 20 / 500 | título de card/novela |
| `.t-body` | 16 / 24 / 400 | cuerpo |
| `.t-label` | 14 / 20 / 500 | labels y acciones |
| `.t-meta` | 12 / 16 / 400 | metadatos y ayudas |
| `.t-figure` | 22 / 28 / 600 | cifras destacadas (tabular) |

Cifras con `[font-variant-numeric:tabular-nums]`; el detalle de novela lleva el
título en el appbar nativo.

## Navegación y pantallas (0.3.0)

Las pantallas de Inicio/Biblioteca/Detalle conservan su estructura de la 0.3.0;
la 0.4.0 las re-estiliza en orden (02–06). El chrome y los tokens ya son
Material 3 (0.4.0-01): t-page 22/28, accent terracota y una tab bar que lee sus
colores de los tokens.

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

- Specs 0.1.0 y 0.2.0 **completed**; 0.3.0 **completed** (tokens/accesibilidad,
  reorganización de pantallas y emblema). Esas notas describen la base sobre la
  que trabaja la 0.4.0.
- **0.4.0 en curso** (Material 3, B2): `01-fundamentos-material3` implementa
  tokens claro/oscuro terracota con roles separados (accent relleno vs
  accent-ink texto), tipografía del sistema 22/16/14/12, radios 8/12/16/24/24,
  elevación única de borde y componentes base (`AppBar`, `TabRow`, `ListCard`/
  `ListRow`/`StatusDot`, `SegmentedField`, `ActionButton`, `ProgressBar`).
  Splash claro `#fbf8f6` / oscuro `#121110` y adaptive background `#121110`
  (requiere prebuild + rebuild). 02–06 reestructuran pantallas sobre esta base.
- Con `apiUrl` vacía la app funciona 100% en mock (6 novelas, covers de assets,
  jobs simulados). Con URL usa la biblioteca real.
- **Pendiente conocido**: arte propio del icono/splash (solo se cambiaron los
  fondos); "Restablecer ajustes" (spec futura); persistir filtros de Biblioteca
  entre sesiones.
- Fuera de alcance por ahora: WebSocket `/ws` (progreso fino), bandeja global
  de jobs, `expo-secure-store` para el token, descargas masivas por selección y
  limpieza de EPUB descargados.
