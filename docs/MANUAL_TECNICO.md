# Manual Técnico — Proyecto SIAR

**Sistema Integral de Administración para Restaurantes (SIAR)**  
**Institución:** Institución Universitaria Antonio José Camacho  
**Facultad:** Facultad de Ingenierías — Ingeniería de Sistemas  
**Asignatura:** Ingeniería de Software II  
**Versión:** SIAR V5  
**Año:** 2026  

**Autores:**  
* Santiago López Ramírez  
* José David Cárdenas Tovar  
* Nicole Segovia Cortes  

---

## Presentación

El presente Manual Técnico describe la forma en que está diseñado y construido el **Sistema Integral de Administración para Restaurantes (SIAR)**. Su propósito es ofrecer una guía clara y comprensible sobre la estructura interna de la aplicación, los patrones de diseño empleados, la comunicación entre las pantallas y el servidor, y la organización de la base de datos. Con este documento, cualquier integrante del equipo o futuro desarrollador podrá entender cómo funciona el sistema, cómo se conectan sus partes y cómo realizar ajustes o mejoras de manera ordenada.

---

## 1. Arquitectura

### Organización general en tres capas

Para la construcción de SIAR se adoptó una **arquitectura cliente-servidor organizada en tres capas**: capa de presentación, capa de lógica de negocio y capa de datos. Esta forma de dividir el sistema permite que cada parte cumpla una tarea específica sin mezclarse con las demás, cumpliendo con el requerimiento de mantener una separación clara entre la interfaz, las reglas del negocio y el almacenamiento de la información.

En términos sencillos, el recorrido de cualquier acción dentro de SIAR sigue un camino ordenado: los trabajadores del restaurante (administrador, mesero, cocinero y cajero) interactúan con las pantallas del navegador; esas pantallas envían sus solicitudes a la parte central del sistema, que verifica permisos y aplica las reglas del restaurante; finalmente, la capa de datos consulta o guarda la información en la base de datos y devuelve el resultado.

### Descripción de cada capa

**Capa de presentación:**  
Es la parte visible de SIAR, es decir, las pantallas y formularios con los que trabaja el personal del restaurante desde un computador, una tableta o un teléfono móvil. Su función principal es mostrar la información de manera clara, recibir los datos que escribe el usuario, enviar las peticiones al servidor y presentar las respuestas o avisos de error. Además, adapta las opciones visibles según el rol de quien haya iniciado sesión. Dentro del proyecto (`SIAR_v5`), esta capa se encuentra en la carpeta `public/`, donde están las páginas web de cada módulo (inicio de sesión, tablero principal, usuarios, menú, mesas y reservas, pedidos, cocina, inventario, facturación, reportes y registro de actividad), junto con sus estilos visuales y scripts de apoyo. Esta capa nunca modifica la base de datos directamente.

**Capa de lógica de negocio:**  
Constituye el núcleo de SIAR. Aquí es donde se toman las decisiones importantes del sistema: se comprueba que los datos recibidos estén completos y sean válidos, se verifica la identidad y el rol de cada usuario, se protegen las contraseñas de forma cifrada y se deja constancia de las acciones relevantes en el registro de auditoría. También controla las reglas propias del restaurante, como el cambio de estado de los pedidos, la disponibilidad de las mesas, el cálculo de impuestos y descuentos en la facturación y la preparación de la información para los reportes. En el proyecto, esta capa está implementada en el servidor principal (`server.js`) y organizada en archivos especializados dentro de la carpeta `services/` (como los servicios del restaurante, ventas y validaciones).

**Capa de datos:**  
Es la encargada de guardar, buscar, actualizar y desactivar la información del restaurante en la base de datos, manteniendo siempre la relación correcta entre los registros. Esta capa no decide si un usuario tiene permiso o si una regla de negocio se cumple; simplemente ejecuta las operaciones de almacenamiento y consulta que le solicita la lógica de negocio. En el proyecto se ubica en la carpeta `database/` (principalmente `db.js` y `schema.sql`), apoyada por utilidades de inicialización y migración ubicadas en la carpeta `scripts/`.

