# Estado de la entrega

## Implementado y probado

Usuarios (cuatro roles, recuperación y administración), menú (CRUD, categorías y disponibilidad), mesas (crear, editar, consultar, liberar y reserva básica), pedidos, cocina, inventario y facturación. Actividad se conserva. El flujo termina al emitir el comprobante y liberar la mesa.

Se incluyen pruebas, matriz con resultados, informe de cobertura, medición local de respuesta, arquitectura, UML actualizado y manual técnico preliminar.

El PDF no enumera RF23–RF27 del inventario: se documentó el alcance implementado (insumos, mínimos, entradas/salidas, edición y eliminación lógica). No se inventa una correspondencia con requisitos ausentes.

## Qué debe comprobar el equipo

1. Instalar o actualizar en su Windows con XAMPP y repetir el flujo usando datos ficticios.
2. Preparar los commits y la entrega Git que pide la profesora. No se subió esta versión a GitHub por indicación del usuario. No se inventó un historial de contribuciones.
3. Observar la disponibilidad durante el periodo que se acuerde con la profesora; una prueba local corta no demuestra el 95%.
4. Usar `coverage/index.html`, `docs/PRUEBAS.md` y los SVG para sustentar con evidencias.

La reserva es básica: aparta la mesa desde ahora, tiene una sola reserva activa por mesa y se cierra con llegada/cancelación. La agenda completa, reportes, dashboard y publicación en internet quedan para la entrega posterior que señala el PDF.
