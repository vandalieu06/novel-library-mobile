# Changelog — 0.1.0

| Fecha | Spec | Cambio | 
| ----- | ---- | ------ |
| 2026-11-01 | 01 | Integración de HeroUI Native + Uniwind: dependencias, tema web en global.css, providers y `orientation: default`; bundle y dev build verificados en emulador |
| 2026-11-01 | 02 | Arquitectura mock-first: types + ApiClient (MockApiClient), mock con las 6 novelas reales, covers en assets, settings AsyncStorage, grid 2/4/8, navegación por tabs (Inicio · Books · Ajustes) y stubs navegables |
| 2026-11-01 | 03 | Pantallas Inicio (form web/PDF con traducir, tomos y avanzadas), Biblioteca (búsqueda, filtros, orden, grid 2/4/8, skeletons, refresh) y detalle de novela (hero, progreso, tomos con descarga mock); tema completo claro/oscuro con la paleta web |
| 2026-11-01 | 05 | Pulido de UI: grid de 3 columnas en móvil, filtros compactos en 2 filas, selector centrado con separación en Inicio, appbar de retroceso en el detalle y tokens de espaciado documentados |
| 2026-11-01 | 04 | Ajustes (URL del servidor con probar conexión mock, tema auto/claro/oscuro con Uniwind, densidad del grid, info de la app con ListGroup) + Estadísticas (contadores derivados del mock) + página Acerca de/Ayuda |
| 2026-11-01 | 06 | Pulido round 2: appbar nativo tematizado en stack (detail/estadísticas/about), búsqueda compacta + botón Filtros con BottomSheet (switches en vivo, badge de activos), cards sin métricas y escala tipográfica aplicada. Extensión round 3: cover `h-44` (aspect roto con Uniwind), sheet con padding real (`contentContainerClassName`), Separator y jerarquía |
