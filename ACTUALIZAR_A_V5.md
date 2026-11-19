# Actualizar conservando los datos

1. Detén SIAR. Deja MySQL de XAMPP encendido.
2. Exporta la base actual desde phpMyAdmin como respaldo SQL.
3. Extrae esta entrega en una carpeta nueva. Conserva la carpeta anterior.
4. Copia tu config.json anterior a la carpeta nueva. Debe apuntar a la misma base.
5. Ejecuta INSTALAR_SIAR.bat. La actualización añade endAt a reservations si falta.
6. Ejecuta INICIAR_SIAR.bat y recarga con Ctrl+F5.
7. Entra como administrador. En el menú aparecen Dashboard, Reservas y Reportes.

No vuelvas a importar el JSON de v3 si ya usas MySQL.
No elimina pedidos, facturas, usuarios ni módulos anteriores.

## Cambio de reservas
Ahora cada reserva tiene inicio y fin. Las antiguas sin fin se interpretan como una reserva de dos horas desde su inicio: revísalas en la agenda.
Una reserva futura no pinta la mesa de amarillo antes de comenzar. Durante su horario sí la bloquea.
Una reserva vencida sin llegada queda visible en el historial y no ocupa la mesa.
La confirmación de llegada solo se admite dentro del intervalo y si la mesa está libre.
El fin del intervalo no libera automáticamente una mesa que ya está ocupada por clientes.
Para editar o reprogramar, usa la agenda. Para reservar desde el plano también debes indicar el fin.
El sistema no predice cuánto durará un pedido: si los clientes anteriores siguen allí, la llegada de la reserva se rechaza hasta liberar la mesa.

## Comprobación rápida
Crea una reserva para mañana, edítala e intenta otra superpuesta en la misma mesa: debe rechazarla.
Prueba otra mesa o un horario contiguo: debe aceptarlo.
Consulta ventas de una fecha con comprobantes y descarga el CSV.
Abre Dashboard y compara el total con Reportes del mismo día.

Esta entrega NO publica el sistema en Internet. No expongas el servidor local directamente: el despliegue necesita un alojamiento, MySQL privado, HTTPS y configuración de producción.
