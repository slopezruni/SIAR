# Manual de Usuario — Proyecto SIAR

**Sistema Integral de Administración para Restaurantes (SIAR)**

**Institución:** Institución Universitaria Antonio José Camacho  
**Facultad:** Facultad de Ingenierías — Ingeniería de Sistemas  
**Asignatura:** Ingeniería de Software II  
**Versión:** SIAR v5  
**Año:** 2026  

**Autores:**
* Santiago López Ramírez
* José David Cárdenas Tovar
* Nicole Segovia Cortes

---

## Presentación

Bienvenido al **Manual de Usuario de SIAR**. Esta guía está pensada para ayudar al personal del restaurante a utilizar la aplicación web de forma sencilla, ordenada y sin complicaciones en el trabajo diario.

SIAR es una aplicación web responsiva, lo que significa que puede utilizarse cómodamente desde un computador, una tableta o un teléfono móvil a través del navegador de Internet. Para mantener el orden y proteger la información del negocio, cada trabajador accede únicamente a las pantallas y funciones que corresponden a su rol:

* **Administrador:** gestiona usuarios, roles, menú, mesas e inventario, y consulta el tablero principal y los reportes del restaurante.
* **Mesero:** consulta el estado de las mesas, gestiona reservas, registra pedidos, los envía a cocina y realiza su seguimiento hasta la entrega.
* **Cocinero:** consulta los pedidos que llegan al área de cocina y actualiza su estado a medida que los prepara.
* **Cajero:** prepara las facturas de los pedidos atendidos, aplica impuestos y descuentos autorizados, registra los pagos y entrega los comprobantes a los clientes.

A continuación se explica, paso a paso, cómo utilizar los cinco módulos principales del sistema.

---

## 1. Login (Inicio de sesión y acceso al sistema)

El módulo de **Login** es la puerta de entrada a SIAR. Permite verificar la identidad de cada trabajador antes de mostrar las herramientas correspondientes a su cargo.

### Cómo iniciar sesión

1. Abre el navegador web e ingresa a la dirección donde se encuentra publicado SIAR. El sistema mostrará automáticamente la pantalla de inicio de sesión.
2. Escribe tu correo electrónico o dato de acceso registrado y tu contraseña en los campos correspondientes.
3. Haz clic en el botón **Iniciar sesión**.
4. Si tus datos son correctos, el sistema validará tu cuenta y te llevará a la pantalla principal, mostrando en el menú únicamente las opciones habilitadas para tu rol.

**¿Qué ocurre si hay un error al ingresar?**  
Si el correo o la contraseña no coinciden, o si la cuenta se encuentra inactiva, el sistema mostrará un aviso indicando que no fue posible iniciar sesión. En ese caso, verifica que no tengas activada la tecla de mayúsculas e intenta nuevamente. Si el inconveniente persiste, comunícate con el administrador del restaurante.

### Cómo recuperar tu contraseña

Si tienes una cuenta registrada pero olvidaste tu clave de acceso, puedes restablecerla siguiendo estos pasos:

1. En la pantalla de inicio de sesión, selecciona la opción **Recuperar contraseña**.
2. Ingresa la información de tu cuenta que solicita el sistema para verificar tu identidad.
3. Una vez validada la solicitud, escribe tu nueva contraseña y confírmala.
4. El sistema guardará la nueva clave de forma segura (cifrada) y te mostrará un mensaje de confirmación. A partir de ese momento podrás ingresar con tu nueva contraseña.

### Cómo cerrar sesión

Al finalizar tu turno, o si compartes el computador o la tableta con otros compañeros, utiliza siempre la opción **Cerrar sesión** ubicada en la barra de navegación. Esto limpia los datos de tu sesión activa y evita que otra persona realice operaciones con tu usuario.

---

## 2. Pedidos

El módulo de **Pedidos** organiza el recorrido completo de lo que solicita cada mesa, facilitando la comunicación entre el salón, la cocina y la caja para evitar olvidos o demoras.

### Estados de un pedido

Para que todo el personal sepa en qué punto se encuentra cada orden, SIAR maneja los siguientes estados:

* **Pendiente:** el pedido acaba de ser registrado y todavía puede revisarse o ajustarse.
* **En preparación:** el cocinero ya recibió el pedido y está preparando los platos.
* **Listo:** la preparación terminó y el pedido puede recogerse en cocina para llevarlo a la mesa.
* **Entregado:** el mesero ya entregó los productos a los clientes en la mesa.
* **Facturado:** el cajero ya registró el pago de la cuenta y el proceso finalizó.
* **Cancelado:** el pedido fue anulado antes de continuar su atención y queda guardado únicamente como registro.

