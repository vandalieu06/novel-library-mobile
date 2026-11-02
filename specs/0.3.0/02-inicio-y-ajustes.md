---
code: "02"
title: "Inicio y Ajustes: tarjeta de tarea, trabajos de la sesión y ajustes agrupados"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-02
tags: [spec, sdd, ui, ux, inicio, ajustes]
affected_files:
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/settings.tsx
  - src/components/settings-group.tsx
  - src/components/settings-row.tsx
  - src/components/segmented-field.tsx
  - src/components/job-row.tsx
  - src/lib/settings.ts
  - docs/arquitectura.md
---

# 02 — Inicio y Ajustes

## Purpose

Reestructurar las dos pantallas que hoy se sienten desordenadas: Inicio pasa de
un formulario a pantalla completa con 60 % de vacío a una **tarjeta de tarea**
con su cola de trabajos; Ajustes pasa de cuatro tarjetas idénticas con dos
lenguajes de formulario a **grupos con filas**, con la taxonomía corregida y
textos de usuario.

Depende de `01-tokens-y-chrome` (tokens, `.t-*`, `Screen`, `ActionButton`,
tema resuelto).

## Context

Capturas actuales y su lectura:

- **Inicio**: 4 controles ocupan la pantalla; bajo el botón queda un vacío de
  ~55-60 %. El 90 % del peso visual son cajas del mismo tamaño. Con el teclado
  abierto el botón "Lanzar descarga" queda tapado. "Opciones avanzadas" anida
  una segunda superficie y sus checkboxes (~44 px) pesan más que el campo
  principal. Copy interno: "Concurrencia descarga", "Forzar Playwright".
  Título + subtítulo de 2 líneas + tabs repiten "descarga" tres veces.
- **Ajustes**: cuatro tarjetas bordeadas. "URL del backend" es un label grande
  negro y "Tema"/"Densidad del grid" son captions de 12 grises: misma función,
  dos estilos. Los segmentados van centrados y con anchos distintos mientras
  los captions van a la izquierda. "Probar conexión" se lee como destructivo
  (texto accent sobre gris). "Estadísticas" vive dentro de "Info de la app"
  (taxonomía incorrecta) y comparte grupo con "Versión" (que no navega).
  "Expo 58 · HeroUI Native + Uniwind" es jerga de desarrollo en una pantalla de
  usuario. La página no tiene cierre: termina en la lista.

## Proposed change

### A. Inicio (`src/app/(tabs)/index.tsx`)

**Orden de bloques (una sola columna, un solo eje izquierdo):**

1. Título `Nueva descarga` (`.t-page`) + una línea `.t-body text-muted`
   ("Pega una URL o sube un PDF") — máximo una línea, sin repetir "el estado
   del job se sigue aquí".
2. Segmented `Desde web | Desde PDF` **a todo el ancho** (44 de alto), en el
   mismo eje que el resto. Ya no va centrado.
3. **Tarjeta de tarea** (`Surface` radius 12, `p-4`, `gap-4`):
   - Web: label `URL de la novela` (`.t-label`), `Input`, `FieldError` inline
     cuando hay texto inválido, y **`ActionButton tone="primary"` justo debajo
     del campo** ("Lanzar descarga"). El botón queda visible con el teclado
     abierto; `keyboardDismissMode="on-drag"` + `KeyboardAvoidingView`
     (`behavior="padding"` en iOS).
   - PDF: fila de selección de archivo (icono + "Elegir archivo PDF", alto 56) o
     fila del archivo elegido (nombre, tamaño, botón X). Caption de una línea
     ("Webnovel o light novel con ilustraciones"). Campos en dos columnas
     (`Idioma del PDF`, `Capítulos por tomo`). Switch `Traducir` + idioma si
     aplica. `ActionButton` primario debajo.
   - Bajo el primario, separados por `Separator`, dos **filas de control** de
     44 px: `Traducir` (switch) y `Opciones avanzadas · N` (chevron; abre
     `BottomSheet`). Si `Traducir` está activo, aparece una fila `Idioma` con el
     `Select` dentro de la misma tarjeta.
