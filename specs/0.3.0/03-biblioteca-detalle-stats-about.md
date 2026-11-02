---
code: "03"
title: "Biblioteca, detalle, estadísticas y acerca: cards limpias, listas agrupadas y contenido de usuario"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-02
tags: [spec, sdd, ui, biblioteca, detalle, estadisticas]
affected_files:
  - src/app/(tabs)/books.tsx
  - src/app/(tabs)/_layout.tsx
  - src/app/novel/[slug].tsx
  - src/app/settings/statistics.tsx
  - src/app/settings/about.tsx
  - src/components/novel-card.tsx
  - src/components/volume-row.tsx
  - src/lib/grid.ts
  - docs/arquitectura.md
---

# 03 — Biblioteca, detalle, estadísticas y acerca

## Purpose

Cerrar la revisión visual en las pantallas de contenido: quitar ruido de las
cards, convertir el detalle en dos listas agrupadas con una acción principal
clara, hacer que Estadísticas responda "cómo va mi biblioteca" en una sola
superficie y reescribir "Acerca de" para un usuario (hoy es documentación
interna).

Depende de `01-tokens-y-chrome` y reutiliza lo que introduce `02-inicio-y-ajustes`.

## Context

- **Biblioteca**: el meta de las cards se trunca ("Novel Phoenix · 100…")
  porque `"/tomo"` se repite en todas y empuja al autor fuera. Título a 2
  líneas truncado ("My Step-Daughter…") con cards de ~118 dp. El botón Filtros
  usa texto accent sobre gris (3.35:1) y mide 36. La pestaña dice "Books" en
  una app en español.
- **Filtros**: dos switches ("Solo traducidas", "Solo con origen PDF") que
  parecen independientes pero se excluyen entre sí (`setFilter` reemplaza el
  valor): la UI miente. No hay "Restablecer".
- **Detalle**: 22 filas bordeadas una por una, cada una con la palabra
  "Descargar" repetida; es el 80 % del scroll. Dos barras de progreso en dos
  colores sin leyenda y cifras en línea. Tres acciones con el mismo peso y
  ninguna principal. El aviso de capítulos vacíos usa un borde `border-warning`
  en vez de `Alert`.
- **Estadísticas**: 6 tarjetas bordeadas + 60 % de pantalla vacía; "EPUBs
  originales + traducidos + totales" cuenta lo mismo tres veces; "(ES)" está
  hardcodeado aunque hay 10 idiomas; origem e idiomas son chips sueltos.
- **Acerca de**: "mock en fase 1", "fase 2", `specs/0.1.0/`,
  `docs/arquitectura.md` y "flujo SDD" son documentación de desarrollo. Un
  usuario no tiene nada que hacer ahí; la página está 70 % vacía.

## Proposed change

### A. Biblioteca (`src/app/(tabs)/books.tsx`, `novel-card.tsx`, `grid.ts`)

1. **Pestaña**: `title: "Biblioteca"` en `(tabs)/_layout.tsx` (icono igual).
2. **Card** (`novel-card.tsx`): cover, título 2 líneas y **solo autor** en
   `.t-meta`. Se elimina `volume_size` del grid (es dato de detalle). Chips:
   solo cuando aportan — `ES` si hay traducción, `PDF` si el origen es archivo;
   una novela web sin traducir no lleva chip. Sin barra de progreso (ya estaba
   fuera por spec 06).
3. **Grid**: `resolveGridColumns` con `auto` = **2 columnas** en móvil portrait
   (< 600 dp), 3 en ≥ 600, 4 en ≥ 768 y 8 en ≥ 1200 (landscape/tablet). A 393
   dp, 2 columnas dan cover de ~180 dp: el título cabe sin truncar y la cover
   se lee. Los overrides manuales 2/4/8 no cambian.
4. **Cabecera**: una sola línea de meta que resuma el estado:
   `6 novelas` o `2 de 6 novelas · 2 filtros`, con `Limpiar` (texto) cuando hay
   filtros activos. Buscador y `Filtros` a 44 de alto; el botón usa
   `tone="secondary"` con el contador como `Chip` pequeño, no texto accent.
5. **Filtros como chips removibles**: cuando hay filtros, bajo la cabecera se
   pinta un `TagGroup` con un chip por filtro (`PDF`, `Traducidas`, `ES`) y
   botón de quitar. El badge del botón sigue contando.
6. **Modelo de filtros** (honesto y componible):
   ```ts
   type OriginFilter = "all" | "web" | "pdf";
   interface LibraryFilters {
     origin: OriginFilter;
     translatedOnly: boolean;
     languages: string[]; // códigos, vacío = todos
   }
   ```
   `origin` usa un segmented (Todas / Web / PDF); `translatedOnly` es un switch
   independiente; `languages` se elige con un `TagGroup` de los idiomas
   presentes en la biblioteca (selección múltiple). Se acaba el par de switches
   excluyentes.
