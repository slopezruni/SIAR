# Informe Final — Proyecto SIAR

**Sistema Integral de Administración para Restaurantes (SIAR)**

**Institución:** Institución Universitaria Antonio José Camacho  
**Facultad:** Facultad de Ingenierías — Ingeniería de Sistemas  
**Asignatura:** Ingeniería de Software II  
**Versión entregada:** SIAR v5  
**Año:** 2026  

**Autores:**
* Santiago López Ramírez
* José David Cárdenas Tovar
* Nicole Segovia Cortes
* Gloria Johanna Chala Torres

---

## 1. Introducción

La operación diaria de un restaurante exige coordinar al mismo tiempo muchas actividades que dependen unas de otras: recibir a los clientes, revisar qué mesas están disponibles, tomar pedidos, enviar las órdenes a la cocina, controlar las existencias de insumos, administrar reservas y realizar los cobros en caja. Cuando esta información se lleva en papel o en registros separados, es muy frecuente que surjan desórdenes que afectan tanto al personal como a los comensales: pedidos que llegan incompletos a cocina, productos agotados que se siguen ofreciendo, cruces en las reservas, errores en las cuentas y poca claridad para el administrador al momento de revisar las ventas o planear compras.

Con el fin de ofrecer una solución práctica a estas dificultades y aplicar los conocimientos de la asignatura **Ingeniería de Software II**, se planteó y desarrolló el **Sistema Integral de Administración para Restaurantes (SIAR)**. El proyecto tuvo como objetivo general construir una aplicación web que centralice en un mismo lugar la información de usuarios, menú, mesas, reservas, pedidos, inventario, facturación y reportes, permitiendo que cada trabajador acceda únicamente a las funciones propias de su cargo y trabaje siempre con datos actualizados.

El presente informe recoge el recorrido completo del proyecto durante el periodo académico 2026, describiendo la metodología de trabajo aplicada, la forma en que se desarrolló el sistema hasta su versión final (`SIAR v5`), los resultados alcanzados frente a los objetivos y requerimientos propuestos, las conclusiones obtenidas y las oportunidades de mejora proyectadas como trabajo futuro.

---

## 2. Metodología

Para llevar adelante el proyecto SIAR de manera organizada y controlada, el equipo trabajó bajo una **metodología iterativa e incremental**, avanzando por entregas progresivas que permitieron analizar y diseñar primero, construir las funciones centrales después y cerrar con los módulos analíticos, la optimización y el despliegue. El cronograma se ejecutó entre el **27 de agosto y el 12 de noviembre de 2026**, dividido en tres cortes evaluativos:

### Primer Corte (30%): Documentación, requerimientos y diseño (27 de agosto al 7 de octubre)

En esta primera etapa no se comenzó a programar de inmediato; el esfuerzo se concentró en entender bien el problema y definir con claridad qué debía hacer el sistema. Se elaboró el documento de inicio (problema, justificación, objetivos, alcance y cronograma), se levantaron las **19 historias de usuario (HU-01 a HU-19)**, los **19 casos de uso (CU-01 a CU-19)** y los requerimientos funcionales y no funcionales. A partir de esa base se construyeron los diagramas de casos de uso, el diagrama de clases y el modelo entidad-relación, y se definió el diseño del sistema apoyado en una arquitectura de tres capas y tres patrones de diseño (Singleton, Facade y Observer).

### Segundo Corte (30%): Desarrollo y consolidación funcional (8 de octubre al 4 de noviembre)

Con el diseño aprobado, se pasó a la construcción de los módulos esenciales que sostienen la operación diaria del restaurante: usuarios y roles, menú, mesas, pedidos, flujo de cocina, inventario y facturación. En paralelo se diseñaron y ejecutaron pruebas unitarias, de integración y funcionales, recopilando los resultados en una matriz de pruebas y actualizando la documentación técnica preliminar. Este corte culminó con la demostración funcional del ciclo principal de atención: **Cliente → Pedido → Cocina → Factura**.

### Tercer Corte (40%): Desarrollo final y entrega (5 al 12 de noviembre)

En la etapa de cierre se completaron los módulos finales del sistema —**reportes, dashboard y reservas**—, se realizó una jornada de optimización orientada a refactorizar el código, revisar el rendimiento y corregir hallazgos detectados en las pruebas, y se preparó el despliegue web de la aplicación. Finalmente, se consolidó toda la documentación definitiva: Manual Técnico, Manual de Usuario e Informe Final, junto con la preparación de la sustentación y demostración en vivo.

### Prácticas de control y calidad