### Organización por módulos

Aunque el sistema se estructura en tres capas, sus funciones están agrupadas en módulos bien diferenciados para facilitar el trabajo del equipo y el mantenimiento futuro:

* **Usuarios y seguridad:** administra las cuentas del personal, la asignación de roles, el inicio de sesión, la recuperación de contraseña y el control de acceso.
* **Menú y productos:** gestiona el catálogo de platos y bebidas, sus categorías, precios y disponibilidad.
* **Mesas y reservas:** permite registrar mesas, controlar su capacidad, conocer si están libres, ocupadas o reservadas, y manejar las reservas de los clientes.
* **Pedidos y cocina:** cubre la toma de pedidos en mesa, los ajustes antes de cocinar, el envío a cocina y el seguimiento de la preparación.
* **Inventario:** lleva el control de los insumos del restaurante, sus cantidades actuales, las alertas de existencias mínimas y los movimientos manuales de entrada y salida.
* **Facturación y pagos:** genera las facturas de los pedidos atendidos, calcula impuestos y descuentos autorizados, registra los pagos y emite los comprobantes.
* **Reportes, dashboard y auditoría:** ofrece al administrador una vista general del día, consultas de ventas, productos más vendidos, consumo de insumos, ocupación de mesas, indicadores financieros y el historial de actividad del sistema.

### Flujo de una operación y estados de un pedido

Cuando un usuario realiza una acción, por ejemplo registrar un pedido, la pantalla envía los datos a la lógica de negocio. El servidor revisa que la sesión esté activa, confirma que el usuario tenga el rol adecuado y valida la información recibida. Luego solicita a la capa de datos que guarde el registro y actualiza los datos relacionados (como el estado de la mesa). Por último, responde a la pantalla para que el trabajador vea la confirmación.

En el caso particular de los pedidos, la lógica de negocio controla de forma estricta su recorrido para evitar confusiones entre el salón, la cocina y la caja: todo pedido inicia en estado **Pendiente**, pasa a **En preparación** cuando cocina lo toma, cambia a **Listo** al terminar de prepararse, luego a **Entregado** cuando el mesero lo lleva a la mesa y finaliza en **Facturado** al completarse el cobro. También existe el estado **Cancelado** para dejar constancia de aquellos pedidos que no continúan mientras todavía pueden anularse.

### Justificación y puesta en marcha

Se eligió esta arquitectura porque es fácil de entender e implementar, se ajusta de manera natural a la operación de un restaurante y permite crecer módulo por módulo sin volver complejo el sistema. Al separar la lógica del negocio de las pantallas, resulta mucho más sencillo probar las funciones principales, controlar los permisos en un solo lugar y desplegar la aplicación sin necesidad de dividirla en varios sistemas independientes.

Para facilitar su instalación y ejecución en equipos locales, el proyecto incluye un archivo de ejemplo de configuración (`config.example.json`), scripts de arranque rápido (`INSTALAR_SIAR.bat` e `INICIAR_SIAR.bat`), utilidades para preparar la base de datos y un conjunto de pruebas automatizadas en la carpeta `tests/` que permiten comprobar el correcto funcionamiento de los módulos y medir la cobertura de pruebas.

---

## 2. Patrones de Diseño

Para resolver problemas comunes durante el desarrollo de SIAR y mantener el código ordenado, se aplicaron tres patrones de diseño reconocidos, escogiendo uno de cada categoría principal: **Singleton** (creacional), **Facade** (estructural) y **Observer** (de comportamiento). Estos patrones se integran de forma sencilla en la arquitectura de tres capas y responden a necesidades concretas del restaurante.

### Patrón Singleton

