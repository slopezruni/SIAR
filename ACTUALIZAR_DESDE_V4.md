# Actualizar sin perder datos

Esta versión conserva Usuarios, Menú, Mesas, Pedidos, Cocina, Inventario, Facturación y Actividad. Añade disponibilidad del menú, creación/edición de mesas y reserva básica dentro de Mesas.

## Si ya tienes la versión 4 con MySQL

1. Cierra SIAR con Ctrl+C. Deja MySQL de XAMPP encendido.
2. Haz un respaldo SQL desde phpMyAdmin → tu base → Exportar.
3. Extrae este ZIP en una carpeta nueva. No elimines la anterior.
4. Copia **tu `config.json` anterior** a esta carpeta nueva: debe apuntar a la misma base. No uses el ejemplo si cambiaste usuario, contraseña, puerto o nombre de la base.
5. Ejecuta `INSTALAR_SIAR.bat`. Instala las dependencias y añade `products.available` y la tabla `reservations` si faltan. Conserva los datos anteriores.
6. Ejecuta `INICIAR_SIAR.bat`. Entra a `http://localhost:3000` con tus cuentas de siempre. Presiona Ctrl+F5.

No importes `siar.json` si ya migraste tus registros a MySQL. No reemplaces la base con otra vacía. La aplicación anterior no debe seguir abierta al ejecutar la actualización.

## Si todavía tienes la versión 3 con JSON

Sigue la sección de importación de `LEEME.md`. Conserva el JSON original como respaldo. La importación solo se admite sobre una base nueva sin cuentas ni operaciones.

## Cómo probar lo agregado

- Menú → Editar producto → Disponibilidad → Agotado. Deja de aparecer en el selector de nuevos productos del pedido; las ventas anteriores se conservan.
- Mesas → Nueva mesa: el administrador elige piso y capacidad. El número se asigna automáticamente.
- Si un piso tiene más de 12 mesas, usa Anterior/Siguiente para ver los grupos sin amontonar el plano.
- Selecciona una mesa libre → Editar mesa: cambia piso o capacidad. No se permite modificar una mesa ocupada, con pedido activo o reservada.
- Selecciona una mesa libre → Reservar mesa: escribe cliente, personas y fecha/hora futura. Queda apartada desde ese momento, en amarillo.
- Confirmar llegada cambia la mesa a ocupada y permite crear el pedido. Cancelar reserva vuelve a dejarla disponible.

Es una reserva básica: no es todavía una agenda con varias reservas por horario para la misma mesa. Se conserva el historial SQL de reservas atendidas y canceladas.
