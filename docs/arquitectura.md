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
                 # api-provider, theme, settings, server-status, covers, stats,
                 # downloads, jobs, languages, grid, novel-detail
src/components/  # action-button, screen, app-bar, tab-row, list-card, job-row,
                 # volume-row, detail-content, detail-panel, detail-sheets,
                 # detail-actions-menu, settings-group, segmented-field,
                 # novel-card, cover-image, progress-bar, empty-state;
                 # settings/ (server-form, option-sheet, language-sheet);
                 # download/ (formularios, jobs, sheet, outlined-field)
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

Cifras con `[font-variant-numeric:tabular-nums]`; el detalle usa el stack
header nativo con título fijo “Detalle” y el título de la novela vive en el
hero.

## Navegación y pantallas (0.4.0)

El chrome y los tokens son Material 3 (0.4.0-01) y las rutas ya son
Biblioteca-primero (0.4.0-02):

- **Rutas**: `/` = Biblioteca (`(tabs)/index.tsx`), `/download` = el formulario
  de descarga (antes "Inicio", re-estiliza en 03), `/settings`, detalle en
  `/novel/[slug]`. Orden de tabs: Biblioteca · Descargar · Ajustes con
  `MaterialIcons` (`local-library`, `add`, `settings`). La bottom bar usa la
  variante `uikit` en ambas plataformas: el bar vendido de Expo Router solo
  soporta `material` con rail (left); su look definitivo se revisa en 07.
- **Biblioteca (0.4.0-02)**: top app bar de 56 con buscar (toggle de
  `SearchField` con foco neutro, búsqueda diferida), filtros (sheet con
  **idiomas y orden**; el badge del icono cuenta solo idiomas) y overflow
  (`Actualizar` / `Ir a Ajustes`). Debajo, tabs de categoría con subrayado
  accent-ink: Todas/Web/PDF/Traducidas son presets de origen/traducidas. Grid
  `auto` = 2 columnas móvil / 3 tablet (≥768), overrides 2/4/8 respetados;
  card = cover 2:3 radio 8 con badge ES/PDF sobre la cubierta (idioma gana),
  título 14/20 a 2 líneas y autor 12/16; sin chips. Contador
  "N novelas · M tomos" (M = suma de EPUB original+traducido) o "X de Y"
  con búsqueda/filtros. Estados: skeleton con la forma de la card, vacío real
  → CTA "Descargar" a `/download`, sin resultados → "Limpiar búsqueda y
  filtros", 401 → "Ir a Ajustes", error de red → mensaje inline + Reintentar.
  Pull-to-refresh se mantiene.
- **Descargar (0.4.0-03)**: AppBar “Descargar” (56) + lede 14/20; segmented
  Web·PDF (40/20, accent-soft+accent-ink). Formularios en
  `components/download/`: `web-form` (URL outlined 56 con error inline, CTA
  accent, card “Opciones” con switch/idioma/avanzadas en filas 56 de
  `ListCard`), `pdf-form` (fila de archivo con quitar, título/autor outlined,
  tipo/idioma/tomo con selects outlined, traducir + idioma, CTA
  “Subir y convertir”) y `advanced-options-sheet` (tomo, concurrencia,
  4 flags; título 20/26, radio superior 24, Restablecer tonal/Listo accent).
  Jobs de la sesión en `jobs-card` (`ListCard`) con icono de estado de 28,
  estado 12/16, error en `danger`, `Cancelar` accent-ink, `Quitar` y contador
  “n/10”. El estado vive en el contenedor (`download.tsx`); `OutlinedField`
  (`download/outlined-field.tsx`) es el campo outlined compartido (TextInput
  plano: el Input de HeroUI no acepta el estilo B2 sin su capa background).
  La rehidratación de `lastJobOptions` al lanzar y el límite de 10 jobs se
  mantienen.
- **Navegación en tablet (0.4.0-06)**: con ancho ≥768 dp la barra inferior pasa
  a un **rail lateral izquierdo** de 88 dp (`tabBarVariant: material`, icono +
  label de 11/14, activo `accent-soft` + `accent-ink`, borde derecho). La
  biblioteca usa 3 columnas y el ancho útil se calcula con
  `width - rail - panel`; a partir de 1024 dp se añade un `DetailPanel` de 340
  con `DetailContent compact`, selección de card y las mismas acciones. De 768
  a 1023 no hay panel y la card abre el detalle completo. Portrait 800×1280
  mantiene rail + 3 columnas sin panel. Descargar, Ajustes y subpáginas usan
  `PAGE_CONTENT` (640); Ajustes añade `ServerForm` en panel lateral desde 1024.
  Breakpoints/anchos en `lib/layout.ts`; columnas en `lib/grid.ts`.
  `useNovelDetail` comparte estado/acciones entre la ruta y el panel.