### Cómo crear un pedido y agregar productos (Mesero)

Antes de tomar una orden, el mesero puede revisar en el módulo de mesas cuáles se encuentran disponibles u ocupadas. Luego, para registrar el pedido:

1. Ingresa al módulo **Pedidos** desde el menú principal.
2. Selecciona la opción para **Crear pedido**.
3. Elige la mesa correspondiente y, si es necesario, agrega alguna observación especial solicitada por el cliente.
4. Selecciona los productos disponibles del menú e indica la cantidad de cada uno. El sistema mostrará únicamente los productos que se encuentren habilitados para la venta.
5. Revisa el resumen de los productos agregados y el valor calculado, y confirma la operación para guardar el pedido. El pedido quedará registrado en estado **Pendiente**.

### Cómo modificar o cancelar un pedido (Mesero)

Si el cliente decide cambiar algún plato o cancelar su orden mientras el pedido sigue en estado **Pendiente**:

1. Busca el pedido en el listado del módulo **Pedidos** y selecciónalo.
2. Elige la opción **Modificar** si deseas agregar, quitar o ajustar cantidades de productos, y guarda los cambios.
3. Elige la opción **Cancelar** si el pedido no continuará, y confirma la cancelación cuando el sistema lo solicite.

Si el pedido ya avanzó a una etapa en la que no se permite modificarlo o cancelarlo, el sistema te informará el motivo y conservará la información actual sin cambios.

### Cómo enviar un pedido a cocina (Mesero)

1. Una vez verificado que el pedido está completo, selecciónalo en la lista de pedidos.
2. Haz clic en la opción **Enviar a cocina**.
3. El sistema procesará el envío y el pedido aparecerá automáticamente en la pantalla del área de cocina para que pueda ser preparado.

### Cómo atender pedidos en cocina (Cocinero)

1. Ingresa al módulo **Cocina**, donde podrás ver los pedidos enviados por los meseros con el detalle de los productos y sus cantidades.
2. Al comenzar a cocinar una orden, cambia su estado a **En preparación**.
3. Cuando los platos estén terminados, actualiza el estado a **Listo**. De inmediato, el mesero podrá ver el cambio en su pantalla para pasar a recoger la orden.

### Cómo consultar el estado y registrar la entrega (Mesero)

1. Desde el módulo **Pedidos**, revisa la lista para identificar los pedidos que cambiaron a estado **Listo**.
2. Después de llevar los productos a la mesa del cliente, actualiza el estado del pedido a **Entregado**.
3. A partir de ese momento, el pedido quedará listo para que el cajero realice la facturación. Una vez pagado, su estado cambiará automáticamente a **Facturado**.

---

## 3. Inventario

El módulo de **Inventario** permite llevar un control ordenado de los insumos del restaurante, conocer cuántas existencias quedan disponibles y detectar a tiempo qué productos necesitan comprarse de nuevo.

### Cómo consultar las existencias y alertas

1. Ingresa al módulo **Inventario** desde el menú principal.
2. En la pantalla principal verás el listado de todos los insumos registrados, junto con su cantidad disponible actual y la cantidad mínima recomendada (stock mínimo).
3. Presta especial atención a los insumos que aparezcan marcados por debajo del mínimo; estas alertas te ayudan a planear las compras antes de que un ingrediente se agote durante el servicio.

### Cómo registrar o editar un insumo

1. Para agregar un nuevo insumo al control del restaurante, selecciona la opción de **Nuevo insumo** (o el formulario de registro disponible en el módulo).
2. Completa los datos solicitados, como el nombre del insumo, la cantidad inicial disponible y el stock mínimo que deseas controlar.
3. Confirma para guardar el registro; el insumo aparecerá de inmediato en el listado.
4. Si necesitas corregir algún dato o ajustar el mínimo requerido de un insumo ya existente, selecciona la opción **Editar** junto a ese registro, realiza el cambio y guarda la actualización.

### Cómo registrar entradas y salidas de inventario

En SIAR, los movimientos de inventario se anotan de forma manual para llevar un registro claro tanto de las compras como del consumo del restaurante (en esta versión el sistema no descuenta ingredientes automáticamente a partir de recetas).

1. Dentro del módulo **Inventario**, selecciona el insumo sobre el cual vas a registrar un movimiento.
2. Elige el tipo de movimiento correspondiente:
   * **Entrada:** utilízala cuando lleguen compras o reposiciones de insumos al restaurante.
   * **Salida:** utilízala para registrar el consumo diario o el retiro de insumos utilizados en cocina.