A lo largo de los tres cortes se aplicaron dos prácticas fundamentales para mantener el orden del proyecto: el uso obligatorio de **Git** para conservar el historial de cambios y avances entre versiones (pasando por `v3`, `v4` y la entrega definitiva `SIAR v5`), y la verificación continua mediante pruebas automatizadas y medición de cobertura de código.

---

## 3. Desarrollo

El desarrollo de SIAR permitió transformar todos los documentos y diagramas del primer corte en una aplicación web completa y usable (`SIAR v5`). El sistema fue construido respetando la **arquitectura cliente-servidor en tres capas**, lo cual facilitó dividir el trabajo por módulos y mantener separadas las pantallas, las reglas del restaurante y el almacenamiento de datos.

### Estructura implementada

* **Interfaz de usuario (Capa de presentación):** se crearon páginas web dedicadas y responsivas para cada área del restaurante dentro de la carpeta `public/`: inicio de sesión (`login.html`), página principal y tablero resumen (`index.html` y `dashboard.html`), gestión de usuarios (`usuarios.html`), catálogo de productos (`menu.html`), mesas y reservas (`reservas.html`), toma de pedidos (`pedidos.html`), pantalla de cocina (`cocina.html`), control de insumos (`inventario.html`), cobros y recibos (`facturacion.html`), reportes (`reportes.html`) y consulta de auditoría (`actividad.html`). La interfaz adapta sus opciones según el rol del usuario autenticado (Administrador, Mesero, Cocinero o Cajero) y puede utilizarse en distintos tamaños de pantalla.
* **Lógica de negocio y seguridad:** en el servidor (`server.js`) y en los módulos de servicio (`services/restaurant.js`, `services/sales.js` y `services/validation.js`) se centralizaron todas las reglas operativas: validación de formularios, cifrado de contraseñas, control de acceso por roles, registro de auditoría, cálculo de impuestos y descuentos, y control del recorrido de los pedidos (`Pendiente` → `En preparación` → `Listo` → `Entregado` → `Facturado`, además del estado `Cancelado`).
* **Base de datos y evolución entre versiones:** la persistencia se implementó sobre un modelo relacional definido en `database/schema.sql` y gestionado desde `database/db.js`. Para facilitar la puesta en marcha y la continuidad del proyecto, se incorporaron herramientas para inicializar la base de datos (`scripts/init-db.js`), migrar información desde versiones anteriores (`scripts/import-v3.js`) y automatizar la instalación e inicio local (`INSTALAR_SIAR.bat` e `INICIAR_SIAR.bat`).

### Aplicación de patrones y aseguramiento de calidad

Durante la programación se aplicaron de manera práctica los tres patrones definidos en el diseño: **Singleton** para centralizar la sesión activa y la configuración compartida; **Facade** para coordinar en un solo flujo procesos con varios pasos como la creación de pedidos y la facturación; y **Observer** para mantener sincronizada la información de estados entre meseros, cocineros, caja y tablero administrativo.

Para comprobar que cada módulo respondiera correctamente antes de la entrega final, se estructuró un conjunto de pruebas automatizadas en la carpeta `tests/`, abarcando pruebas unitarias (`unit.test.js`), funcionales (`functional.test.js`), de los módulos finales (`final-modules.test.js`), de migración de datos (`migration.test.js`) y de comportamiento en navegador (`browser.cjs`), complementadas con reportes de cobertura y rendimiento. Finalmente, el sistema fue preparado y publicado para su acceso en línea `[Insertar plataforma y URL funcional del despliegue]`.

---

## 4. Resultados

Al concluir el desarrollo y las validaciones de `SIAR v5`, el proyecto alcanzó los objetivos propuestos y dio respuesta a los requerimientos funcionales y no funcionales planteados al inicio de la asignatura:

### Cumplimiento funcional

* **Gestión integral del flujo del restaurante:** se logró integrar en una sola aplicación todo el ciclo de servicio, desde la gestión del personal y el menú hasta la asignación de mesas y reservas, el envío de pedidos a cocina, la actualización de estados, el registro manual de entradas y salidas de inventario, la emisión de facturas con impuestos y descuentos, y la consulta de reportes gerenciales.
* **Trabajo organizado por roles:** cada perfil del restaurante (Administrador, Mesero, Cocinero y Cajero) dispone únicamente de las pantallas y acciones que necesita para su labor diaria, evitando accesos indebidos y reduciendo errores operativos.
* **Visibilidad para el administrador:** el tablero principal (`dashboard.html`) y el módulo de reportes (`reportes.html`) permiten consultar de forma rápida ventas por periodo, productos más vendidos, consumo de inventario, ocupación de mesas, indicadores financieros y alertas de insumos por debajo del stock mínimo.

### Cumplimiento de atributos de calidad

