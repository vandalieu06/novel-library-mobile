---
code: "05"
title: "Subida de PDF: conservar nombre original y metadatos editables"
project: "novel-library-mobile"
status: completed
version: "0.3.0"
date: 2026-11-03
tags: [spec, sdd]
affected_files:
  - src/lib/types.ts
  - src/lib/http-api-client.ts
  - src/app/(tabs)/index.tsx
---

# 05 — Subida de PDF: conservar nombre original y metadatos editables

## Purpose

Evitar que los PDFs subidos desde la app se guarden con un nombre UUID cuando el PDF no
trae metadatos, y permitir forzar título, autor y tipo de PDF desde la app.

## Context

`pickPdf` usa `DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })`, así que
el archivo real queda en caché con un nombre UUID. `HttpApiClient.uploadPdf` hace:

```ts
const file = new File(request.uri);
form.append("file", file);
```

`request.filename` (el `asset.name` original) se guarda en el estado y se muestra en la UI,
pero **nunca se envía al servidor**. El multipart llega como `<uuid>.pdf` y el backend lo
usa como `source_filename` y como fallback de título. Si el PDF tiene `Title`, el problema
no se ve; si no lo tiene, el título/slug/EPUB acaban siendo el UUID.

Evidencia con las últimas 3 subidas:

| Archivo recibido por el servidor | `Title` del PDF | Resultado |
|---|---|---|
| `a30a18c4-...pdf` | `I Married the Dragon I Killed` | correcto |
| `21032367-...pdf` | vacío | título UUID |
| `fc2c6dab-...pdf` | vacío | título UUID |

## Proposed change (antes → después)

- **Antes:** solo se envía el `File` de la URI de caché; el nombre original se pierde.
- **Después:**
  1. `src/lib/types.ts` — `UploadPdfRequest` añade:
     - `title?: string | null`
     - `author?: string | null`
     - `kind?: "auto" | "book" | "webnovel"`
  2. `src/lib/http-api-client.ts`:
     - `uploadPdf` añade al `FormData`:
       - `original_filename` = `request.filename`
       - `title` si no está vacío
       - `author` si no está vacío
       - `kind` (default `"auto"`)
     - `uploadWithTask` añade los mismos campos a `parameters`.
     - No se depende del nombre del multipart: el backend usa `original_filename`.
  3. `src/app/(tabs)/index.tsx`:
     - Estado `pdfTitle`, `pdfAuthor`, `pdfKind` (default `"auto"`).
     - Campos opcionales “Título” y “Autor” + selector “Tipo de PDF”
       (Automático / Libro / Webnovel) en el panel PDF.
     - Al elegir el archivo, prerrellenar el título con el nombre sin `.pdf` **solo si no
       parece un UUID**; si parece UUID, dejarlo vacío para que el backend infiera.
     - `submitPdf` envía `filename`, `title`, `author` y `kind`.

## Technical decision

- **No renombrar el archivo de caché:** es frágil (colisiones, permisos) y no aporta nada
  si el backend recibe el nombre explícito. `original_filename` viaja como campo de texto.
- **`original_filename` manda sobre el nombre del multipart** en el backend (spec
  translate_novels 15); el UUID de caché queda como detalle interno.
- **El título vacío no se envía:** así el backend aplica su prioridad
  metadatos > inferencia > nombre original.
- Los campos son opcionales: la app sigue funcionando sin tocarlos.

## Affected files

- `src/lib/types.ts`
- `src/lib/http-api-client.ts`
- `src/app/(tabs)/index.tsx`

## Tests

- `npx tsc --noEmit` y `npx expo lint`.
- Verificación manual en emulador:
  - elegir un PDF con nombre legible y sin `Title` → el servidor recibe
    `original_filename` y el título es el nombre del archivo, no el UUID de caché;
  - escribir “Título”/“Autor” → mandan sobre el nombre y los metadatos;
  - `kind=webnovel` y `kind=book` llegan al job.
- Comprobar en `runs.jsonl`/manifest que `source_filename` ya no es un UUID.

## Acceptance criteria

- Subir un PDF sin metadatos con nombre `Kunon the Sorcerer Can See v01.pdf` produce título
  `Kunon the Sorcerer Can See v01` y `source_filename` con ese nombre.
- El campo “Título” de la app tiene prioridad sobre el nombre y los metadatos.
- `kind` viaja en la petición y se refleja en `manifest.pdf_kind`.
- La subida sigue funcionando con el fallback `createUploadTask`.
- `tsc` y `expo lint` pasan.

## Implementación (2026-11-03)

- `UploadPdfRequest` añade `title`, `author` y `kind`.
- `uploadPdf` (FormData + `expo/fetch`) y `uploadWithTask` (fallback nativo) envían
  `original_filename`, `title`/`author` solo si no están vacíos y `kind`.
- Panel PDF: campos "Título (opcional)" y "Autor (opcional)" + selector "Tipo de
  PDF" (Automático / Libro / Webnovel). Al elegir archivo se prerrellena el
  título con el nombre sin `.pdf` salvo que sea un UUID; al quitarlo se limpian.
- Contrato verificado contra `translate_novels/src/novel_cli/web/routes.py`
  (`original_filename`, `title`, `author`, `kind` ya existen y `kind` valida
  auto/book/webnovel). No se ejecutó una subida real para no crear una novela
  de prueba en la biblioteca.
- `tsc` y `expo lint` en verde.