El patrón Singleton asegura que exista una única instancia compartida de un componente mientras el sistema está en funcionamiento, evitando que se creen copias diferentes con información contradictoria.

En SIAR, este patrón se utiliza para administrar la información general que necesitan consultar varios módulos al mismo tiempo, especialmente los datos de la sesión actual (el usuario que inició sesión, su rol asignado y el estado de la sesión) y la configuración básica de la aplicación. Gracias a ello, todas las pantallas consultan la misma referencia para saber qué opciones mostrar y, cuando el usuario cierra sesión, esa información se limpia en un solo lugar. Es importante destacar que, por seguridad, este patrón sirve para organizar y compartir el estado, pero cada operación protegida siempre vuelve a verificar los permisos en el servidor.

### Patrón Facade (Fachada)

El patrón Facade ofrece un punto de entrada sencillo y unificado para ejecutar procesos que internamente requieren varios pasos y la coordinación de distintas partes del sistema. En lugar de obligar a la pantalla a comunicarse por separado con cada componente, la fachada recibe una sola solicitud y se encarga de coordinar todo el proceso.

En SIAR, este patrón resulta fundamental en dos procesos clave:

* **Registro de pedidos:** para guardar un pedido no basta con anotar un nombre; internamente el sistema debe consultar la mesa, revisar los productos del menú, comprobar que estén disponibles, crear el pedido, asociar los productos con sus cantidades, calcular el total y actualizar el estado de la mesa. La fachada reúne todos estos pasos en una única operación ordenada.
* **Facturación y pagos:** de forma similar, al cobrar una cuenta el sistema consulta el pedido, genera la factura, calcula impuestos, aplica descuentos si fueron autorizados, obtiene el valor final, registra el pago, prepara el comprobante y actualiza el pedido a estado Facturado.

Al centralizar estos flujos, se evita que una operación quede a medias, se simplifica el manejo de errores y se reduce la dependencia directa entre las pantallas y los detalles internos del servidor.

### Patrón Observer (Observador)

El patrón Observer permite que varias vistas o componentes se enteren automáticamente cuando cambia una información importante, sin necesidad de que estén fuertemente atados entre sí. Cuando un dato se actualiza, el sistema notifica el cambio para que las pantallas interesadas muestren la información al día.

En SIAR, su principal aplicación es la comunicación entre el salón, la cocina y la caja durante el ciclo de vida de un pedido. Cuando el mesero envía un pedido, la pantalla de cocina refleja la nueva orden; cuando el cocinero cambia el estado a **En preparación** o **Listo**, el mesero puede ver la actualización de inmediato para pasar a recoger los platos; y cuando el cajero registra el pago, el pedido aparece como **Facturado**. Este mismo enfoque apoya la actualización de otros cambios relevantes del restaurante, como la disponibilidad de productos en el menú, el estado de las mesas, las reservas, las alertas de inventario y las cifras que se muestran en el dashboard y los reportes.

---

## 3. API

### ¿Cómo se comunican las pantallas con el servidor?

En SIAR, la **API** cumple el papel de puente de comunicación entre la capa de presentación (lo que ve y usa el trabajador en el navegador) y la capa de lógica de negocio (el servidor en `server.js`). Cada vez que un usuario consulta una lista, crea un pedido, cambia un estado o genera una factura, el navegador envía una solicitud a través de esta API y recibe una respuesta estructurada en formato JSON, que es liviano y fácil de interpretar por la interfaz web.

### Seguridad, validaciones y manejo de respuestas

Toda la comunicación a través de la API se rige por reglas claras de protección y control:

* **Control de acceso por rol:** antes de ejecutar cualquier operación protegida, el servidor verifica que exista una sesión válida y comprueba si el rol del usuario (Administrador, Mesero, Cocinero o Cajero) tiene autorización para esa acción.
* **Protección de contraseñas:** al registrar usuarios, iniciar sesión o recuperar contraseñas, las claves nunca se almacenan ni se exponen como texto legible, sino de forma cifrada.
* **Validación de información:** todos los datos enviados desde los formularios pasan por comprobaciones previas para asegurar que estén completos y respeten las reglas del restaurante (por ejemplo, impedir modificar un pedido que ya fue facturado).
* **Registro de auditoría:** las acciones relevantes quedan guardadas con la identificación del usuario responsable y el momento en que se realizaron.

