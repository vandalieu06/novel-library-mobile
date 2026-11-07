# Changelog — 0.4.0

Rediseño Android Material 3 (B2) aprobado desde
`prototypes/design-directions/`. La app pasa a abrir en **Biblioteca**;
**Descargar** es una tab secundaria; **Ajustes** es un hub informativo con
detalle en sheet (móvil) o panel lateral (tablet).

Todas las specs están en `status: proposed` hasta la aprobación explícita.

| Fecha | Spec | Cambio |
| ----- | ---- | ------ |
| 2026-11-07 | 01 | **completed** — Fundamentos Material 3: tokens claro/oscuro terracota (accent relleno vs accent-ink), tipografía del sistema 22/16/14/12, radios/elevación y componentes base (AppBar, TabRow, ListCard, SegmentedField, ActionButton, ProgressBar); splash `#fbf8f6`/`#121110` con rebuild verificado |
| 2026-11-07 | 02 | **completed** — Biblioteca primero: rutas (`/`=Biblioteca, `/download`), tabs Biblioteca·Descargar·Ajustes con MaterialIcons (franja uikit: desviación documentada), top app bar con búsqueda/filtros/overflow, tabs Todas/Web/PDF/Traducidas y grid 2 columnas con badge ES/PDF **completed** |
| 2026-11-07 | 03 | Descargar: formulario web/PDF, opciones y trabajos en Material 3 **proposed** |
| 2026-11-07 | 04 | Detalle: top bar, progreso, tomos y acciones **proposed** |
| 2026-11-07 | 05 | Ajustes: hub, sheets de servidor/tema/densidad y subpáginas **proposed** |
| 2026-11-07 | 06 | Tablet: rail, biblioteca de 3 columnas y panel de detalle **proposed** |
| 2026-11-07 | 07 | QA, accesibilidad, estados y cierre visual **proposed** |

## Orden de implementación

01 → 02 → 03 → 04 → 05 → 06 → 07. 02 crea la ruta `/download`; 03 la rellena;
04 y 05 comparten los componentes de 01; 06 reutiliza el contenido compacto de
04 y el formulario de servidor de 05; 07 es el gate final.

## Emuladores y RAM

Regla: **un solo emulador a la vez**. No lanzar `Pixel_10` ni `pixel_4a_teikit`
para esta versión; no aportan a la matriz y consumen RAM.

| Spec | Emulador | Secuencia |
| ---- | -------- | --------- |
| 01 | `mobile` → `Expo` (1080×2400, Android 37) | solo |
| 02 | `mobile` → `Expo` | solo |
| 03 | `mobile` → `Expo` | solo |
| 04 | `mobile` → `Expo` | solo |
| 05 | `mobile` → `Expo` | solo |
| 06 | `tablet` → `Medium_Tablet` (2560×1600, Android 35, landscape) | solo; rotar a portrait y volver |
| 07 | `mobile` → `tablet` | **secuencial**: mobile, matar, tablet, matar |

Al terminar cada spec:

```bash
adb devices                 # localizar el serial (p. ej. emulator-5554)
adb -s <serial> emu kill    # apagar el emulador usado
```

No se deja Metro ni un emulador corriendo entre specs.