7. **Sheet de filtros**: bloques `Origen`, `Traducción` (switch + idiomas) y
   `Orden` (Recientes / Título), con `Restablecer` (ghost) y `Listo` (primary)
   al pie. Sigue aplicando en vivo.
8. **Estados**: distinguir biblioteca vacía (`Tu biblioteca está vacía` +
   `Ir a Inicio`) de búsqueda sin resultados (`Sin resultados` + `Limpiar
   filtros`). Skeleton con las columnas y la altura reales de la card.

### B. Detalle (`src/app/novel/[slug].tsx`, nuevo `volume-row.tsx`)

1. **Hero**: cover 120×168, autor `.t-body text-muted`, chips de origen/idioma
   y **dos filas de progreso** con etiqueta, cifra tabular alineada a la derecha
   y barra de 4 px:
   `Descargados  1.100 / 1.100` · `Traducidos  1.000 / 1.100` (barra success).
   Se elimina el hueco muerto bajo los chips.
2. **Acciones**: una principal `Sincronizar` (`ActionButton primary`) y
   `Más` (`secondary`) que abre un `Menu` con `Retraducir…` y
   `Tamaño de tomo…`. Se mantienen los sheets/dialog existentes, abiertos desde
   el menú. Ya no hay tres botones del mismo peso.
3. **Trabajo en curso**: la tarjeta inline pasa a `Alert` (`status="accent"`)
   con spinner, estado y `Cancelar`; error en `status="danger"` con el mensaje.
4. **Capítulos vacíos**: `Alert status="warning"` con el listado (mismo texto,
   componente correcto).
