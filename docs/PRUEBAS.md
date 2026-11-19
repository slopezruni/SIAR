# Pruebas 5.0
Comprobaciones del 18 de noviembre de 2026.

| Tipo | Alcance | Resultado |
|---|---|---|
| Unitarias anteriores | Importes, cantidades, contraseña, mesas, productos y facturación | 8 aprobadas |
| Unitarias nuevas | Solapamientos, intervalos contiguos, edición, duración, estado por horario, llegada, agregación de ventas, CSV | 8 aprobadas |
| DOM con API simulada | Formulario de crear/editar/cancelar reserva, reportes con fechas inválidas y dashboard | Aprobado |
| Sintaxis | JavaScript de aplicación y pruebas | Verificado |
| Integración real MySQL | Migración endAt y persistencia de nuevas operaciones | Pendiente de ejecutar |
| Navegador real | Diseño visual, recorridos con base real, descarga | Pendiente de ejecutar |
| Internet | HTTPS, sesiones, acceso público | No desplegado |

El ensayo DOM comprueba eventos y contenido HTML, no demuestra persistencia SQL ni diseño visual.
No usar la cobertura 98,84% de v4.1 como cobertura de v5.0.
Los archivos coverage y docs/historico-v4-1 conservan evidencia anterior.

## Repetir pruebas
Desde la carpeta del proyecto:
- npm.cmd ci
- node --test tests/unit.test.js tests/final-modules.test.js
- npm.cmd test (requiere MySQL accesible; usa bases temporales)
- npx.cmd playwright install chromium
- npm.cmd run test:browser
- npm.cmd run test:coverage

Las suites de integración y navegador se actualizaron para la agenda nueva, pero no se ejecutaron contra MySQL en esta entrega.
Antes de sustentar, recorrer los módulos nuevos en XAMPP y guardar el resultado real.