Cuando una solicitud se procesa correctamente, la API responde confirmando la operación y devolviendo los datos actualizados. Si ocurre algún inconveniente, devuelve un mensaje claro indicando la causa —por ejemplo, datos incompletos, credenciales inválidas, falta de permisos para el rol actual o que el registro buscado no existe— para que la pantalla pueda informar al usuario sin afectar la estabilidad del sistema.

### Servicios que ofrece la API por módulo

Las operaciones disponibles en la API están agrupadas según los módulos funcionales del sistema:

* **Autenticación y sesiones:** permite a los usuarios registrados iniciar sesión, consultar los datos de su sesión activa, recuperar su contraseña y cerrar sesión de forma segura.
* **Usuarios y roles:** reservado para el administrador; ofrece las operaciones para consultar el listado de trabajadores, registrar nuevos usuarios, modificar sus datos, cambiar su rol asignado y eliminar o desactivar cuentas.
* **Menú y productos:** permite consultar la carta del restaurante a todo el personal autorizado, mientras que el administrador cuenta con operaciones para crear productos, editar precios o descripciones, asignarlos a una categoría, cambiar su disponibilidad y desactivar los que ya no se ofrezcan.
* **Mesas y reservas:** permite al administrador crear y modificar mesas, y tanto al mesero como al administrador consultar el estado actual de cada mesa, registrar o cancelar reservas, confirmar la llegada de clientes y liberar mesas cuando queden disponibles.
* **Pedidos y cocina:** permite al mesero crear pedidos, agregar productos y cantidades, modificar o cancelar órdenes mientras sigan pendientes y enviarlas a cocina. Al cocinero le permite consultar los pedidos entrantes y actualizar su avance de preparación, mientras que todo el personal autorizado puede consultar el estado actual de cada orden.
* **Inventario:** proporciona operaciones para consultar los insumos existentes, identificar los que están por debajo del stock mínimo, registrar o editar insumos y anotar movimientos manuales de entradas y salidas.
* **Facturación y pagos:** orientado principalmente al cajero y al administrador; permite generar la factura correspondiente a un pedido, calcular impuestos, aplicar descuentos autorizados, registrar el pago completo y obtener la información del comprobante para mostrarlo o imprimirlo.
* **Reportes, dashboard y auditoría:** exclusivo para el administrador; entrega la información resumida del tablero principal (pedidos activos, reservas y alertas de inventario), las consultas de ventas por periodo, productos más vendidos, consumo de inventario, ocupación de mesas, indicadores financieros y el historial de actividad registrado por el sistema.

*(Nota: Los nombres literales de cada ruta interna pueden consultarse directamente en el archivo `server.js` del proyecto `SIAR_v5`.)*

---

## 4. Base de Datos

### Estructura general y modelo de datos

SIAR utiliza una **base de datos relacional** diseñada a partir del modelo entidad-relación y el diagrama de clases definidos en la etapa de análisis. Toda la estructura de tablas y relaciones está definida en el archivo `database/schema.sql` y es administrada por el módulo `database/db.js`. Este enfoque relacional garantiza que la información del restaurante permanezca ordenada, sin duplicados innecesarios y siempre conectada de forma coherente.

### Entidades principales y cómo se relacionan

La información almacenada en SIAR se organiza en torno a los siguientes grupos de datos:

