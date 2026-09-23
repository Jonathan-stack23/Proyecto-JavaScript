# Plan de Implementación: Quinto Avance — React + Vite + FastAPI + SQL

Evolución integral del sistema de comercio electrónico **MiTienda** cumpliendo con los **20 requerimientos funcionales y técnicos** del Quinto Avance (SENA Ficha 3406204):
- **Arquitectura central**: Frontend en **React + Vite** $\rightarrow$ Backend en **FastAPI (Python)** $\rightarrow$ Base de Datos **MySQL / SQL**.
- **Nuevas capacidades**: Módulo de Ventas de productos y servicios, Facturación electrónica básica, Reporte diario con exportación en PDF y Excel (.xlsx), Dashboards diferenciados por rol con gráficos analíticos y cards, Módulo de PQR completo, Chatbot integrado al sitio web con Inteligencia Artificial (y fallback autónomo), gestión segura de credenciales y preparación para despliegue en la nube.

---

## User Review Required

> [!IMPORTANT]
> **Transición a FastAPI como Backend Activo**:
> En el frontend se configurará `VITE_API_URL=http://127.0.0.1:8000/api` para que consuma directamente FastAPI (en lugar del backup de Node.js en el puerto 3000), cumpliendo con la arquitectura requerida en la guía: `React + Vite → FastAPI → Base de Datos SQL`.
> Se añadirá el script `run_fastapi.bat` y comandos documentados para iniciar fácilmente el backend en FastAPI activando su entorno virtual con todas sus dependencias.

> [!NOTE]
> **Proveedor del Chatbot con IA**:
> Se configurará soporte para clave de IA (`OPENAI_API_KEY` o `GEMINI_API_KEY`) en `Backend/.env`. Además, se implementará un motor de respuestas contextualizado con conocimiento del catálogo, servicios y PQR para que el Chatbot funcione perfectamente al 100% de manera inmediata, incluso si el aprendiz aún no ha configurado una API Key de pago externa.

---

## Open Questions

- ¿Tienes alguna preferencia entre **OpenAI (ChatGPT)** o **Google Gemini** para la clave de API del Chatbot, o prefieres que soporte ambas mediante variables de entorno configurables en `Backend/.env`? *(El plan implementará soporte flexible para ambas con motor local de respaldo).*
- Para los gráficos analíticos en React, utilizaremos componentes SVG interactivos de alto rendimiento estilizados con TailwindCSS (con tooltips y animaciones fluidas) para garantizar compatibilidad nativa absoluta con React 19 sin conflictos de dependencias.

---

## Requerimientos y Arquitectura Propuesta

A continuación se detalla la correspondencia exacta con los 20 requerimientos de la guía:

| # | Requerimiento | Implementación Técnica |
|---|---|---|
| **1** | Módulo de ventas | Entidad `ventas` y `detalle_ventas` en SQL, endpoints POST/GET en FastAPI y vista administrativa de registro y control de ventas. |
| **2** | Registro de productos y servicios vendidos | Detalle de venta polimórfico (`tipo_item`: producto o servicio) con precios, cantidades y subtotales. |
| **3** | Historial de ventas | Endpoint `GET /api/ventas` con filtros dinámicos por rango de fechas, cliente, producto, servicio, estado y valor. |
| **4** | Reporte diario de ventas | Endpoint `GET /api/reportes/ventas/diario` que consolida las ventas del día seleccionado con totales y métricas. |
| **5** | Exportación a PDF | Endpoint `GET /api/reportes/ventas/pdf` con `ReportLab` generando documento PDF formal institucional descargable. |
| **6** | Exportación a Excel | Endpoint `GET /api/reportes/ventas/excel` con `openpyxl` generando archivo `.xlsx` estructurado y con formato financiero. |
| **7** | Generación de facturas | Entidad `facturas` y `detalle_facturas` vinculadas a la venta con numeración consecutiva (`FAC-2026-XXXX`), IVA y datos fiscales. |
| **8** | Consulta de facturas | Endpoint `GET /api/facturas` con filtros por número, cliente, fecha y estado. |
| **9** | Descarga de facturas | Endpoint `GET /api/facturas/{id}/pdf` para descargar la factura comercial en PDF profesional. |
| **10** | Dashboard administrativo | Vista con Cards de KPIs: Total Usuarios, Productos, Servicios, Ventas, Facturación, PQR Recibidas y Pendientes. |
| **11** | Dashboard de ventas | Gráficos interactivos de Barras (ventas por día/mes) y Líneas (tendencia de ingresos) con métricas financieras. |
| **12** | Dashboards por roles | Vistas diferenciadas y protegidas para **Administrador**, **Empleado** y **Cliente**. |
| **13** | Filtros para Dashboards | Controles de filtrado en tiempo real por fecha inicio, fecha fin, producto, servicio y cliente. |
| **14** | Nuevos endpoints FastAPI | Routers modulares en `app/routes/`: `ventas.py`, `facturas.py`, `reportes.py`, `pqr.py`, `dashboard.py`, `chatbot.py`. |
| **15** | Integración Dashboard con FastAPI | Consumo 100% dinámico mediante Axios desde React a los endpoints analíticos de FastAPI. |
| **16** | Módulo de PQR | Entidad `pqr`, radicación con número consecutivo (`PQR-2026-XXXX`), seguimiento de estados y gestión de respuestas. |
| **17** | Chatbot de atención al cliente | Widget flotante integrado en la tienda para FAQs, catálogo, compras y estado de PQR. |
| **18** | Integración Chatbot con IA | Endpoint FastAPI conectado a IA (OpenAI / Gemini) con fallback local inteligente de catálogo. |
| **19** | Gestión segura de API Key | Clave en `Backend/.env` (`OPENAI_API_KEY` / `GEMINI_API_KEY`), `.env.example` limpio, nunca expuesta en frontend. |
| **20** | Despliegue del proyecto | `Dockerfile`, `railway.json`, `.env.example`, configuración CORS para producción, colección Postman y guía técnica. |

