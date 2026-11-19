# Nuevos módulos 5.0

## Reservas
La agenda reservas.html permite filtrar por día y estado, crear, editar y cancelar.
Las reservas en estado Reservada se solapan si inicioA < finB y finA > inicioB.
Dos intervalos contiguos son válidos. Solo se comparan reservas de la misma mesa.
Se valida cliente, capacidad, fecha futura y duración de 1 minuto a 8 horas.
Al confirmar la llegada, se valida el intervalo y que no haya ocupación ni pedidos activos.
Las operaciones de escritura del servidor siguen usando la cola existente, evitando que dos solicitudes creen simultáneamente reservas cruzadas.
Administrador y mesero tienen acceso. Las páginas tienen control de rol en el servidor.
Una reserva antigua sin endAt recibe dos horas de duración al cargarse.

## Reportes
reportes.html, acceso administrador. Fechas inclusivas según la hora local del navegador.
Los ingresos se calculan con comprobantes emitidos, no con pedidos todavía pendientes.
Incluye total cobrado, descuentos, impuestos, productos más vendidos por unidades y movimientos de inventario.
El bruto por producto no reparte los descuentos de la factura. No representa utilidad.
El CSV de ventas expresa COP, mientras los cálculos internos usan centavos.
Exportación de movimientos separada. Protege campos de texto que podrían interpretarse como fórmulas.
Las facturas conservan sus nombres y precios históricos aunque el producto cambie o se elimine.

## Dashboard
dashboard.html, acceso administrador.
Ventas del día, pedidos sin cerrar, mesas ocupadas, reservas pendientes de hoy, cinco productos más vendidos del día e insumos por debajo o en el mínimo.
En periodos sin datos muestra estados vacíos y cero, sin inventar ventas.

## Archivos
- public/js/analytics.js: funciones puras para fechas, agregación y CSV.
- public/js/final-modules.js: interacción de las tres páginas nuevas.
- services/restaurant.js: validación de intervalos y llegada.
- server.js: nueva ruta PUT /api/reservations/:id y validación de llegada.
- database/schema.sql, columns.json, db.js: fin de reserva y migración.
- public/js/app.js: estado de mesa durante el horario reservado.
Se conserva shared.js, el sistema de sesión, navegación, estilos y todos los módulos existentes.

## Optimización aplicada
Las nuevas páginas evitan reconstruir las tablas si la versión de los datos y el minuto no cambiaron.
Los productos facturados se agrupan con Map por identificador.
No se ha realizado una medición comparativa de carga: no se afirma un porcentaje de mejora.

## Despliegue pendiente
La configuración actual sigue siendo local (127.0.0.1 y validación de host localhost).
Para publicar se requiere elegir proveedor/dominio y adaptar el servidor a HTTPS, cookies de producción, variables de entorno y una base privada.
El almacenamiento actual mantiene una conexión y un bloqueo para una sola instancia. El alojamiento debe respetar ese diseño o refactorizarlo antes de escalar.
