# Manual técnico preliminar

## Organización

- `server.js`: servidor HTTP de Node, sesiones, permisos y coordinación de operaciones.
- `services/validation.js`: validaciones comunes e importes.
- `services/sales.js`: construcción de pedidos y cálculo de facturas.
- `services/restaurant.js`: reglas de mesas y reservas.
- `public/*.html`: estructura de las ocho pantallas y login.
- `public/css/*.css`: estilos; `apariencia.css` conserva el aspecto azul/gris.
- `public/js/shared.js`: sesión, solicitudes HTTP, avisos y actualización cada cinco segundos.
- `public/js/app.js`: plano de mesas y selección de piso.
- `public/js/modules.js`: pedidos, cocina, inventario, facturación y actividad.
- `public/js/admin.js`: formularios y tablas de usuarios y menú.
- `public/js/inventory-edit.js`: editar/eliminar insumos.
- `public/js/login.js`: acceso, creación de cuenta y recuperación.
- `database/db.js`: conexión SQL, lectura y guardado en transacciones.
- `database/schema.sql`: tablas, claves primarias y relaciones.
- `database/columns.json`: correspondencia de campos JavaScript y columnas SQL.
- `scripts/init-db.js`: crea la base sin sobrescribir datos existentes.
- `scripts/import-v3.js`: importa una copia JSON anterior sobre una base nueva.
- `tests/`: validaciones unitarias y recorrido de integración.

## Arquitectura actual

Navegador (HTML/CSS/JavaScript) → API HTTP de Node.js → MySQL/MariaDB local.

El navegador usa `fetch`. El servidor valida sesión, rol y datos antes de guardar. MySQL2 ejecuta consultas parametrizadas; los nombres de tablas y columnas salen de una lista fija del proyecto.

El servidor carga los registros al iniciar y trabaja con una copia en memoria. Cada operación confirmada guarda el estado en una transacción SQL. Para este proyecto local se priorizó conservar el flujo anterior; no es una arquitectura para grandes volúmenes. Las solicitudes API se procesan en cola para evitar sobrescrituras. Un bloqueo de base impide abrir dos servidores SIAR sobre la misma base. No editar registros directamente en phpMyAdmin mientras SIAR está abierto.

Si falla una escritura, se revierte la transacción y se recupera el estado anterior en memoria. Si MySQL se detiene, se debe volver a iniciar MySQL y reiniciar SIAR.

## Datos

`users`: identidad, rol, estado, hash de contraseña y hash del código de recuperación.
`tables`: piso, capacidad y ocupación.
`products`: nombre, categoría, precio, disponibilidad y marca de eliminación.
`reservations`: mesa, cliente, personas, hora prevista, estado y usuario que registra.
`inventory`: insumo, unidad, existencia, mínimo y marca de eliminación.
`orders` y `orders_items`: encabezado y productos del pedido.
`movements`: entradas y salidas por insumo, con usuario y motivo.
`invoices` y `invoices_items`: comprobante y detalle de la venta.
`audit`: quién hizo cada operación.
`meta`: versión del estado guardado.

Los importes se guardan como enteros en centavos. Cantidades de insumos admiten tres decimales; los productos del pedido usan unidades enteras. Los detalles conservan nombre y precio históricos aunque después cambie el menú.

La eliminación es lógica: `deleted=true`. Se oculta el registro y se impide su uso futuro, conservando las relaciones y el historial. No se borran facturas emitidas.

## Acceso

Contraseñas con scrypt y una sal aleatoria por usuario. Sesiones de ocho horas en memoria y cookie HttpOnly/SameSite. Las sesiones no sobreviven al reinicio del servidor. Las escrituras autenticadas requieren token CSRF. Los permisos se validan en el servidor, además de ocultar enlaces.

Crear cuenta públicamente genera una solicitud inactiva con rol mesero. El primer administrador requiere un código de instalación mostrado en la consola local. La recuperación usa un código aleatorio de 128 bits guardado como hash SHA-256, se invalida al usarlo y entrega uno nuevo. El administrador puede emitir un código temporal de 15 minutos. No se integra correo electrónico.

Las credenciales SQL se configuran en `config.json` y no se sirven al navegador. La aplicación escucha únicamente en `127.0.0.1`; no está publicada en internet.

## Rutas principales

| Ruta | Operación |
|---|---|
| GET /api/setup | Indica si falta el primer administrador. |
| POST /api/register | Crear administrador inicial o solicitar cuenta pendiente. |
| POST /api/login, /api/logout | Entrar y salir. |
| POST /api/recover | Recuperar acceso con código. |
| POST /api/recovery-code | Renovar código propio verificando contraseña. |
| GET /api/me, /api/state | Sesión y datos permitidos para el rol. |
| POST /api/users | Crear usuario desde administración. |
| PUT / DELETE /api/users/:id | Editar o eliminar usuario. |
| POST /api/users/:id/recovery | Generar recuperación temporal. |
| POST /api/products | Crear producto. |
| PUT / DELETE /api/products/:id | Editar o eliminar producto. |
| POST /api/tables; PUT /api/tables/:id/details | Crear mesa o modificar piso/capacidad. |
| POST /api/reservations; POST /api/reservations/:id/action | Reservar, confirmar llegada o cancelar. |
| PUT /api/tables/:id | Cambiar ocupación con validación. |
| POST /api/orders; PUT /api/orders/:id | Crear y editar pedido. |
| POST /api/orders/:id/action | Enviar, preparar, marcar listo, entregar o cancelar. |
| POST /api/inventory | Crear insumo. |
| PUT / DELETE /api/inventory/:id | Editar o eliminar insumo. |
| POST /api/movements | Registrar entrada o salida. |
| POST /api/invoices/preview, /api/invoices | Calcular y emitir comprobante. |

## Dependencia y compatibilidad

Node.js 20 o superior; dependencia `mysql2` fijada en package-lock.json. Probado aquí con Node 24 y MariaDB 10.11. La conexión usa el protocolo MySQL y está preparada para MariaDB de XAMPP; la instalación Windows del usuario requiere comprobación local.

Fuentes técnicas consultadas: https://sidorares.github.io/node-mysql2/docs/examples/connections/create-connection y https://www.apachefriends.org/es/faq_windows.html.

## Patrones y responsabilidades

- **Repositorio:** `database/db.js` encapsula la lectura y el guardado SQL. La interfaz no ejecuta SQL.
- **Servicios:** `services` reúne reglas de validación, ventas y mesas para reutilizarlas desde rutas y pruebas.
- **Observador:** `Siar.listeners` en `shared.js` notifica a las pantallas cuando llegan datos actualizados.

Se aplican mediante módulos y funciones. No se afirma que todas las entidades sean clases JavaScript ni que se use un framework MVC. Las rutas siguen en `server.js` para conservar el punto de entrada anterior.

## Actualización de esquema

`npm run db:init` crea las tablas que faltan y consulta `information_schema.COLUMNS` antes de añadir `available`. Los productos anteriores quedan disponibles por defecto. No borra pedidos, cuentas ni facturas. Debe ejecutarse con SIAR detenido; el bloqueo SQL impide hacerlo mientras otro servidor usa la base.

## Diagramas

Fuentes Mermaid y versiones SVG en `docs/diagramas`: clases del dominio, casos de uso, secuencia de venta y arquitectura. El diagrama conceptual de clases describe los datos; la implementación utiliza objetos y funciones.
