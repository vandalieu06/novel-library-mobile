# Changelog — 0.4.0

Rediseño Android Material 3 (B2) aprobado desde
`prototypes/design-directions/`. La app pasa a abrir en **Biblioteca**;
**Descargar** es una tab secundaria; **Ajustes** es un hub informativo con
detalle en sheet (móvil) o panel lateral (tablet).

El estado de cada spec vive en su frontmatter y se resume en la tabla.

| Fecha | Spec | Cambio |
| ----- | ---- | ------ |
| 2026-11-07 | 01 | **completed** — Fundamentos Material 3: tokens claro/oscuro terracota (accent relleno vs accent-ink), tipografía del sistema 22/16/14/12, radios/elevación y componentes base (AppBar, TabRow, ListCard, SegmentedField, ActionButton, ProgressBar); splash `#fbf8f6`/`#121110` con rebuild verificado |
| 2026-11-07 | 02 | **completed** — Biblioteca primero: rutas (`/`=Biblioteca, `/download`), tabs Biblioteca·Descargar·Ajustes con MaterialIcons (franja uikit: desviación documentada), top app bar con búsqueda/filtros/overflow, tabs Todas/Web/PDF/Traducidas y grid 2 columnas con badge ES/PDF **completed** |
| 2026-11-07 | 03 | **completed** — Descargar: AppBar 56, segmented Web·PDF, campos outlined 56, Opciones en ListCard (56) con sheet Material (radio 24, Restablecer tonal/Listo accent), jobs en ListCard con icono de estado/Cancelar accent-ink/Quitar y contador n/10; contenedor partido en `web-form`/`pdf-form`/`jobs-card`/`advanced-options-sheet` + `OutlinedField` **completed** |
| 2026-11-07 | 04 | **completed** — Detalle: stack header nativo “Detalle” con overflow (retraducir/tamaño), hero 128×192, progreso en `ListCard` con barras de 4 px, CTA accent, job inline sin Alert con id/error/cancelar, tomos originales/traducidos en filas 56 con estados y `Descargar todo`; `DetailContent` compacto listo para el panel de 06 |
| 2026-11-07 | 05 | **completed** — Ajustes: hub con Estado/Preferencias/Biblioteca/App en `ListCard`, estado real de servidor/biblioteca, `ServerForm` con guardado explícito y `lastConnection`, sheets de tema/densidad y estadísticas/acerca en Material 3 |
| 2026-11-07 | 06 | **completed** — Tablet: rail Material de 88, 3 columnas con `contentWidth`, `DetailPanel` de 340 con selección/CTA y `useNovelDetail` compartido, Ajustes con panel de servidor, Descargar a 640 y portrait sin panel |
| 2026-11-07 | 07 | **completed** — QA móvil/tablet secuencial, claro/oscuro, font scale 1.3/2.0 con correcciones de rail y ListRow, revisión de árbol a11y, capturas en `/tmp/opencode/novel-library-0.4.0/`; `expo-doctor` con drift preexistente documentado |
| 2026-11-07 | 08 | **completed** — Idioma preferido global (por defecto ES) en Ajustes y pastillas `Original`/`ES` en Detalle que listan una sola versión, con fallback y override local |
| 2026-11-08 | 09 | **completed** — Contrato API 0.3.1: progreso con `chapters_total` real y `N / total (P %)`, 409 con `job_id` (adjuntar sin reintentar), `cancelling` no terminal, copy de reanudación y limpieza de EPUBs locales al reparar/regenerar; mock con job lento y conflicto forzado |
| 2026-11-08 | 10 | **completed** — Pulido visual: toasts planos sin borde, icono con fondo blanco opaco, nombre “Novel Library” y splash con insignia circular crema; rail de fila completa intacto |
| 2026-11-08 | 11 | **completed** — Sheets de tablet con ancho máximo de 640 dp, centrados, anclados abajo y esquinas superiores redondeadas; móvil a ancho completo mediante `AppSheetContent` |

## Orden de implementación

01 → 02 → 03 → 04 → 05 → 08 → 06 → 07 → 09 → 10 → 11. 02 crea la ruta
`/download`; 03 la rellena; 04 y 05 comparten los componentes de 01; 08 añade
el ajuste de idioma sobre el hub de 05 y el selector en `DetailContent`; 06
reutiliza el contenido compacto de 04 ya con selector; 07 es el gate visual;
09 adapta jobs/errores al contrato 0.3.1; 10 cierra el pulido de
notificaciones/icono/splash; 11 limita los sheets en tablet.

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
| 09 | `mobile` → `Expo`; tablet solo si se toca el panel | solo; revalidar jobs/estados |
| 10 | `mobile` → `Expo` | solo; rebuild nativo para icono/splash |
| 11 | `tablet` → `Medium_Tablet`, luego `Expo` móvil | secuencial; sheets en 1280×800 y 800×1280 |

Al terminar cada spec:

```bash
adb devices                 # localizar el serial (p. ej. emulator-5554)
adb -s <serial> emu kill    # apagar el emulador usado
```

No se deja Metro ni un emulador corriendo entre specs.