---

## Proposed Changes

### 1. Base de Datos SQL y Modelos SQLAlchemy

#### [MODIFY] [schema.sql](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/basedatos/schema.sql)
- Agregar tablas `ventas`, `detalle_ventas`, `facturas`, `detalle_facturas`, `pqr`, `conversaciones_chatbot`, `mensajes_chatbot`.
- Insertar datos iniciales de prueba (ventas, facturas, PQR de ejemplo para que los reportes y dashboards muestren datos reales inmediatamente).

#### [MODIFY] [models.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/models.py)
- Mapear las nuevas clases ORM SQLAlchemy: `Venta`, `DetalleVenta`, `Factura`, `DetalleFactura`, `PQR`, `ConversacionChatbot`, `MensajeChatbot`.
- Establecer relaciones con `Usuario`, `Producto` y `Servicio`.

#### [MODIFY] [schemas.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/schemas.py)
- Definir esquemas Pydantic v2:
  - `VentaCreate`, `VentaResponse`, `DetalleVentaResponse`
  - `FacturaCreate`, `FacturaResponse`, `DetalleFacturaResponse`
  - `PQRCreate`, `PQRResponse`, `PQRRespuestaUpdate`
  - `ChatbotMessageRequest`, `ChatbotMessageResponse`
  - `DashboardStatsResponse`, `DashboardChartsResponse`
  - `FiltrosVentasQuery`, `FiltrosReporteQuery`

---

### 2. Endpoints y Lógica de Negocio en FastAPI

#### [NEW] [ventas.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/routes/ventas.py)
- `POST /api/ventas`: Registro de venta (productos y servicios, cliente, descuentos, impuestos).
- `GET /api/ventas`: Historial de ventas con filtros de fecha, cliente, producto, servicio, estado, valor.
- `GET /api/ventas/{id}`: Detalle de venta.

#### [NEW] [facturas.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/routes/facturas.py)
- `POST /api/facturas`: Generar factura a partir de venta.
- `GET /api/facturas`: Consulta con filtros (número, cliente, fecha, estado).
- `GET /api/facturas/{id}`: Detalle de factura.
- `GET /api/facturas/{id}/pdf`: Descarga de factura en PDF estructurado y estilizado.

#### [NEW] [reportes.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/routes/reportes.py)
- `GET /api/reportes/ventas/diario`: Resumen de ventas para una fecha específica.
- `GET /api/reportes/ventas/pdf`: Generación y descarga de reporte diario en PDF con `ReportLab`.
- `GET /api/reportes/ventas/excel`: Generación y descarga de reporte diario en Excel (.xlsx) con `openpyxl`.

#### [NEW] [pqr.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/routes/pqr.py)
- `POST /api/pqr`: Radicar PQR (petición, queja, reclamo, sugerencia) con código radicado único.
- `GET /api/pqr`: Listado general con filtros (Admin y Empleado).
- `GET /api/pqr/mis-pqr`: PQR del cliente autenticado.
- `GET /api/pqr/{id}`: Detalle de PQR.
- `PATCH /api/pqr/{id}/responder`: Responder y actualizar estado ('en proceso', 'respondida', 'cerrada').

#### [NEW] [dashboard.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/routes/dashboard.py)
- `GET /api/dashboard/stats`: Métricas consolidadas según rol (usuarios, productos, servicios, ventas, facturación, PQR).
- `GET /api/dashboard/charts`: Datos para gráficos de barras (ventas por día/mes) y gráfico lineal (ingresos acumulados), soportando filtros de fechas y categorías.

#### [NEW] [chatbot.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/routes/chatbot.py)
- `POST /api/chatbot/message`: Procesa mensajes del usuario. Conecta con OpenAI/Gemini si existe API Key en variables de entorno; si no, utiliza el motor de inferencia local con información contextual del catálogo de MiTienda, citas y PQR.

