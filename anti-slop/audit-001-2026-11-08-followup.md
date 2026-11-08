# Seguimiento auditoría antislop 001

Fecha: 2026-11-08
Proyecto: novel-library-mobile
Modo: after
Aprobados: 1, 2 y 6 (recomendación del audit).

## Resueltos

### 1. HIGH - R-03: target de `SegmentedField`

- Cambio: contenedor de `h-10` a `h-11` (44 dp) y radio 22 en `src/components/segmented-field.tsx`.
- Evidencia: en el emulador, la opción Auto del sheet de Tema mide `[56,2015][378,2125]`, 110 px de alto. Con densidad 2.5 son 44 dp.
- Alcance: tema, densidad, idioma preferido y selector Web/PDF de Descargar.

### 2. HIGH - R-03: chips de idioma de Biblioteca

- Cambio: `TagGroup` con `size="lg"` y cada item con `min-h-11 justify-center` en `src/app/(tabs)/index.tsx`.
- Evidencia: el item ES del sheet de filtros mide `[53,1716][166,1831]`, 113 x 115 px, aproximadamente 45 x 46 dp.
- Resultado: el target supera 44 dp y conserva el estado seleccionado.

### 6. MEDIUM - C-4: densidad manual con font scale alto

- Cambio: `resolveGridColumns` recibe `fontScale`. Si `fontScale >= 1.5`, una densidad manual se capa a 2 columnas en móvil y 3 en tablet.
- Evidencia: con `gridDensity = 4` y `font_scale 2.0`, la Biblioteca muestra 2 columnas en móvil.
- Resultado: los títulos siguen usando elipsis a 2 líneas, pero las cards recuperan tamaño legible y no hay desbordamiento.

### 9. LOW - R-31: alineación de los headers de tabs

- Detectado después del audit: Biblioteca tenía `pt-2` extra en el wrapper del `AppBar`, así que su título quedaba 8 dp más abajo que Descargar y Ajustes.
- Cambio: se quitó `pt-2` en `src/app/(tabs)/index.tsx`.
- Evidencia: los tres títulos miden `y=99` con `uiautomator` en el emulador.
- Resultado: headers alineados al mismo borde superior.

## Sin cambios (LOW aceptados)

- Bottom tab bar móvil en variante `uikit`.
- Switch de HeroUI 48 x 24.
- Píldora del rail de fila completa.
- Labels del rail sin escalado de fuente.
- Header extra del panel de detalle.

Estos puntos quedan como desviaciones documentadas; no se tocaron.

## Verificación

- `npx tsc --noEmit`: PASS.
- `npx expo lint`: PASS.
- Biblioteca: filtro de idiomas abierto, chip ES seleccionable, sin overflow.
- Ajustes: sheet de Tema abierto, opción Auto de 44 dp, sin clipping.
- Font scale 2.0 con densidad 4: 2 columnas en móvil.
- Claro: revisado. Oscuro: los cambios son de tamaño y layout, no de tokens; se revalidará en la QA final.
- No se añadieron controles muertos ni datos inventados.

## Gate de las superficies cambiadas

- R-03 PASS: targets de 44 dp en Segmentado y filtros; sin overflow en móvil.
- R-11 PASS: radios siguen el sistema, sin pills universales.
- R-25 PASS: no se cambiaron tokens de color.
- R-26 PASS: filtros, sheets y segmentados siguen funcionando.
- R-34 PASS (parcial): claro verificado; oscuro pendiente de la QA final, sin cambios de color en esta iteración.
- R-35 PASS (superficies cambiadas): app ejecutada y controles tocados; la matriz completa de la app queda para la QA final.
- R-37 PASS: dirección B2 existente, sin rediseño.
- R-39 PASS: labels accesibles existentes, sin cambios de semántica.

El gate completo de la app se ejecutará en la QA final de Android.
