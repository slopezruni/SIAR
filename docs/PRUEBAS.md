# Pruebas de la versión

| Tipo | Caso | Resultado observado |
|---|---|---|
| Unitaria | Convertir importes a centavos | OK: 15000.50 produce 1500050. |
| Unitaria | Rechazar importes inválidos | OK: negativos, texto y más de dos decimales se rechazan. |
| Unitaria | Validar cantidades y límites | OK: rechaza cero, exceso, fracciones cuando se requieren enteros y valores no numéricos. |
| Unitaria | Hash de contraseña | OK: la misma contraseña/sal coincide; otra sal cambia el hash. |
| Integración | Crear administrador inicial | OK: requiere código de instalación. |
| Integración | Solicitar cuenta | OK: queda inactiva y no acepta elegirse administrador. |
| Integración | Aprobar cuenta y asignar rol | OK: permite iniciar sesión después de activarla. |
| Integración | Permisos y CSRF | OK: rechaza operaciones sin sesión, rol o token correcto. |
| Integración | Recuperar contraseña | OK: código válido cambia contraseña, invalida sesión anterior y no puede reutilizarse. |
| Integración | Crear, editar y eliminar producto | OK: actualiza menú y conserva detalle de la factura anterior. |
| Integración | Crear y editar insumo | OK: guarda nombre, categoría y mínimo. |
| Integración | Eliminar insumo con existencias | OK: rechaza; permite eliminar después de registrar salida hasta cero. |
| Integración | Salida superior al stock | OK: rechaza sin dejar existencias negativas. |
| Integración | Dos pedidos activos en la misma mesa | OK: rechaza el segundo. |
| Integración | Pedido → cocina → entrega → factura | OK: cada rol completa su parte y la mesa queda libre al facturar. |
| Integración | Cálculo de factura | OK: 2 × $15000, descuento $1000 e impuesto 8% = $31320. |
| Integración | Pago insuficiente y factura duplicada | OK: ambas operaciones rechazadas. |
| Integración | Eliminar usuario | OK: desaparece de la lista e invalida sus sesiones. |
| Integración | Entradas concurrentes | OK: ambas entradas quedan registradas sin perder stock. |
| Integración | Reiniciar servidor | OK: conserva usuarios, factura y existencias en SQL. |
| Migración | Importar JSON v3 | OK: conserva usuario/contraseña, pedido y factura con detalle; no modifica el JSON. |
| Migración | Reimportar sobre base con datos | OK: rechaza para evitar mezclar registros. |
| Funcional en navegador | Crear cuenta e iniciar sesión | OK: formulario completo y código de recuperación visible una vez. |
| Funcional en navegador | CRUD de menú | OK: registrar, editar precio y eliminar desde los botones. |
| Funcional en navegador | Crear cajero y entrar | OK: abre Facturación y muestra únicamente ese módulo. |
| Funcional en navegador | Editar y eliminar insumo | OK: formulario guarda y la fila se retira. |
| Funcional en navegador | Recuperación desde login | OK: permite entrar con la nueva contraseña. |
| Interfaz | Ocho pantallas a 1366 y 390 px | OK: sin errores JavaScript ni desbordamiento horizontal de la página; tablas anchas tienen desplazamiento propio. |

## Cobertura y rendimiento medidos

- Líneas: **98,84%** (1023 de 1035).
- Ramas: **84,02%** (773 de 920).
- Funciones: **98,98%** (98 de 99).
- Incluye servidor, servicios, acceso SQL, inicialización/importación y todos los archivos JavaScript de la interfaz. Excluye dependencias, tests y el ejecutor de cobertura.
- Informe navegable: `../coverage/index.html`. Datos resumidos: `evidencias/cobertura.json`.
- En 70 solicitudes locales: máximo **50,57 ms** y promedio **12,97 ms**. Todas quedaron por debajo de 3 segundos en este ensayo. Datos: `evidencias/rendimiento.json`.

Estas mediciones no son una prueba de carga ni garantizan el mismo rendimiento en otro computador. La disponibilidad del 95% necesita observación durante un periodo acordado; no se declara cumplida con esta prueba corta.

## Repetir

- `npm.cmd test`: ocho casos unitarios, un recorrido de integración y una prueba de actualización/importación, con múltiples comprobaciones. Requiere MySQL y permisos para crear/eliminar una base de pruebas.
- Para comprobar visualmente, repite el flujo de venta descrito en LEEME y las acciones de usuarios, menú e inventario. El recorrido de navegador está en `tests/browser.cjs`. Se puede repetir instalando Chromium con `npx.cmd playwright install chromium` y ejecutando `npm.cmd run test:browser`.
- Para sustentar en tu equipo, captura los resultados de `npm.cmd test` y las pantallas del flujo usando datos ficticios.

## Casos agregados

| Tipo | Caso | Resultado |
|---|---|---|
| Integración / interfaz | Marcar producto agotado | OK: se muestra Agotado y se rechaza en pedidos nuevos. |
| Integración / interfaz | Crear y editar mesa | OK: persiste piso/capacidad y el plano permite grupos de más de 12. |
| Integración | Crear mesa sin rol administrador | OK: rechaza. |
| Integración / interfaz | Reservar mesa libre | OK: queda reservada, visible en amarillo. |
| Integración | Reserva duplicada y pedido en mesa reservada | OK: rechaza ambas operaciones. |
| Integración / interfaz | Cancelar reserva / confirmar llegada | OK: libera o marca ocupada según la acción. |
| Unitaria | Fecha pasada, cantidad inválida y capacidad excedida | OK: rechaza. |
| Migración | Base v4 sin campo available ni tabla reservations | OK: añade ambos y conserva los productos. |
| Migración | Inicialización repetida sobre datos importados | OK: conserva la factura y su detalle. |
| Funcional | Editar cantidad en pedido | OK: recalcula sin reconstruir el campo enfocado. |

El comando `npm.cmd run test:coverage` ejecutó los diez casos automatizados y el recorrido de navegador sin fallos. Conserva el informe HTML como evidencia, no solo la palabra OK.
