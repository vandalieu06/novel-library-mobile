# Changelog — 0.5.0

Versión abierta para adaptar el frontend al contrato de **novel-cli 0.3.1**.
Sin cambios de endpoints ni de campos: totales reales, lock 409 y estado
`cancelling`.

| Fecha | Spec | Cambio |
| ----- | ---- | ------ |
| 2026-11-07 | 01 | Contrato API 0.3.1: progreso con `chapters_total` real, 409 con `job_id` (adjuntar sin reintentar), `cancelling` no terminal, copy de reanudación y limpieza de EPUBs locales al reparar/regenerar **proposed** |

## Orden de implementación

01 es la primera y única spec de esta versión hasta que se apruebe y se
implemente. No toca navegación ni rediseño: solo contrato/estados/copys.
