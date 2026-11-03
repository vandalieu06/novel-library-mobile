---
code: "06"
title: "Tablet: barra de pestañas lateral (navigation rail) en vez de inferior"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-03
tags: [spec, sdd, ui, tablet, navegacion]
affected_files:
  - src/app/(tabs)/_layout.tsx
  - docs/arquitectura.md
---

# 06 — Rail lateral en tablet

## Purpose

En tablet, mover la navegación de la barra inferior a un **rail lateral
izquierdo** (patrón Android de tablet), para no gastar alto de pantalla y
aprovechar el ancho. En móvil se mantiene la barra inferior.

## Context

- El emulador actual es una tablet: 2560×1600 px a 320 dpi → **1280×800 dp**.
- Con la barra inferior, tres destinos ocupan ~80 dp de alto en una pantalla
  apaisada y obligan a llevar el pulgar al borde inferior.
- Expo Router 58 incluye su propia copia de `bottom-tabs`, que soporta
  `tabBarPosition: 'left' | 'right'` y `tabBarVariant: 'material'`. No hace falta
  una barra custom ni una dependencia nueva.

## Proposed change

En `src/app/(tabs)/_layout.tsx`:

1. `isTablet = useWindowDimensions().width >= 768`.
2. `screenOptions` condicional:
   - `tabBarPosition: isTablet ? "left" : "bottom"`.
   - `tabBarVariant: isTablet ? "material" : "uikit"`.
   - `tabBarLabelPosition: "below-icon"` (en el rail, icono arriba y label
     debajo; en móvil es el comportamiento actual).
3. Rail compacto: `tabBarStyle` en tablet con `width/minWidth/maxWidth: 96`,
   `backgroundColor` del tema, `borderColor` y `borderTopWidth: 0` (el borde
   derecho lo pone el propio navegador). En móvil se mantiene el borde superior
   de 1 px.
4. **Grupo centrado**: el navegador alinea los ítems arriba; se calcula
   `paddingTop = (alto - altoGrupo) / 2 - gap / 2` con la altura medida de un
   ítem (58 dp) y el gap (12 dp) para 3 destinos. Así los iconos quedan en el
   centro vertical, no en la esquina superior.
4. Sin cambios en iconos, tint activo/inactivo, labels ni en las pantallas: el
   navegador coloca el contenido a la derecha del rail automáticamente.

## Technical decision

- Se usa la implementación incluida en Expo Router (misma que la barra actual)
  en vez de una `tabBar` custom: mantiene accesibilidad, foco, badges y
  animaciones, y evita duplicar el layout.
- `tabBarVariant: "material"` + `tabBarLabelPosition: "below-icon"` es la
  combinación que produce un rail compacto; con `uikit` + `beside-icon` el
  navegador fuerza un ancho de sidebar de 360 dp (demasiado para 3 destinos).
- `96` dp: cabe "Biblioteca" debajo del icono con el padding interno del rail.
- El rail ya aplica `insets.top/bottom/left` internamente; no se toca `Screen`.
- Breakpoint 768 dp, el mismo que usa el grid de Biblioteca para tablet.

## Affected files

`src/app/(tabs)/_layout.tsx`. `docs/arquitectura.md` al cerrar.

## Tests

- `tsc` + `lint`.
- Emulador tablet (1280×800 dp):
  - rail a la izquierda con los 3 destinos, icono + label, activo en accent;
  - contenido a la derecha sin solaparse; status bar y gesto inferior sin
    choques;
  - claro y oscuro.
- Emulador móvil (o ventana < 768 dp): barra inferior intacta.

## Acceptance criteria

- [ ] Con ancho ≥ 768 dp la navegación es un rail lateral izquierdo de 96 dp.
- [ ] Con ancho < 768 dp se mantiene la barra inferior actual.
- [ ] Iconos, labels, tint activo y navegación funcionan igual en ambos modos.
- [ ] Sin solapes con la barra de estado ni con el gesto inferior.
- [ ] tsc + lint en verde y commit al cerrar la spec.

## Implementación (2026-11-03)

- `isTablet = width >= 768`; `tabBarPosition: left`, `tabBarVariant: material`,
  `tabBarLabelPosition: below-icon`, rail de 96 dp.
- Centrado vertical con `paddingTop` dinámico a partir de `useWindowDimensions`
  (ítem 58 dp, gap 12 dp, 3 destinos → grupo de 198 dp).
- Verificado en el emulador tablet 1280×800 dp: rail centrado, navegación,
  claro/oscuro y sin solapes. Con `wm size 1080x2400` (540 dp) vuelve la barra
  inferior.
- Nota: el contenido de las pantallas sigue a ancho completo en tablet; un
  `maxWidth` por pantalla sería un cambio aparte.
