# DOCUMENTACIÓN TÉCNICA DEL QUINTO AVANCE
## Integración De Gestión Comercial, Analítica, Despliegue E Inteligencia Artificial

* **Institución:** Servicio Nacional de Aprendizaje (SENA) — Centro de Servicios y Gestión Empresarial
* **Competencia:** React + FastAPI
* **Ficha:** 3406204 | **Trimestre:** 03 | **Ambiente:** 502
* **Instructor:** Jhan Hader Muñoz
* **Aprendiz:** Jonathan Martinez
* **Proyecto:** MiTienda — Plataforma de Comercio Electrónico de Tecnología y Servicios Técnicos

---

## 1. Arquitectura Tecnológica del Sistema

El proyecto sigue una arquitectura desacoplada moderna de tres capas:

```
┌─────────────────────────────────┐
│   FRONTEND: React 19 + Vite     │
│   • Componentes modulares       │
│   • TailwindCSS + SVG Charts    │
│   • Context (Auth & Cart)       │
│   • Chatbot Widget Flotante     │
└───────────────┬─────────────────┘
                │ HTTP REST (JSON / JWT / Axios)
                ▼
┌─────────────────────────────────┐
│    BACKEND: FastAPI (Python)    │
│   • Routers modulares           │
│   • SQLAlchemy ORM (Pydantic)   │
│   • ReportLab (PDF Comercial)   │
│   • openpyxl (Excel Financiero) │
│   • Asistente IA (OpenAI/Gemini)│
└───────────────┬─────────────────┘
                │ Driver pymysql / SQLite
                ▼
┌─────────────────────────────────┐
│    BASE DE DATOS: MySQL / SQL   │
│   • 16 tablas relacionales      │
│   • Consecutivos y auditoría    │
│   • Transacciones seguras       │
└─────────────────────────────────┘
```

---

## 2. Matriz de Cumplimiento de los 20 Requerimientos

| # | Requerimiento | Archivo Backend / Endpoint | Componente Frontend | Estado |
|---|---|---|---|:---:|
| **1** | Módulo de ventas | `app/routes/ventas.py` (`POST /api/ventas`) | `GestionVentas.jsx`, `CartPage.jsx` | ✅ 100% |
| **2** | Registro de productos y servicios | `app/models.py` (`DetalleVenta`) | `GestionVentas.jsx` (Modal detalle) | ✅ 100% |
| **3** | Historial de ventas | `app/routes/ventas.py` (`GET /api/ventas`) | `GestionVentas.jsx` (Filtros en vivo) | ✅ 100% |
| **4** | Reporte diario de ventas | `app/routes/reportes.py` (`/ventas/diario`) | `ReportesVentas.jsx` (Selector fecha) | ✅ 100% |
| **5** | Exportación del reporte en PDF | `app/routes/reportes.py` (`/ventas/pdf`) | `ReportesVentas.jsx` (Botón Exportar) | ✅ 100% |
| **6** | Exportación del reporte en Excel | `app/routes/reportes.py` (`/ventas/excel`) | `ReportesVentas.jsx` (Botón Exportar) | ✅ 100% |
| **7** | Generación de facturas de venta | `app/routes/facturas.py` (`POST /facturas`) | Generación auto en compra y venta | ✅ 100% |
| **8** | Consulta de facturas | `app/routes/facturas.py` (`GET /facturas`) | `GestionFacturas.jsx` (Buscador) | ✅ 100% |
| **9** | Descarga de facturas | `app/routes/facturas.py` (`/{id}/pdf`) | `GestionFacturas.jsx` (Botón PDF) | ✅ 100% |
| **10** | Dashboard administrativo | `app/routes/dashboard.py` (`/stats`) | `AdminDashboard.jsx` (Cards KPI) | ✅ 100% |
| **11** | Dashboard de ventas | `app/routes/dashboard.py` (`/charts`) | `AdminDashboard.jsx` (Barras y Líneas) | ✅ 100% |
| **12** | Dashboards según roles | `app/routes/dashboard.py` (Rol check) | `Admin/Empleado/Cliente Dashboard` | ✅ 100% |
| **13** | Filtros para los Dashboards | `app/routes/dashboard.py` (`fecha_ini/fin`)| `AdminDashboard.jsx` (Selector fechas) | ✅ 100% |
| **14** | Nuevos endpoints FastAPI | Routers modulares en `app/routes/` | Centralizado en `api.js` | ✅ 100% |
| **15** | Integración Dashboard con API | Consumo Axios dinámico en tiempo real | `AdminDashboard.jsx`, `ClienteDashboard` | ✅ 100% |
| **16** | Módulo de PQR | `app/routes/pqr.py` (Radicados únicos) | `ClientePQR.jsx` y `GestionPQR.jsx` | ✅ 100% |
| **17** | Chatbot para atención al cliente | `app/routes/chatbot.py` (`/message`) | `ChatbotWidget.jsx` (Flotante) | ✅ 100% |
| **18** | Chatbot con Inteligencia Artificial| `app/routes/chatbot.py` (OpenAI/Gemini) | Contexto de catálogo + fallback local | ✅ 100% |
| **19** | Gestión segura de API Key | Variables en `.env` / `.env.example` | Claves privadas fuera del frontend | ✅ 100% |
| **20** | Despliegue del proyecto | `Dockerfile`, `railway.json`, CORS | Listo para Railway, Render o VPS | ✅ 100% |

---

## 3. Diccionario de Datos: Nuevas Entidades SQL

