---
code: "05"
title: "Ajustes: hub informativo, sheets y subpáginas"
project: "novel-library-mobile"
status: proposed
version: "0.4.0"
date: 2026-11-07
tags: [spec, sdd, ui, settings, material3]
affected_files:
  - "src/app/(tabs)/settings.tsx"
  - src/app/settings/statistics.tsx
  - src/app/settings/about.tsx
  - src/components/settings/server-form.tsx
  - src/components/settings/option-sheet.tsx
  - src/components/settings/settings-hub.tsx
  - src/components/settings-row.tsx
  - src/components/settings-group.tsx
  - src/components/toggle-row.tsx
  - src/components/segmented-field.tsx
  - src/components/list-card.tsx
  - src/components/action-button.tsx
  - src/lib/settings.ts
  - src/lib/theme.tsx
  - src/lib/api-provider.tsx
  - docs/arquitectura.md
---

# 05 — Ajustes

## Purpose

Convertir Ajustes de un formulario largo en un **hub informativo** con detalle
en sheet (móvil) y panel lateral (tablet): estado del servidor y de la
biblioteca, preferencias, estadísticas y acerca. Mantener el comportamiento de
servidor, tema y densidad, pero con guardado explícito en el servidor.

## Context

Hoy `settings.tsx` apila servidor, apariencia, densidad, estadísticas y app en
un scroll único. El servidor auto-guarda mientras se escribe y el resto son
filas dentro de cards. B2 propone:

- Hub: estado + preferencias + app.
- **Sheet** para servidor, tema y densidad (decisiones cortas).
- **Subpágina** para estadísticas y acerca (contenido largo).
- Tablet: el detalle del servidor en panel lateral (06).

Referencia: `?variant=native&screen=settings&theme=light&width=phone` y
`width=tablet`.

## Proposed change

### Hub

`AppBar` “Ajustes”. Contenido:

- **Estado** (label 12/16 `muted`), `ListCard`:
  - **Servidor**: descripción con la URL; estado a la derecha + chevron.
    - `apiUrl === ""` → “Modo demo” (`muted`).
    - configurado + `lastConnection.ok` → “Conectado” (`success`).
    - configurado + `lastConnection` con error → “Sin conexión” (`danger`).
    - configurado sin prueba → “Configurado” (`muted`).
  - **Biblioteca**: “N novelas · M tomos” (`getNovels`, M = suma de
    `epub_original` + `epub_translated`); si falla, “No se pudo cargar”.
    - No se muestra “1 activo”: los jobs son de sesión y no están disponibles
      aquí. Nada de datos inventados.
- **Preferencias**, `ListCard`:
  - Tema → “Auto” + chevron → sheet.
  - Densidad de la rejilla → “Automática” + chevron → sheet.
- **Biblioteca**, `ListCard`:
  - Estadísticas → `/settings/statistics`.
- **App**, `ListCard`:
  - Acerca de / Ayuda → `/settings/about`.
  - Versión → `1.0.0`.
- Footnote “novel-library-mobile · uso privado”.

### Sheet de servidor (móvil)

- Título 20/26; estado actual (dot + texto).
- Campos URL y token outlined de 56, con label 12/16.
- “Probar conexión” tonal: usa los **drafts** (no guarda) y actualiza el estado
  inline; persiste `lastConnection` al terminar.
- “Guardar” accent: persiste `apiUrl`/`webToken`, recrea el `ApiClient` y cierra.
- **Se elimina el auto-guardado por tecleo** de la URL/token; el guardado es
  explícito. Evita recrear el cliente en cada pulsación.
- Teclado: `KeyboardAvoidingView`/`imePadding`; el sheet scrollea; targets 48.

### Sheets de tema y densidad

- **Tema**: Auto/Claro/Oscuro; aplica al instante con `Uniwind.setTheme` y
  actualiza `settings.theme`; “Listo” cierra.
- **Densidad**: Auto/2/4/8; actualiza `settings.gridDensity`; “Listo” cierra.
- Ambos usan `SegmentedField` y `OptionSheet`; radio 24; handle.