3. Escribe la cantidad exacta que entra o sale y confirma la operación.
4. El sistema actualizará automáticamente la existencia disponible del insumo y guardará el movimiento con su fecha para futuras consultas en los reportes.

---

## 4. Facturación

El módulo de **Facturación** está diseñado para que el **Cajero** cobre las cuentas de forma rápida y sin errores de cálculo. El sistema trabaja bajo una regla clara: se genera **una factura por cada pedido** y se registra **un pago completo por cada factura**.

### Cómo preparar una factura, calcular impuestos y aplicar descuentos

1. Ingresa al módulo **Facturación**.
2. Busca y selecciona el pedido que el cliente desea pagar. El sistema cargará automáticamente los productos consumidos y el subtotal correspondiente.
3. Haz clic en la opción **Generar factura**. El sistema calculará de manera automática los impuestos establecidos y mostrará el valor total a pagar.
4. Si el cliente cuenta con un **descuento autorizado**, selecciona la opción de descuento, ingresa el porcentaje y el motivo correspondiente, y confirma. El sistema recalculará y actualizará el valor final de la factura de inmediato.

Si por alguna razón la factura, el impuesto o el descuento no pueden procesarse (por ejemplo, por datos inválidos o porque el pedido ya fue facturado), el sistema te avisará mediante un mensaje en pantalla.

### Cómo registrar el pago y emitir el comprobante

1. Con la factura ya generada y verificada frente al cliente, selecciona la opción **Registrar pago**.
2. Selecciona el medio de pago utilizado por el cliente y verifica que el monto corresponda al valor total de la factura.
3. Confirma la operación. El sistema guardará el pago asociado a esa factura y actualizará el estado del pedido a **Facturado**.
4. Finalmente, haz clic en **Emitir comprobante** (o en la opción de imprimir/visualizar comprobante). El sistema generará el recibo con el detalle de la venta para que puedas consultarlo, imprimirlo y entregarlo al cliente como constancia de su pago.

---

## 5. Reportes

El módulo de **Reportes** y el **Dashboard** están pensados para el **Administrador**, reuniendo toda la información registrada durante la operación diaria para facilitar la revisión y la toma de decisiones del negocio.

### Uso del Dashboard (Resumen general)

Al ingresar a la pantalla de **Dashboard**, el administrador obtiene en un solo vistazo el estado general del restaurante sin necesidad de abrir cada módulo por separado. En este tablero se presenta información clave como:

* Los **pedidos activos** que se encuentran en curso.
* Las **reservas** registradas para el servicio.
* Las **alertas de inventario** que indican qué insumos están por debajo de su existencia mínima.

### Consulta de reportes detallados

Para analizar información más específica, ingresa al módulo **Reportes** desde el menú principal. Allí podrás elegir entre las siguientes consultas:

* **Ventas por periodo:** selecciona el rango de fechas que deseas analizar (por ejemplo, un día, una semana o un mes) para revisar el total vendido y las facturas registradas en ese lapso.
* **Productos más vendidos:** permite identificar cuáles son los platos y bebidas con mayor demanda entre los clientes, ayudando a planear compras y promociones.
* **Consumo de inventario:** muestra cómo se han utilizado los insumos a partir de los movimientos registrados, facilitando el control de gastos y reposiciones.
* **Ocupación de mesas:** presenta información sobre el uso de las mesas del restaurante para conocer el movimiento del salón.
* **Indicadores financieros:** ofrece un resumen de las cifras financieras calculadas con base en las ventas, impuestos, descuentos y pagos registrados en el sistema.

**¿Qué sucede si no hay datos en el periodo seleccionado?**  
Si eliges un rango de fechas o una consulta para la cual todavía no existen ventas, movimientos o registros guardados, el sistema te informará de manera clara que no hay datos disponibles para mostrar, permitiéndote ajustar el filtro y realizar una nueva búsqueda.

---

## Recomendaciones generales para el uso diario

* **Verifica siempre tus datos antes de confirmar:** especialmente al enviar un pedido a cocina o al registrar un pago, ya que algunas operaciones modifican el estado de la orden de forma definitiva.
* **Mantén actualizado el inventario y la disponibilidad del menú:** registrar a tiempo las entradas y salidas de insumos y desactivar los platos agotados evita que los meseros ofrezcan productos que no se pueden preparar.
* **Cuida tu usuario y contraseña:** no compartas tus credenciales con otros compañeros; recuerda que el sistema conserva un registro de auditoría donde queda constancia de quién realizó cada operación importante.