### 3.1. Tabla `ventas`
* `id` (INT, PK, Auto Increment)
* `numero_venta` (VARCHAR 50, UNIQUE) — Formato consecutivo: `VTA-2026-XXXX`.
* `cliente_id` (INT, FK -> usuarios.id)
* `usuario_id` (INT, FK -> usuarios.id)
* `pedido_id` (INT, FK -> pedidos.id)
* `cliente_nombre`, `cliente_documento`, `cliente_email`, `cliente_telefono`
* `subtotal`, `descuento`, `impuestos` (IVA 19%), `total`
* `metodo_pago` (efectivo, transferencia, contraentrega, tarjeta)
* `estado` (completada, pendiente, cancelada)
* `fecha_venta` (TIMESTAMP, Index)

### 3.2. Tabla `detalle_ventas`
* `id` (INT, PK)
* `venta_id` (INT, FK -> ventas.id, CASCADE)
* `tipo_item` (VARCHAR 20: `'producto'` o `'servicio'`)
* `producto_id` (INT, FK -> productos.id, NULL)
* `servicio_id` (INT, FK -> servicios.id, NULL)
* `nombre_item` (VARCHAR 150)
* `precio_unitario` (DECIMAL 10,2)
* `cantidad` (INT)
* `descuento` (DECIMAL 10,2)
* `subtotal` (DECIMAL 12,2)

### 3.3. Tabla `facturas` y `detalle_facturas`
* `numero_factura` (VARCHAR 50, UNIQUE) — Consecutivo `FAC-2026-XXXX`.
* `venta_id` (INT, FK -> ventas.id, UNIQUE)
* `cliente_documento`, `subtotal`, `impuestos`, `descuento`, `total`, `estado`, `fecha_emision`.

### 3.4. Tabla `pqr`
* `numero_radicado` (VARCHAR 50, UNIQUE) — Consecutivo `PQR-2026-XXXX`.
* `tipo` (peticion, queja, reclamo, sugerencia).
* `asunto` (VARCHAR 150), `descripcion` (TEXT).
* `estado` (pendiente, en proceso, respondida, cerrada).
* `prioridad` (baja, media, alta).
* `respuesta` (TEXT), `respondido_por_id` (INT, FK -> usuarios.id), `fecha_respuesta`.

### 3.5. Tablas `conversaciones_chatbot` y `mensajes_chatbot`
* Registro de `session_id`, mensajes de usuario y respuestas del asistente para auditoría.

---

## 4. Guía de Ejecución Local y Pruebas

### 4.1. Iniciar Backend FastAPI
```powershell
cd Backend
python -m uvicorn app.main:app --reload --port 8000
```
* **Swagger UI interactivo:** `http://127.0.0.1:8000/docs`
* **ReDoc:** `http://127.0.0.1:8000/redoc`

### 4.2. Iniciar Frontend React + Vite
```powershell
cd frontend
npm run dev
```
* **Aplicación Web:** `http://localhost:5173`

### 4.3. Ejecutar Pruebas Automatizadas de Endpoints
Se disponen de dos herramientas de prueba:

1. **Suite Nativa de Python:**
   ```powershell
   python Backend/test_quinto_avance_suite.py
   ```
2. **Suite Runner de Postman (Quinto Avance):**
   ```powershell
   node run_quinto_avance_postman.js
   ```

Ambas suites comprueban autenticación, compras, ventas, facturas PDF, reportes PDF/Excel, PQR y Chatbot con IA con 100% de aserciones exitosas.

---

## 5. Instrucciones para Despliegue en la Nube (Railway / Render)

### Despliegue en Railway (Recomendado por la Guía):
1. Crear una cuenta en [Railway.app](https://railway.app).
2. Crear un nuevo proyecto desde el repositorio de GitHub.
3. El archivo `railway.json` y el `Backend/Dockerfile` configuran automáticamente el contenedor Python.
4. Agregar el plugin **MySQL Database** en Railway y copiar la variable `DATABASE_URL` al servicio del Backend.
5. Para el Frontend en Vite: crear un servicio web estático apuntando a la carpeta `frontend/` y configurar la variable de entorno:
   `VITE_API_URL=https://tu-backend-railway.up.railway.app/api`.

---

## 6. Guion Recomendado para la Sustentación con el Instructor

1. **Introducción y Arquitectura (2 min):**
   * Mostrar el stack tecnológico: Frontend en React 19 + Vite, Backend en FastAPI y base de datos relacional con 16 tablas.
2. **Flujo de Venta y Facturación Electrónica (3 min):**
   * Realizar una compra desde el carrito en `/carrito`.
   * Mostrar cómo se actualiza automáticamente el inventario, se crea la orden en `/pedidos`, la venta comercial en `/admin/ventas` y se emite la factura en `/admin/facturas`.
   * Descargar la factura en formato PDF comercial generado con ReportLab.
3. **Reportes Diarios en PDF y Excel (2 min):**
   * Ingresar a `/admin/reportes`.
   * Consultar la fecha actual y descargar el reporte diario en PDF formal con membrete del SENA / MiTienda y el archivo `.xlsx` generado con openpyxl.
4. **Dashboards y Analítica con Filtros Dinámicos (2 min):**
   * Mostrar el `/admin/dashboard` con las 6 cards numéricas.
   * Demostrar la interacción con los gráficos de barras y líneas (toggle por día/acumulado) y el filtrado por presets (7, 14, 30 días) o fechas personalizadas.
5. **Módulo de PQR y Chatbot con IA (3 min):**
   * Iniciar sesión como cliente e ingresar a `/cliente/pqr`.
   * Radicar una PQR y mostrar el número de radicado consecutivo oficial (`PQR-2026-XXXX`).
   * Abrir el Chatbot flotante en la tienda y consultar el estado escribiendo: *"Quiero saber el estado de mi radicado PQR-2026-XXXX"*. Mostrar la respuesta inmediata del bot.
   * Entrar como administrador a `/admin/pqr`, responder la solicitud y verificar el cambio de estado en tiempo real.