* **Diseño adaptable y facilidad de uso (RNF01):** las pantallas responden adecuadamente en computadores, tabletas y teléfonos sin dificultar las tareas principales.
* **Disponibilidad y tiempo de respuesta (RNF02 y RNF03):** el sistema fue evaluado frente a la meta de disponibilidad mínima del 95% y tiempos de respuesta inferiores a 3 segundos `[Completar con el dato exacto registrado en docs/evidencias/rendimiento.json y el seguimiento del despliegue]`.
* **Seguridad y trazabilidad (RNF04, RNF05 y RNF06):** las contraseñas se almacenan de manera cifrada, cada acción protegida valida el rol del usuario en el servidor y las operaciones relevantes quedan registradas en la vista de actividad para fines de auditoría.
* **Arquitectura, control de versiones y pruebas (RNF07, RNF08 y RNF09):** el proyecto conserva una separación clara en tres capas, mantiene su historial de evolución en Git `[Insertar enlace al repositorio Git]` y cuenta con evidencias de pruebas automatizadas y cobertura frente a la meta mínima del 70% `[Completar con el porcentaje exacto reportado en docs/evidencias/cobertura.json]`.
* **Documentación completa (RNF10):** se consolidó el paquete documental completo del proyecto, incluyendo los documentos de análisis y diseño, diagramas actualizados (`docs/diagramas/`), Manual Técnico, Manual de Usuario y el presente Informe Final.

---

## 5. Conclusiones

1. **Centralizar la información mejora la coordinación:** la construcción de SIAR confirmó que reunir en un solo sistema las actividades de salón, cocina, inventario, caja y administración elimina la dependencia de registros dispersos y facilita que todo el personal trabaje con información actualizada y coherente.
2. **La etapa de análisis y diseño ahorra problemas al programar:** haber dedicado el primer corte a redactar con detalle las historias de usuario, los casos de uso, los requerimientos y los diagramas permitió desarrollar cada módulo en los cortes siguientes con un rumbo claro y sin contradicciones en las reglas del negocio.
3. **Una arquitectura sencilla y bien organizada es suficiente y efectiva:** la arquitectura cliente-servidor en tres capas, apoyada en los patrones Singleton, Facade y Observer, resultó totalmente adecuada para el tamaño y alcance del proyecto. Facilitó dividir tareas entre los integrantes del equipo, aislar las reglas críticas para probarlas y evolucionar el software de forma ordenada hasta la versión `SIAR v5`.
4. **La calidad se respalda con pruebas y trazabilidad:** incorporar pruebas automatizadas, control de versiones con Git, protección de contraseñas, control por roles y registro de auditoría elevó la confiabilidad del sistema, acercándolo a los estándares esperados en un entorno real.
5. **Aprendizaje integral de la ingeniería de software:** más allá del código entregado, el proyecto permitió al equipo vivenciar el ciclo completo de construcción de software —planificación, especificación, modelado, implementación, pruebas, despliegue y documentación—, fortaleciendo tanto las habilidades técnicas como el trabajo colaborativo.

---

## 6. Trabajo Futuro

De acuerdo con los límites definidos desde el alcance inicial y las oportunidades detectadas durante el desarrollo de SIAR, se proponen las siguientes mejoras para futuras versiones del sistema:

* **Descuento automático de inventario por recetas:** asociar cada plato o bebida del menú con sus ingredientes y cantidades exactas, de modo que al confirmar o preparar un pedido el sistema descuente automáticamente los insumos del inventario sin depender únicamente del registro manual.
* **Pagos divididos y múltiples medios de pago:** ampliar el módulo de facturación —que actualmente maneja una factura por pedido y un pago completo— para permitir dividir una cuenta entre varios comensales o combinar distintos medios de pago en una misma factura.
* **Integración con pasarelas de pago y sistemas contables:** conectar el sistema con plataformas externas de pagos electrónicos y con software contable o de facturación electrónica conforme a las exigencias legales vigentes.
* **Gestión de domicilios y aplicación móvil nativa:** incorporar un módulo dedicado a pedidos a domicilio (con seguimiento de entregas o integración con plataformas externas) y una aplicación móvil independiente que agilice aún más la toma de pedidos en mesa.
* **Analítica avanzada e inteligencia artificial:** aprovechar el historial acumulado de ventas e inventario para ofrecer pronósticos de demanda, recomendaciones automáticas de compra de insumos y detección de horarios pico.
* **Validación en un restaurante real y soporte multi-sede:** realizar pruebas piloto en un establecimiento real para recoger retroalimentación directa de meseros, cocineros y administradores, y evolucionar la base de datos para administrar varias sucursales desde un mismo sistema.