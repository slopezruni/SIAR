# Actualización 5.0
Lee primero **ACTUALIZAR_A_V5.md**. Mantiene los módulos anteriores y agrega Reportes, Dashboard y la agenda de Reservas.
La aplicación todavía es local. La publicación en Internet está pendiente.
Las evidencias de cobertura de la carpeta coverage corresponden a la versión 4.1, no a esta versión.
Consulta docs/PRUEBAS.md para las comprobaciones nuevas.
La documentación histórica de reserva básica se sustituye por docs/RESERVAS_REPORTES_DASHBOARD.md.

LINK DEL SERVIDOR:  https://siar-bhp8.onrender.com sigue funcional en web

# SIAR — versión 5.0 (entrega local para validar)

Aplicación local para administrar mesas, pedidos, cocina, inventario, facturación, menú y usuarios. Mantiene la interfaz azul y gris de la versión anterior. JavaScript en el navegador y Node.js en el servidor; datos en MySQL/MariaDB de XAMPP.

Si ya tienes la versión 4 con MySQL, lee primero **ACTUALIZAR_DESDE_V4.md**. No debes volver a importar el JSON.

## Instalación en Windows

1. Extrae todo el ZIP en una **carpeta nueva**. Conserva tu versión anterior y su carpeta `data` como respaldo.
2. Instala Node.js 20 o superior si todavía no lo tienes.
3. Abre XAMPP y pulsa **Start en MySQL**. Apache solo es necesario para usar phpMyAdmin; SIAR se abre con Node en el puerto 3000.
4. Copia `config.example.json` y llama a la copia `config.json`. Edita el puerto, usuario y contraseña de tu MySQL si son diferentes. El ejemplo usa `127.0.0.1`, puerto `3306`, usuario `root`, contraseña vacía y base `siar`. Es una configuración local de ejemplo, no una cuenta de SIAR.
5. Ejecuta `INSTALAR_SIAR.bat`. Descarga las dependencias y crea las tablas. La primera instalación necesita internet. No borra una base ya inicializada.
6. Decide si vas a **importar tu versión anterior** (sección siguiente) o comenzar sin tus registros anteriores.
7. Ejecuta `INICIAR_SIAR.bat` y abre `http://localhost:3000`.
8. Si comienzas sin importar, pulsa **Crear cuenta**. El primer administrador necesita el código que aparece en la ventana del servidor. Define tu usuario y contraseña, y guarda el código de recuperación que aparece después.

Desde PowerShell también puedes ejecutar, dentro de esta carpeta:

```powershell
Copy-Item config.example.json config.json
npm.cmd ci
npm.cmd run db:init
npm.cmd start
```

No sobrescribas un `config.json` que ya hayas configurado. Si algo falla, conserva el mensaje de la ventana: no cierres el error antes de leerlo.

## Conservar los datos de la versión 3

Haz la importación **antes de crear cuentas en la versión nueva**. Detén ambos servidores con Ctrl+C. Respalda el `data/siar.json` de tu carpeta anterior.

En PowerShell, dentro de la carpeta nueva:

```powershell
npm.cmd run importar -- "C:\ruta\a\SIAR_v3\data\siar.json"
npm.cmd start
```

Cambia la ruta del ejemplo por la real. Se conservan usuarios, contraseñas, mesas, productos, pedidos, inventario, movimientos, facturas y actividad. El archivo anterior no se modifica. Si la nueva base ya tiene usuarios u operaciones, la importación se rechaza: configura otra base vacía en `config.json` para no mezclar historiales.

Después de importar, entra con tu usuario anterior. Cada persona puede usar **Código de recuperación** en el menú lateral, confirmar su contraseña y guardar su código. El cajero se crea desde Usuarios; no se agrega automáticamente una cuenta con contraseña conocida.

## Usuarios y recuperación