* **Usuarios y roles:** la entidad **Rol** guarda los perfiles del sistema (Administrador, Mesero, Cocinero y Cajero) con su descripción, y se relaciona con **Usuario**, donde se almacenan el nombre, el correo, la contraseña cifrada y el estado de cada trabajador. Un rol puede estar asignado a muchos usuarios, pero cada usuario tiene un rol definido.
* **Mesas y reservas:** la entidad **Mesa** registra el número de cada mesa, su capacidad de personas y su estado actual. A ella se vincula **Reserva**, que almacena la fecha, la hora, la cantidad de personas, el estado de la reserva y el usuario que la gestionó.
* **Categorías y productos:** la entidad **Categoría de Producto** organiza el menú en grupos claros, y se relaciona con **Producto**, donde se guarda el nombre, la descripción, el precio y si se encuentra disponible o no para la venta.
* **Pedidos y su detalle:** la entidad **Pedido** almacena la fecha, el estado actual, las observaciones, el valor total, la mesa atendida y el usuario que registró la orden. Debido a que un pedido puede incluir varios platos o bebidas, se utiliza la entidad **Detalle de Pedido**, que conecta cada pedido con los productos solicitados, indicando la cantidad y el precio unitario correspondiente.
* **Facturación, descuentos y pagos:** cada pedido atendido se relaciona con una **Factura**, la cual guarda la fecha, el subtotal, el impuesto calculado, el descuento aplicado y el valor total. Cuando corresponde un beneficio comercial, la factura se vincula con **Descuento** (porcentaje y motivo). Finalmente, la entidad **Pago** registra la fecha, el monto y el medio de pago asociado a esa factura.
* **Inventario y movimientos:** la entidad **Inventario** conserva las existencias actuales y el stock mínimo de los insumos del restaurante. Cada vez que ingresa mercancía o se registra un consumo, se guarda un registro en **Movimiento de Inventario** indicando el tipo de movimiento (entrada o salida), la cantidad y la fecha.
* **Auditoría del sistema:** adicionalmente, la base de datos conserva un registro de las operaciones relevantes realizadas en el sistema, indicando qué usuario ejecutó la acción y en qué momento, con el fin de respaldar el seguimiento y la trazabilidad administrativa.

### Reglas clave de almacenamiento y cuidado de datos

Para asegurar la confiabilidad de la información a lo largo del tiempo, la base de datos de SIAR sigue varias reglas prácticas:

* **Conservación del historial de ventas:** cuando un producto deja de venderse en el restaurante, no se borra definitivamente de los registros históricos, sino que se desactiva para que las facturas y reportes antiguos mantengan sus datos intactos.
* **Precios históricos protegidos:** el detalle de cada pedido guarda el precio que tenía el producto en el momento de la compra; así, si el administrador cambia el precio en el menú más adelante, los pedidos y facturas pasados no se ven alterados.
* **Una factura y un pago por pedido:** el modelo está diseñado para mantener una relación clara de una factura por cada pedido y un pago completo por cada factura, evitando cobros duplicados o saldos confusos.
* **Reportes siempre actualizados:** los reportes no se guardan como copias fijas que puedan quedar desactualizadas, sino que se calculan al momento consultando directamente los datos reales de pedidos, facturas, mesas y movimientos de inventario.
* **Control manual de existencias:** en esta versión del sistema, las entradas y salidas de inventario se registran de forma manual por el personal autorizado, sin descontar ingredientes automáticamente a partir de recetas.

### Inicialización y migración de datos

Para facilitar la puesta en marcha y la evolución del sistema entre versiones, el proyecto cuenta con herramientas de apoyo dentro de la carpeta `scripts/`. El archivo `init-db.js` se encarga de preparar automáticamente la base de datos inicial a partir del esquema definido en `schema.sql`, dejando listas las tablas y los datos básicos necesarios para empezar a trabajar. Por su parte, `import-v3.js` permite trasladar datos provenientes de versiones anteriores del sistema hacia la versión actual (`SIAR_v5`), y su funcionamiento se verifica mediante pruebas dedicadas para asegurar que no se pierda información durante el proceso de actualización.