### Subpáginas

- `settings/statistics.tsx` y `settings/about.tsx` mantienen su contenido y
  datos; se actualizan al chrome Material 3 (header nativo, `ListCard`, tokens,
  tipografía) sin cambiar lógica.
- Estadísticas sigue mostrando el resumen de la biblioteca; Acerca mantiene
  ayuda/versión/privacidad.

## Technical decision

- `AppSettings` gana `lastConnection: { ok: boolean; at: string } | null`
  (default `null`). `loadSettings` ya mezcla `DEFAULT_SETTINGS`, así que la
  migración es segura.
- El hub carga `getNovels()` al enfocar (`useFocusEffect`), sin bloquear: si
  falla, el estado de la biblioteca lo dice. No se añade store global.
- El servidor usa guardado explícito; el test no persiste URL/token. La prueba
  usa `HttpApiClient` (real) o el mock según `apiUrl`, con el contrato actual.
- `ServerForm` y `OptionSheet` viven en `components/settings/` y se reutilizan
  en el panel lateral de tablet (06).
- Se retiran `SettingsGroup`/`SettingsRow` si quedan sin uso; las filas pasan a
  `ListCard`/`ListRow` de 01.
- El sheet usa el `BottomSheet` existente; no se añade dependencia.
- El tema sigue siendo `auto` por defecto.

## Affected files

`(tabs)/settings.tsx`, `settings/statistics.tsx`, `settings/about.tsx`;
`components/settings/server-form.tsx`, `option-sheet.tsx`, `settings-hub.tsx`;
`settings-row.tsx`, `settings-group.tsx`, `toggle-row.tsx`,
`segmented-field.tsx`, `list-card.tsx`, `action-button.tsx`; `lib/settings.ts`,
`lib/theme.tsx`, `lib/api-provider.tsx`; `docs/arquitectura.md` al cierre.

## Tests

**Emuladores**: solo `mobile` → **`Expo`** (1080×2400, Android 37, portrait).
No lanzar `Medium_Tablet`, `Pixel_10` ni `pixel_4a_teikit`. El panel lateral de
tablet se valida en 06. Arranque: `emulator -avd Expo` solo si no está ya; al
terminar `adb -s <serial> emu kill`.

1. `npx tsc --noEmit` y `npx expo lint`.
2. `make devices`; `make reverse`; `make start`/`make deep-link`.
3. Hub: servidor en “Modo demo” con URL vacía; biblioteca con 6 novelas/66
   tomos; sin “1 activo”; versión 1.0.0.
4. Servidor: abrir sheet, escribir URL/token, “Probar” con backend y con URL
   inválida; estados inline; “Guardar” persiste y recrea el cliente; reabrir y
   comprobar valores; estado del hub.
5. Tema: cambiar Auto/Claro/Oscuro; la app cambia al instante y persiste tras
   reiniciar.
6. Densidad: cambiar Auto/2/4/8; la biblioteca re-layouta; persiste.
7. Estadísticas y Acerca: abren, muestran datos, back al hub; claro/oscuro.
8. Teclado en el sheet; el CTA no queda tapado; targets 48.
9. `adb -s <serial> emu kill` al terminar. No lanzar el tablet.

## Acceptance criteria

- [ ] Ajustes es un hub con Estado/Preferencias/Biblioteca/App, no un formulario
      largo.
- [ ] Servidor, tema y densidad abren sheet; estadísticas y acerca son
      subpáginas.
- [ ] El estado del servidor refleja demo/configurado/conectado/sin conexión
      sin datos inventados; la biblioteca muestra el conteo real.
- [ ] El servidor guarda de forma explícita; el test no persiste; `lastConnection`
      se actualiza.
- [ ] Tema y densidad se aplican al instante y persisten.
- [ ] `ServerForm`/`OptionSheet` quedan listos para el panel lateral de 06.
- [ ] Subpáginas actualizadas sin cambios funcionales.
- [ ] `npx tsc --noEmit` y `npx expo lint` pasan.
- [ ] Solo se lanzó `Expo` y se apagó al terminar.
