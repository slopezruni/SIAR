# Diagramas actualizados

Abre los archivos SVG en el navegador. Los `.mmd` son las fuentes editables en Mermaid.

- **clases**: modelo UML del dominio. Representa los datos y relaciones; el código JavaScript actual usa objetos y funciones, no declaraciones `class` para cada entidad. Las dependencias punteadas de Usuario son referencias históricas por nombre; no claves foráneas SQL.
- **casos-de-uso**: actores, límite del sistema y funciones. Se dibuja con la sintaxis de flujo de Mermaid usando óvalos y actores identificados con estereotipo.
- **secuencia-venta**: recorrido de pedido a comprobante; la facturación la inicia cajero o administrador desde la interfaz.
- **arquitectura**: carpetas y responsabilidades implementadas. Conserva `server.js` como punto de entrada y añade reglas reutilizables en `services`.

No se incluyen funcionalidades de Reportes, Dashboard o agenda completa de Reservas: pertenecen a la entrega posterior. La reserva actual aparta la mesa desde su registro hasta llegada o cancelación.