- **Crear cuenta**, desde el login: solicita una cuenta pendiente. No permite elegirse administrador. Un administrador la activa y asigna el rol desde Usuarios → Editar.
- **Usuarios → Nuevo usuario**: el administrador crea una cuenta activa y asigna el rol. Entrega la contraseña inicial y el código de recuperación solo al dueño.
- **Usuarios → Editar**: cambia nombre, rol y estado. El nombre de usuario se conserva para identificar el historial. La persona debe iniciar sesión otra vez después de una edición.
- **Usuarios → Eliminar**: desactiva y oculta la cuenta; conserva su historial e invalida sus sesiones. No permite eliminar o desactivar tu propia cuenta ni dejar el sistema sin administrador activo.
- **Olvidé mi contraseña**: introduce usuario, código y nueva contraseña. El código sirve una vez; después se muestra uno nuevo que debes guardar.
- **Recuperar acceso**, en Usuarios: el administrador genera un código temporal de 15 minutos. Reemplaza el código anterior. No envía correos automáticamente.
- Si el único administrador pierde la contraseña y también su código, no hay recuperación automática: conserva el código y un respaldo de la base.

| Rol | Acceso |
|---|---|
| Administrador | Todos los módulos y gestión de cuentas. |
| Cajero | Facturación de pedidos entregados e historial de comprobantes. |
| Mesero | Mesas, crear/editar pedidos antes de enviarlos, enviar y entregar. |
| Cocinero | Cocina e inventario. |

## Menú e inventario

**Menú:** registrar, listar, editar, eliminar y marcar productos disponibles o agotados. El precio se escribe en pesos colombianos. Un cambio afecta nuevos pedidos; los pedidos y comprobantes existentes conservan sus valores. Eliminar retira el producto del menú sin borrar el historial.

**Inventario:** registrar, listar, editar nombre/categoría/mínimo y eliminar insumos. Para cambiar existencias se registran entradas o salidas. Para eliminar, la existencia debe quedar en cero mediante una salida con motivo. La unidad no se cambia después de crear el insumo. Eliminar conserva los movimientos anteriores.

Las salidas de ingredientes siguen siendo manuales; no hay recetas que descuenten automáticamente por pedido.

## Mesas y reserva básica

El administrador puede crear mesas y modificar piso/capacidad cuando están libres. Mesero y administrador pueden reservarlas, confirmar la llegada o cancelar. La reserva aparta la mesa desde ahora, no solo durante el horario indicado. Una mesa reservada se muestra en amarillo y no acepta pedidos hasta confirmar la llegada. Los pisos con más de 12 mesas se muestran en grupos con Anterior/Siguiente.

## Venta completa

1. Mesero: elige mesa, crea pedido, agrega productos y guarda.
2. Mesero: pulsa Enviar a cocina.
3. Cocinero: Iniciar preparación y Marcar listo.
4. Mesero: Entregar.
5. Cajero o administrador: selecciona el pedido entregado, completa cliente, revisa cantidades/precios/descuento/impuesto y registra el pago.
6. Se guarda el comprobante, se marca Facturado y se libera la mesa.

El pago es un registro manual. No realiza cobros bancarios. El comprobante es académico y no tiene validez fiscal ni integración con DIAN.

## Guardado y respaldo

Las operaciones confirmadas se guardan en la base configurada. Reiniciar Node o MySQL conserva los registros; requiere iniciar sesión otra vez. Ya no se escribe `data/siar.json`.

Para respaldar, detén SIAR, abre phpMyAdmin desde XAMPP, selecciona la base `siar` (o el nombre elegido) y usa Exportar → SQL. Guarda también tu `config.json` por separado. No compartas el respaldo si contiene datos personales o credenciales.

Mantén abierta la ventana de Node mientras uses SIAR. No copies la aplicación a `htdocs`: puedes dejarla en Documentos y abrirla en el puerto 3000.

## Pruebas incluidas

Con MySQL encendido y la conexión configurada:

```powershell
npm.cmd test
```

Las pruebas de integración crean una base temporal `siar_test_...` y la eliminan al terminar. El usuario de MySQL necesita permiso para crear y eliminar esa base de pruebas. No reemplazan tu base `siar`.

Para pruebas de navegador y cobertura (instala Chromium una sola vez):

```powershell
npx.cmd playwright install chromium
npm.cmd run test:coverage
```

El comando mide servidor, servicios, acceso SQL, scripts de inicialización/importación y JavaScript de la interfaz. Genera `coverage/index.html` y exige al menos 70% de líneas. Las dependencias, los propios tests y el ejecutor de cobertura no forman parte de esa métrica.

Más detalles: `docs/MANUAL_TECNICO.md`, `docs/PRUEBAS.md` y los diagramas SVG en `docs/diagramas`.