#### [MODIFY] [main.py](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/app/main.py)
- Registrar los nuevos routers: `ventas_router`, `facturas_router`, `reportes_router`, `pqr_router`, `dashboard_router`, `chatbot_router`.
- Actualizar descripción y documentación Swagger UI / ReDoc para el Quinto Avance.

---

### 3. Frontend React + Vite

#### [MODIFY] [.env](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/.env)
- Configurar `VITE_API_URL=http://127.0.0.1:8000/api` para enlazar directamente con FastAPI.

#### [NEW] Componentes Analíticos y Gráficos
- [BarChart.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/components/charts/BarChart.jsx): Gráfico de barras SVG interactivo con tooltips y animaciones.
- [LineChart.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/components/charts/LineChart.jsx): Gráfico lineal SVG de tendencia financiera.
- [StatCard.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/components/cards/StatCard.jsx): Card de métricas con iconos, variación y valores formateados.

#### [NEW] Componente Chatbot
- [ChatbotWidget.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/components/ChatbotWidget.jsx): Widget flotante accesible globalmente, interfaz de conversación moderna, botones de preguntas rápidas (productos, servicios, compras, radicar PQR).

#### [NEW] Módulos de Administración y Empleado
- [GestionVentas.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/admin/GestionVentas.jsx): Registro rápido de ventas, historial con filtros avanzados y detalle.
- [GestionFacturas.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/admin/GestionFacturas.jsx): Consulta de facturas, búsqueda y botón de descarga de PDF.
- [ReportesVentas.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/admin/ReportesVentas.jsx): Panel de reporte diario con botones de exportación a PDF y Excel (.xlsx).
- [GestionPQR.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/admin/GestionPQR.jsx): Bandeja de PQR con filtros, visualizador de estado y modal para responder solicitudes.

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/admin/AdminDashboard.jsx)
- Incorporar Cards de indicadores dinámicos conectados a `/api/dashboard/stats`.
- Incorporar selector de filtros y gráficos analíticos de barras y líneas conectados a `/api/dashboard/charts`.

#### [MODIFY] [AdminLayout.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/admin/AdminLayout.jsx) y [EmpleadoLayout.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/empleado/EmpleadoLayout.jsx)
- Actualizar menús de navegación lateral para incluir Ventas, Facturas, Reportes y PQR.

#### [NEW] Módulos para Cliente
- [ClienteFacturas.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/cliente/ClienteFacturas.jsx): Lista de facturas del cliente con botón de descarga en PDF.
- [ClientePQR.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/pages/cliente/ClientePQR.jsx): Formulario amigable para radicar PQR y panel de seguimiento de estado y respuestas.

#### [MODIFY] [App.jsx](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/frontend/src/App.jsx)
- Registrar todas las nuevas rutas para admin, empleado y cliente.
- Incluir `ChatbotWidget` globalmente.

---

### 4. Entregables de Despliegue, Seguridad y Pruebas

#### [NEW] [Dockerfile](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/Backend/Dockerfile) y [railway.json](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/railway.json)
- Configuración para despliegue en la nube (Railway / Render / Docker).

#### [NEW] [MiTienda_QuintoAvance_Postman_Collection.json](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/MiTienda_QuintoAvance_Postman_Collection.json)
- Colección completa de pruebas Postman para ventas, facturas, reportes PDF/Excel, PQR, dashboard y chatbot con evidencias de requests y responses.

#### [NEW] [DOCUMENTACION_QUINTO_AVANCE.md](file:///c:/Users/Acer/Documents/Jonathan%20SENA/JavaScript/3%20Trimestre/ReactProyecto/DOCUMENTACION_QUINTO_AVANCE.md)
- Guía de sustentación, arquitectura del sistema, variables de entorno, documentación de endpoints y manual de despliegue.

---

## Verification Plan

### 1. Pruebas Automatizadas y de Endpoints (FastAPI)
- Ejecutar script de verificación de endpoints en Python (`test_quinto_avance_suite.py`) validando:
  - Registro de ventas (productos y servicios).
  - Consulta de historial de ventas con filtros.
  - Generación de reporte diario en PDF (validar encabezado `application/pdf`).
  - Generación de reporte diario en Excel (validar mime-type `.xlsx`).
  - Generación y descarga de facturas en PDF.
  - Radicación y respuesta de PQR.
  - Endpoint de Chatbot con respuestas contextuales.
  - Endpoints del Dashboard (`/stats` y `/charts`).

### 2. Pruebas de Frontend (React + Vite)
- Ejecutar `npm run build` en `frontend/` para asegurar 0 errores de compilación.
- Verificar en navegador / servidor de desarrollo:
  - Visualización del Dashboard Admin con Cards, Gráfico de Barras y Gráfico de Líneas.
  - Funcionamiento de los filtros de fecha y categoría.
  - Navegación y registro de ventas e historial.
  - Consulta y descarga de facturas en PDF.
  - Generación de reporte diario y descarga de archivos PDF y Excel.
  - Radicación de PQR por el cliente y respuesta por el administrador.
  - Interacción fluida con el Chatbot flotante en la tienda.