- **Detalle (0.4.0-04)**: stack header nativo “Detalle” con back y overflow
  (`Retraducir…`, `Tamaño de tomo…`); sin botón “Más” en el cuerpo. El cuerpo
  vive en `components/detail-content.tsx` (`compact?` para el panel de tablet
  de 06): hero cover 128×192 (104×156 compacto), título 22/28 a 4 líneas y
  meta `Web|PDF · N por tomo · ES`; progreso en `ListCard` de filas 56 con
  barras de 4 px (`accent-ink` descargas, `success` traducciones); CTA
  “Sincronizar” accent de 48 (44 compacto); job de acción inline en `ListCard`
  (`JobRow`: estado, id, error, `Cancelar`), sin `Alert`, y `load()` al
  terminar. Tomos en “Tomos · N” con `Descargar todo` y filas `ListRow` de 56
  (`1–100` 16/24, `EPUB` 12/16, descarga/share al pulsar,
  check/spinner/alert); `compact` muestra tres. Loading con skeleton,
  404/error con Reintentar/Volver y sin tomos con fila informativa.
- **Idioma preferido (0.4.0-08)**: `preferredLanguage` (por defecto `es`) se
  guarda en Ajustes. Si la novela tiene original y traducción, el detalle
  muestra pastillas `Original` / `<idioma>` y solo lista la versión elegida;
  la selección inicial respeta el ajuste y cae a `Original` si no existe. Las
  pastillas son un override local (no persisten) y se ocultan con una sola
  versión. Biblioteca y Descargar no cambian.
- **Ajustes (0.4.0-05)**: hub con `AppBar` “Ajustes” y secciones
  Estado/Preferencias/Biblioteca/App en `ListCard`. Estado muestra servidor
  (Modo demo/Configurado/Conectado/Sin conexión, según `apiUrl` y
  `lastConnection`) y el conteo real de la biblioteca. Servidor abre un sheet
  con `ServerForm` (URL/token outlined 56, Probar sin guardar, Guardar
  explícito); tema y densidad abren `OptionSheet` y se aplican al instante;
  idioma preferido abre `LanguageSheet`. `ServerForm`/`OptionSheet` se
  reutilizan en el panel de tablet de 06. Estadísticas (bloque 2×2 en
  `ListCard`) y Acerca (glosario/diagnóstico en `ListCard`) mantienen su
  contenido con el chrome Material 3.

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
- **0.4.0 en curso** (Material 3, B2):
  - `01-fundamentos-material3` **completed**: tokens terracota con roles
    separados, tipografía del sistema 22/16/14/12, radios/elevación y
    componentes base (`AppBar`, `TabRow`, `ListCard`, `SegmentedField`,
    `ActionButton`, `ProgressBar`); splash `#fbf8f6`/`#121110`.
  - `02-biblioteca-navegacion` **completed**: rutas `index`=Biblioteca y
    `download`=Descargar; orden de tabs Biblioteca·Descargar·Ajustes con
    MaterialIcons; top app bar con búsqueda (diferida, foco neutro), filtro
    de idiomas (sheet) y overflow (Actualizar/Ir a Ajustes); tabs de categoría
    Todas/Web/PDF/Traducidas; grid auto 2 móvil/3 tablet con card 2:3 + badge
    ES/PDF y contadores/estados de la spec.
  - `03-descargar` **completed**: pantalla Descargar en Material 3 (AppBar,
    segmented, outlined 56, Opciones en `ListCard` y sheet; jobs en
    `ListCard` con estados/acciones); contenedor partido en
    `components/download/`.
  - Siguientes: 04 (Detalle), 05 (Ajustes-hub), 06 (tablet) y 07 (QA).
- Con `apiUrl` vacía la app funciona 100% en mock (9 novelas de ejemplo, jobs
  simulados). Con URL usa la biblioteca real.
- **Pendiente conocido**: arte propio del icono/splash (solo se cambiaron los
  fondos); "Restablecer ajustes" (spec futura); persistir filtros de Biblioteca
  entre sesiones.
- Fuera de alcance por ahora: WebSocket `/ws` (progreso fino), bandeja global
  de jobs, `expo-secure-store` para el token, descargas masivas por selección y
  limpieza de EPUB descargados.