4. **Trabajos de esta sesión** (llena el vacío con contenido real, no relleno):
   - Se sustituye `activeJob` por `jobs: JobRow[]` en memoria (máx. 10, más
     reciente primero). El job activo se sigue con el `pollJob` actual; los
     terminados quedan como historial de la sesión.
   - Fila (`src/components/job-row.tsx`): icono de estado, `Origen · estado`
     (`.t-body`), `job <id>` (`.t-meta`), acción `Cancelar` (ghost, solo si
     sigue activo) y X para descartar. Alto mínimo 56.
   - Vacío: una sola frase `.t-meta` dentro del bloque ("Los trabajos de esta
     sesión aparecen aquí; se borran al cerrar la app."). Sin ilustración.
   - El bloque solo se pinta si hay trabajo activo o historial; si no, se
     muestra el estado vacío anterior para que la pantalla no quede en blanco.

**Opciones avanzadas → `BottomSheet`** (mismo patrón que Filtros):

| Control | Sustituye | Detalle |
|---|---|---|
| `Capítulos por tomo` | Select en accordion | `Select` 50/100/150/200 |
| `Descargas simultáneas` | Input numérico libre | stepper `− / 4 / +`, rango 1–8 |
| `Todos los capítulos` | Checkbox 44 | `Switch` + caption |
| `Volver a descargar lo existente` | "Forzar re-descarga" | `Switch` + caption |
| `Traducir solo lo pendiente` | "Traducir pendientes" | `Switch` + caption |
| `Modo navegador (Playwright)` | "Forzar Playwright" | `Switch` + caption "Úsalo si la web bloquea la descarga normal." |

Pie del sheet: `Restablecer` (ghost) y `Listo` (primary) que cierra. Los
cambios siguen aplicándose al instante; no hay "Aplicar".

**Copy:** "Concurrencia descarga" → "Descargas simultáneas"; "Forzar
re-descarga" → "Volver a descargar lo existente"; "Forzar Playwright" → "Modo
navegador (Playwright)". Se mantiene el texto de ayuda del PDF en una línea.

### B. Ajustes (`src/app/(tabs)/settings.tsx`)

**Estructura por grupos**, cada uno con su label fuera (`.t-label text-muted`)
y las filas dentro de **una sola** superficie dividida por `Separator`:

| Grupo | Filas |
|---|---|
| Servidor | URL del backend · Token (opcional) · `Probar conexión` + estado |
| Apariencia | Tema (Auto / Claro / Oscuro) |
| Biblioteca | Densidad del grid (+ preview) · `Estadísticas` → |
| App | `Acerca de / Ayuda` → · Versión `1.0.0` |

- **Servidor**: `Surface` radius 12 con los dos campos (label `.t-label`,
  caption `.t-meta` de una línea como máximo). `Probar conexión` es
  `ActionButton tone="secondary"` con icono, 44 de alto, junto al estado
  (`● Conexión correcta` en success / `● <mensaje>` en danger). "Guardado" deja
  de vivir dentro del `TextField` y pasa a ser un sello transitorio
  (`.t-meta text-success`) en la cabecera del grupo.
- **Apariencia**: fila `Tema` con el segmented **alineado a la izquierda y a
  todo el ancho**; caption solo "Auto sigue al sistema" en `.t-meta`.
- **Biblioteca**: fila `Densidad del grid` con segmented (Auto/2/4/8) y una
  **preview de 3 miniaturas** que muestra el resultado (2, 4 u 8 columnas) al
  lado; caption corto. Debajo, `ListGroup.Item` `Estadísticas` con descripción
  "La biblioteca de un vistazo".
- **App**: `ListGroup.Item` `Acerca de / Ayuda`; fila `Versión` con el valor a
  la derecha y **sin** la línea de stack (el stack se mueve a Acerca de →
  Créditos). La versión no navega, así que no lleva chevron.
- **Un solo modelo de guardado**: todo auto-guarda con el sello "Guardado" (ya
  es el comportamiento actual); no se añaden botones de guardar.
- **Fuera de alcance**: "Restablecer ajustes" (requiere `Dialog` de
  confirmación y decisión sobre borrar también `lastJobOptions`); se anota como
  candidato para 0.3.1.

**Componentes nuevos** (fuera de `src/app/`):

- `src/components/settings-group.tsx`: cabecera de grupo + superficie con
  separadores entre hijos.
- `src/components/settings-row.tsx`: fila label/descripción + control a la
  derecha (o apilado en pantallas < 360 dp), alto mínimo 44.
- `src/components/segmented-field.tsx`: segmented izquierdo de ancho completo
  (usa `Tabs` como hoy), con label y caption opcionales.
- `src/components/job-row.tsx`: fila de trabajo reutilizable (Inicio).

### C. `src/lib/settings.ts`

Sin cambios de esquema. `lastJobOptions` se mantiene y se sigue guardando tras
cada submit válido (incluido el nuevo stepper de concurrencia).

## Technical decision

- El primario de Inicio ya no se deshabilita por URL inválida: se valida al
  pulsar y se muestra `FieldError` + foco en el campo (evita el estado
  deshabilitado ilegible que detectó la spec 01).
- El historial de trabajos es **en memoria**: no hay endpoint de jobs en la API
  y no se inventa uno. Si más adelante existe `GET /api/jobs`, esta lista pasa a
  hidratarse sin cambiar la fila.
- El stepper de concurrencia se implementa con dos `IconButton` (ghost, 44) y
  un valor `.t-body` tabular; no se añade dependencia.
- `BottomSheet` con `contentContainerClassName` para padding (`className` pinta
  la superficie del sheet), como ya está documentado en `docs/arquitectura.md`.
- El segmented de Ajustes sigue usando `Tabs` (ya integrado y accesible por
  teclado/lector como conjunto de pestañas); no se introduce un control nuevo.
- Sin dependencias nuevas y sin rebuild.

## Affected files

`src/app/(tabs)/index.tsx`, `src/app/(tabs)/settings.tsx`,
`src/components/settings-group.tsx` (nuevo),
`src/components/settings-row.tsx` (nuevo),
`src/components/segmented-field.tsx` (nuevo),
`src/components/job-row.tsx` (nuevo). `docs/arquitectura.md` al cerrar.

## Tests

- `tsc` + `lint`.
- Visual claro/oscuro en 390 dp y tablet:
  - Inicio: URL inválida → error inline al pulsar, foco en el campo, sin botón
    deshabilitado ilegible; con teclado abierto el primario sigue visible.
  - Inicio: lanzar job → aparece en "Trabajos de esta sesión", se puede
    cancelar, y al terminar muestra el estado final.
  - Opciones: abrir sheet, cambiar tomo/concurrencia/switches, cerrar y
    reabrir → valores recordados (incluido tras reiniciar, vía
    `lastJobOptions`).
  - PDF: elegir archivo, ver nombre/tamaño, quitarlo, enviar.
  - Ajustes: probar conexión OK y error; editar URL invalida el estado; sello
    "Guardado"; tema forzado actualiza tab bar y headers; densidad cambia el
    grid y la preview.
  - Ajustes: `Estadísticas` ya no está en App; `Versión` no navega.

## Acceptance criteria

- [ ] Inicio: el primario está directamente bajo el campo de URL y sigue
      visible con el teclado abierto.
- [ ] Inicio: no hay accordion anidado; las opciones avanzadas viven en un
      `BottomSheet` con stepper y switches de 44 px.
- [ ] Inicio: existe "Trabajos de esta sesión" con estados, cancelar y
      descartar; el vacío es una frase, no un hueco de media pantalla.
- [ ] Inicio: el vacío bajo el contenido no supera ~30 % de la pantalla con el
      formulario en su estado inicial.
- [ ] Ajustes: 4 grupos (Servidor, Apariencia, Biblioteca, App), una superficie
      por grupo con separadores.
- [ ] Ajustes: un solo estilo de label; los segmentados van a la izquierda y a
      todo el ancho; "Probar conexión" ya no se lee como acción destructiva.
- [ ] Ajustes: Estadísticas sale de "Info de la app"; no queda jerga de
      desarrollo (Expo/HeroUI/Uniwind) en la pantalla.
- [ ] Copy de opciones avanzadas sin jerga de CLI.
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Implementación (2026-11-03)

- **Ajustes al plan**
  - Ajustes se construyó con `SettingsGroup` + `SettingsRow` + `SegmentedField`
    (una superficie por grupo y separadores); `ListGroup` se reserva para filas
    homogéneas (detalle y glosario).
  - El "Ir a Ajustes" de Biblioteca navega a la pestaña (`/settings`), no al
    grupo Servidor (no hay rutas por sección).
  - El sello "Guardado" vive en la cabecera del grupo Servidor.
  - Los trabajos de la sesión muestran `Origen · estado`, id y acciones; el
    historial es en memoria (máx. 10) como se decidió.
  - El stepper de concurrencia se implementó con dos `Pressable` de 44 y valor
    tabular, sin dependencia nueva.
- Verificado: URL inválida (error inline, foco neutro), teclado sin tapar el
  primario, sheet de opciones, PDF, probar conexión OK/error, tema forzado.