5. **EPUBs**: dos `ListGroup` (`Original`, `Traducidos (ES)`) en lugar de 22
   tarjetas:
   - Cabecera de sección `.t-section` + contador ("11 tomos") + `Descargar
     todo` (ghost, 44).
   - Fila (`src/components/volume-row.tsx`): icono, título "1–100"
     (`.t-body`), descripción `.t-meta` ("cap. 1–100 · EPUB"), sufijo con botón
     de descarga de 44 (icono `download-outline`; spinner mientras baja;
     `checkmark` al terminar; `alert-circle` en error con el mensaje como
     descripción). Toda la fila es pulsable para descargar.
   - `Descargar todo`: descarga secuencial de la lista visible con contador
     "3/11" en la cabecera; si una falla, se detiene y muestra toast. `Cancelar`
     no aplica (las descargas no tienen señal de abort hoy).
   - Lista vacía: una frase dentro del `ListGroup` ("Aún no hay tomos
     generados.") en vez de un bloque vacío.
6. **Sin "Descargar" repetido**: la palabra solo existe en `Descargar todo` y
   como `accessibilityLabel` de cada icono.

### C. Estadísticas (`src/app/settings/statistics.tsx`)

La pantalla responde **"¿cómo va mi biblioteca?"** con una cifra líder y un
desglose, no con seis cajas:

1. **Bloque principal** (una `Surface` radius 12 dividida por hairlines, 2×2):
   - Líder: `2.996` capítulos descargados (`.t-figure`) con sublínea
     "de 2.996" / "100 %".
   - `2.889` capítulos traducidos + "96 %" (barra fina success).
   - `6` novelas · `66` EPUBs (34 originales · 32 traducidos) como celdas de
     apoyo, sin repetir el total tres veces.
2. **Por origen**: barra de 2 segmentos (Web 5 / PDF 1) con leyenda de puntos,
   no dos chips sueltos.
3. **Idiomas**: `TagGroup` con código + número de novelas (`ES 6`), calculado
   de los datos. Se elimina "(ES)" hardcodeado de las etiquetas.
4. **Cierre**: `Abrir biblioteca` (`ActionButton secondary`) que vuelve a la
   pestaña; nota de fuente en una línea `.t-meta` (servidor o mock).
5. Skeleton y error se mantienen; el skeleton usa la forma del bloque 2×2.

### D. Acerca de (`src/app/settings/about.tsx`)

Reescritura completa para usuario; se elimina toda mención a specs, `docs/`,
SDD, "mock" y "fase 1/2".

1. **Qué hace**: un párrafo (cliente nativo de la biblioteca, pensado para
   conectarse por Tailscale sin abrir el navegador).
2. **Conectar el servidor**: 3 pasos numerados (URL de Tailscale → token si el
   servidor lo pide → `Probar conexión`) + `Ir a Servidor` que navega a la
   pestaña Ajustes.
3. **Glosario** (`ListGroup`): `Tomo` (bloque de capítulos por EPUB), `EPUB`
   (formato de lectura), `Traducción` (versión en otro idioma).
4. **Diagnóstico**: versión, servidor configurado (sí/no) y resultado de la
   última prueba; `Compartir diagnóstico` con `Share` de React Native
   (sin dependencias nuevas). No se muestran URLs con token.
5. **Créditos**: stack (Expo SDK 58, HeroUI Native, Uniwind) + licencia del
   proyecto (`LICENSE`). Sin URLs inventadas.

## Technical decision

- `resolveGridColumns` cambia solo la rama `auto`; se documenta el nuevo
  breakpoint (600 dp) en `docs/arquitectura.md` y se actualiza el comentario de
  la spec 06 (que fijaba 3 en móvil) en el changelog de 0.3.0.
- `ListGroup` es el contenedor correcto para las filas de tomos: ya aporta
  `Surface` + separadores y evita 22 bordes. Su `ItemSuffix` acepta children,
  así que el icono de descarga va ahí.
- `Alert` cubre el aviso de capítulos vacíos y el estado del job.
- `Menu` (HeroUI) sustituye los tres botones del detalle; `presentation`
  `"popover"` por defecto.
- La descarga masiva es secuencial y sin paralelismo para no saturar la red y
  porque `downloadEpub` no expone progreso; el contador refleja el avance real.
- Filtros: sin persistencia en `AppSettings` (son efímeros por sesión); si se
  pide recordarlos, se añade en 0.3.1.
- Sin dependencias nuevas y sin rebuild.

## Affected files

`src/app/(tabs)/books.tsx`, `src/app/(tabs)/_layout.tsx`,
`src/app/novel/[slug].tsx`, `src/app/settings/statistics.tsx`,
`src/app/settings/about.tsx`, `src/components/novel-card.tsx`,
`src/components/volume-row.tsx` (nuevo), `src/lib/grid.ts`.
`docs/arquitectura.md` al cerrar.

## Tests

- `tsc` + `lint`.
- Visual claro/oscuro en 390 dp y tablet:
  - Biblioteca en 2 columnas: títulos y autores completos sin "…" en el meta;
    chips solo cuando aportan; "Biblioteca" en la tab.
  - Filtros: combinar PDF + traducidas + idioma; chips removibles; contador
    correcto; `Restablecer` vuelve a todo.
  - Biblioteca vacía vs sin resultados (dos estados distintos).
  - Detalle: 11 tomos originales + 11 traducidos en dos `ListGroup`; descargar
    uno, estado check; `Descargar todo` con contador; menú con Retraducir y
    Tomos.
  - Detalle: barra de progreso con cifras tabulares alineadas; alerta de
    capítulos vacíos.
  - Estadísticas: una superficie 2×2; origen en barra; idiomas con conteo;
    `Abrir biblioteca` navega.
  - Acerca de: sin menciones a specs/docs/SDD; pasos de conexión; compartir
    diagnóstico abre el share sheet.

## Acceptance criteria

- [ ] La card muestra cover + título + autor, sin `"/tomo"`; no queda ningún
      meta truncado en las 6 novelas del mock.
- [ ] `auto` = 2 columnas en móvil portrait y el título de 2 líneas no se
      trunca en las cards del mock.
- [ ] Los filtros son componibles (origen + traducidas + idioma) y se ven como
      chips removibles; no hay dos switches excluyentes.
- [ ] El detalle no repite "Descargar" en cada fila; usa dos `ListGroup`, iconos
      de 44 y `Descargar todo` con contador.
- [ ] Una sola acción principal en el detalle (Sincronizar) y el resto en
      `Menu`.
- [ ] Estadísticas muestra una cifra líder y un desglose en una superficie, sin
      la triple contabilidad de EPUBs ni "(ES)" hardcodeado.
- [ ] "Acerca de" no contiene referencias a specs, docs, SDD ni mock; ofrece
      pasos de conexión, glosario, diagnóstico y créditos.
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Implementación (2026-11-03)

- **Ajustes al plan**
  - Las cards reservan 2 líneas de título (`min-h-11`) para que autor y chips
    queden alineados entre columnas.
  - Los filtros se aplican en vivo y el estado sobrevive al cambio de pestaña
    dentro de la sesión (no se persiste en `AppSettings`).
  - `VolumeRow` usa el título como única línea y solo muestra descripción en
    error: se quitó "EPUB original" repetido en las 11 filas.
  - `Menu` requiere `items-start` + contenedor `flex-1` para título y
    descripción; sin él los títulos se parten en vertical.
  - Estadísticas muestra la cifra líder + desglose 2×2; no se inventó un
    "último test de conexión" (no existe en el modelo de datos).
  - Acerca de: diagnóstico con versión, servidor configurado y origen de datos
    (sin exponer URL ni token) + `Share` nativo.
- Verificado: grid 2 cols, chips/empty states, descarga individual y masiva con
  contador, menú, estadísticas y about en claro/oscuro.
