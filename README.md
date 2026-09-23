# 🛒 MiTienda — Plataforma de Comercio y Servicios

![FastAPI](https://img.shields.io/badge/Backend-FastAPI%202.0-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Build-Vite%208-646CFF?style=for-the-badge&logo=vite)
![MySQL](https://img.shields.io/badge/Base%20de%20Datos-MySQL-4479A1?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Deploy-Docker%20+%20Railway-2496ED?style=for-the-badge&logo=docker)

> **Proyecto Final SENA — Ficha 3406204**
> Instructor: Jhan Hader Muñoz | Autor: Jonathan Martinez

Plataforma web completa de comercio electrónico y gestión de servicios con autenticación por roles, carrito de compras, facturación electrónica en PDF, reportes en Excel, chatbot con IA y panel administrativo multirol.

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Características por Módulo](#características-por-módulo)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Estructura de Directorios](#estructura-de-directorios)
- [Modelo de Base de Datos](#modelo-de-base-de-datos)
- [Roles y Permisos](#roles-y-permisos)
- [API REST — Endpoints](#api-rest--endpoints)
- [Variables de Entorno](#variables-de-entorno)
- [Instalación y Ejecución Local](#instalación-y-ejecución-local)
- [Despliegue en Railway](#despliegue-en-railway)
- [Credenciales de Prueba](#credenciales-de-prueba)

---

## Descripción General

**MiTienda** es una aplicación web full-stack desarrollada como proyecto final del programa SENA, que simula una tienda en línea con gestión completa de:

- Ventas de productos y servicios
- Carrito de compras con flujo de pedidos
- Facturación electrónica con generación de PDF
- Reportes gerenciales en PDF y Excel
- Sistema de citas para servicios
- Módulo de PQR (Peticiones, Quejas y Reclamos)
- Dashboard analítico por rol con métricas en tiempo real
- Chatbot inteligente con respaldo de IA (OpenAI / Gemini)
- Recuperación de contraseña por correo electrónico (SMTP)
- Sistema de roles y permisos: Admin, Empleado y Cliente

---

## Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **Python** | 3.11 | Lenguaje principal |
| **FastAPI** | ≥0.115 | Framework REST API |
| **Uvicorn** | ≥0.30 | Servidor ASGI |
| **SQLAlchemy** | ≥2.0 | ORM — modelos y consultas |
| **PyMySQL** | ≥1.1 | Driver MySQL |
| **Pydantic** | ≥2.8 | Validación de esquemas |
| **PyJWT** | ≥2.8 | Autenticación JWT |
| **bcrypt** | ≥4.0 | Hash de contraseñas |
| **ReportLab** | ≥4.0 | Generación de PDF |
| **openpyxl** | ≥3.1 | Generación de Excel |
| **python-dotenv** | ≥1.0 | Variables de entorno |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 19 | Framework UI |
| **Vite** | 8 | Bundler y dev server |
| **React Router DOM** | 7 | Enrutamiento SPA |
| **Axios** | 1.x | Cliente HTTP |
| **TailwindCSS** | 3 | Estilos utilitarios |

### Infraestructura
| Tecnología | Uso |
|---|---|
| **MySQL** | Base de datos relacional |
| **Docker** | Contenedorización |
| **Nginx** | Servidor estático del frontend |
| **Railway** | Plataforma de despliegue en la nube |

---

## Características por Módulo

### 🔐 Autenticación y Seguridad
- Login con JWT (access token, expiración configurable)
- Registro de usuarios con validación de email único y documento
- Recuperación de contraseña mediante código OTP por correo (SMTP)
- Rutas protegidas por rol en el frontend (`ProtectedRoute`)
- Hash de contraseñas con bcrypt

### 🛍️ Tienda Pública
- Catálogo de productos con filtros por categoría y búsqueda
- Modal de detalle de producto con imágenes
- Catálogo de servicios con modal de detalle y agendamiento de citas
- Carrusel de productos destacados en la página principal
- Sección "Sobre Nosotros" con información corporativa

### 🛒 Carrito de Compras y Pedidos
- Carrito persistente con React Context
- Resumen de compra con subtotal, envío e impuestos
- Flujo completo: carrito → datos de envío → confirmación → pedido
- Página de pedido confirmado con número de orden y estado
- Historial de pedidos en el panel del cliente

### 👑 Panel Administrador
| Vista | Descripción |
|---|---|
| `AdminDashboard` | Métricas globales: ventas, ingresos, productos, usuarios, gráficos |
| `AdminProductos` | CRUD completo de productos con imagen URL y stock |
| `AdminServicios` | CRUD completo de servicios |
| `AdminUsuarios` | Gestión de usuarios: crear, editar, cambiar estado y rol |
| `GestionPedidos` | Ver y actualizar estado de pedidos (en revisión → hecho) |
| `GestionVentas` | Listado de ventas con detalles y estado |
| `GestionFacturas` | Listado de facturas con descarga en PDF por factura |
| `GestionCitas` | Ver y gestionar citas de servicios agendadas |
| `GestionPQR` | Gestión completa de PQR con respuesta a tickets |
| `ReportesVentas` | Descarga de reportes consolidados en PDF y Excel |

### 👤 Panel Cliente
| Vista | Descripción |
|---|---|
| `ClienteDashboard` | Mis pedidos, mis citas, mis facturas, mis PQR |
| `ClientePQR` | Crear y hacer seguimiento a PQR |
| `PerfilUsuario` | Editar datos personales y cambiar contraseña |

### 👷 Panel Empleado
| Vista | Descripción |
|---|---|
| `EmpleadoDashboard` | Vista operativa: pedidos, citas del día, PQR asignados |

### 🤖 Chatbot con IA
- Widget flotante disponible en toda la aplicación
- Motor local de respuestas de respaldo (sin API key)
- Integración opcional con **OpenAI GPT-4o-mini** o **Google Gemini 1.5 Flash**
- Responde preguntas sobre productos, servicios, horarios y soporte

### 📊 Reportes y Facturación
- **PDF por factura**: generado con ReportLab, descargable desde el panel
- **Reporte PDF consolidado**: resumen de ventas por período
- **Reporte Excel**: exportación detallada con openpyxl
- Números de factura y venta autogenerados: `FAC-2025-0001`, `VTA-2025-0001`

---

## Arquitectura del Proyecto

```
Cliente (Browser)
      │
      ▼
┌─────────────────────┐
│  Frontend React/Vite │  → Nginx (producción) / Vite dev server (local)
│  Puerto: 5173 / 80   │
└──────────┬──────────┘
           │  HTTP/HTTPS (VITE_API_URL)
           ▼
┌─────────────────────┐
│  Backend FastAPI     │  → Uvicorn ASGI
│  Puerto: 8000        │
│  Prefijo: /api/*     │
└──────────┬──────────┘
           │  SQLAlchemy ORM
           ▼
┌─────────────────────┐
│  MySQL              │
│  Puerto: 3306        │
│  DB: mitienda_db    │
└─────────────────────┘
```

---

## Estructura de Directorios

```
ReactProyecto/
├── Backend/                        # Servicio FastAPI
│   ├── app/
│   │   ├── main.py                 # Entrada de la aplicación, CORS, routers
│   │   ├── database.py             # Conexión SQLAlchemy + engine
│   │   ├── models.py               # Modelos ORM (tablas de BD)
│   │   ├── schemas.py              # Schemas Pydantic (request/response)
│   │   ├── dependencies.py         # Dependencias inyectables (get_db, get_current_user)
│   │   ├── security.py             # Hash bcrypt y verificación de contraseñas
│   │   └── routes/
│   │       ├── auth.py             # Login, registro, recuperación de contraseña
│   │       ├── usuarios.py         # CRUD de usuarios
│   │       ├── productos.py        # CRUD de productos
│   │       ├── servicios.py        # CRUD de servicios
│   │       ├── pedidos.py          # Gestión de pedidos y carrito
│   │       ├── citas.py            # Agendamiento de citas
│   │       ├── ventas.py           # Registro y consulta de ventas
│   │       ├── facturas.py         # Facturación electrónica + PDF
│   │       ├── reportes.py         # Reportes PDF y Excel
│   │       ├── pqr.py              # Peticiones, Quejas y Reclamos
│   │       ├── dashboard.py        # Métricas y estadísticas por rol
│   │       └── chatbot.py          # Chatbot con IA (OpenAI / Gemini / local)
│   ├── seed.py                     # Datos iniciales (roles, admin, productos)
│   ├── migrate_quinto_avance.py    # Migración de datos del quinto avance
│   ├── requirements.txt            # Dependencias Python
│   ├── Dockerfile                  # Imagen Docker del backend
│   └── .env.example                # Plantilla de variables de entorno
│
├── frontend/                       # Aplicación React + Vite
│   ├── src/
│   │   ├── App.jsx                 # Router principal con rutas protegidas
│   │   ├── main.jsx                # Punto de entrada React
│   │   ├── components/             # Componentes reutilizables
│   │   │   ├── Header.jsx          # Navegación con menú por rol
│   │   │   ├── Footer.jsx          # Pie de página
│   │   │   ├── Login.jsx           # Modal de inicio de sesión
│   │   │   ├── RegisterModal.jsx   # Modal de registro
│   │   │   ├── PerfilUsuario.jsx   # Perfil y edición de datos
│   │   │   ├── ChatbotWidget.jsx   # Widget flotante del chatbot
│   │   │   ├── ProtectedRoute.jsx  # HOC de protección por rol
│   │   │   ├── RecoverPassword.jsx # Flujo de recuperación con OTP
│   │   │   ├── ProductDetailModal.jsx
│   │   │   ├── ServiceDetailModal.jsx
│   │   │   └── ScheduleServiceModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Página principal / landing
│   │   │   ├── Products.jsx        # Catálogo de productos
│   │   │   ├── Services.jsx        # Catálogo de servicios
│   │   │   ├── CartPage.jsx        # Carrito y checkout
│   │   │   ├── PedidoConfirmadoPage.jsx
│   │   │   ├── admin/              # Panel administrador
│   │   │   ├── cliente/            # Panel cliente
│   │   │   └── empleado/           # Panel empleado
│   │   ├── context/                # React Context (auth, carrito)
│   │   ├── services/               # Funciones Axios para cada módulo
│   │   └── utils/                  # Helpers y utilidades
│   ├── Dockerfile                  # Build multi-stage Node→Nginx
│   ├── nginx.conf                  # Config Nginx con SPA fallback y $PORT dinámico
│   ├── railway.json                # Config servicio frontend Railway
│   └── .env.example                # Plantilla de VITE_API_URL
│
├── railway.json                    # Config servicio backend Railway
├── RAILWAY_DEPLOY.md               # Guía de despliegue paso a paso
└── .gitignore                      # node_modules, venv, .env, dist excluidos
```

---

## Modelo de Base de Datos

| Tabla | Descripción |
|---|---|
| `roles` | Admin (1), Empleado (2), Cliente (3) |
| `permisos` | Permisos granulares por módulo |
| `rol_permisos` | Tabla pivote roles ↔ permisos |
| `usuarios` | Usuarios del sistema con rol asignado |
| `productos` | Catálogo de productos con stock y precio |
| `servicios` | Servicios ofrecidos con precio y duración |
| `pedidos` | Órdenes de compra con estado |
| `pedido_items` | Líneas de cada pedido |
| `citas_servicios` | Citas agendadas para servicios |
| `ventas` | Registro de ventas completadas |
| `detalle_ventas` | Líneas de cada venta |
| `facturas` | Facturas electrónicas asociadas a ventas |
| `detalle_facturas` | Líneas de cada factura |
| `pqr` | Tickets de soporte y atención al cliente |

---

## Roles y Permisos

| Rol | Acceso |
|---|---|
| **Administrador** | Acceso total: CRUD usuarios, productos, servicios, pedidos, ventas, facturas, citas, PQR, reportes, dashboard global |
| **Empleado** | Dashboard operativo: ver pedidos, citas del día, PQR asignados |
| **Cliente** | Tienda pública, carrito, mis pedidos, mis citas, mis facturas, mis PQR, perfil |

---

## API REST — Endpoints

### Autenticación (`/api/auth`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login con email y contraseña → JWT |
| POST | `/api/auth/register` | Registro de nuevo usuario |
| POST | `/api/auth/recover-password` | Solicitar código OTP al correo |
| POST | `/api/auth/verify-code` | Verificar código OTP |
| POST | `/api/auth/reset-password` | Cambiar contraseña con OTP validado |

### Usuarios (`/api/usuarios`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/usuarios` | Listar todos (admin) |
| GET | `/api/usuarios/me` | Perfil del usuario autenticado |
| PUT | `/api/usuarios/{id}` | Actualizar usuario |
| DELETE | `/api/usuarios/{id}` | Eliminar usuario (admin) |

### Productos, Servicios, Pedidos, Ventas, Facturas, Citas, PQR
Todos siguen el patrón REST estándar:
`GET /api/{recurso}` · `POST /api/{recurso}` · `GET /api/{recurso}/{id}` · `PUT /api/{recurso}/{id}` · `DELETE /api/{recurso}/{id}`

### Reportes (`/api/reportes`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reportes/ventas/pdf` | Reporte PDF de ventas |
| GET | `/api/reportes/ventas/excel` | Reporte Excel de ventas |

### Dashboard (`/api/dashboard`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dashboard/admin` | Métricas globales (admin) |
| GET | `/api/dashboard/empleado` | Métricas operativas (empleado) |
| GET | `/api/dashboard/cliente` | Resumen personal (cliente) |

### Health Check
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `{"ok": true, "message": "...", "timestamp": "..."}` |
| GET | `/api/health` | Igual que el anterior |
| GET | `/docs` | Swagger UI interactivo |

---

## Variables de Entorno

### Backend (`Backend/.env`)
```env
# Servidor
PORT=8000
HOST=0.0.0.0

# Base de Datos MySQL
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/mitienda_db

# JWT
SECRET_KEY=tu_clave_super_secreta_minimo_32_caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS (producción)
FRONTEND_URL=https://tu-frontend.up.railway.app

# SMTP — Recuperación de contraseña (opcional)
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=contraseña_de_aplicacion_gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# IA — Chatbot (opcional, al menos una)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://127.0.0.1:8000/api
# En producción:
# VITE_API_URL=https://tu-backend.up.railway.app/api
```

---

## Instalación y Ejecución Local

### Prerrequisitos
- Python 3.11+
- Node.js 20+
- MySQL 8.0+

### 1. Clonar el repositorio
```bash
git clone https://github.com/Jonathan-stack23/Proyecto-JavaScript.git
cd Proyecto-JavaScript
```

### 2. Configurar el Backend

```bash
cd Backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales de MySQL y JWT
```

### 3. Crear la base de datos MySQL

```sql
CREATE DATABASE mitienda_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Las tablas se crean automáticamente al iniciar el backend gracias a SQLAlchemy `create_all()`.
> Los datos de prueba (seed) se cargan automáticamente si la base de datos está vacía.

### 4. Iniciar el Backend

```bash
cd Backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API disponible en: `http://127.0.0.1:8000`
Documentación Swagger: `http://127.0.0.1:8000/docs`

### 5. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
copy .env.example .env
# .env ya tiene: VITE_API_URL=http://127.0.0.1:8000/api
```

### 6. Iniciar el Frontend

```bash
cd frontend
npm run dev
```

App disponible en: `http://localhost:5173`

---

## Despliegue en Railway

Consulta la guía completa en [`RAILWAY_DEPLOY.md`](./RAILWAY_DEPLOY.md).

### Resumen rápido

**Estructura de servicios en Railway:**

| Servicio | Dockerfile | Puerto |
|---|---|---|
| Backend (FastAPI) | `Backend/Dockerfile` | `8000` |
| Frontend (Nginx) | `frontend/Dockerfile` | Railway inyecta `$PORT` |
| MySQL | Plugin integrado Railway | Automático |

**Variables clave en Railway:**

```
# Backend Service
DATABASE_URL   = ${{MySQL.DATABASE_URL}}
SECRET_KEY     = <generar con: python -c "import secrets; print(secrets.token_hex(32))">
FRONTEND_URL   = https://<tu-frontend>.up.railway.app

# Frontend Service
VITE_API_URL   = https://<tu-backend>.up.railway.app/api
```

---

## Credenciales de Prueba

Después del primer arranque, el seed carga automáticamente estos usuarios:

| Rol | Email | Contraseña |
|---|---|---|
| **Administrador** | `admin@mitienda.com` | `Admin1234!` |
| **Empleado** | `empleado@mitienda.com` | `Empleado1234!` |
| **Cliente** | `cliente@mitienda.com` | `Cliente1234!` |

> Estas credenciales son solo para desarrollo/pruebas. Cámbialas en producción.

---

## Contacto y Créditos

| Campo | Detalle |
|---|---|
| **Autor** | Jonathan Martinez |
| **Institución** | SENA — Servicio Nacional de Aprendizaje |
| **Ficha** | 3406204 |
| **Instructor** | Jhan Hader Muñoz |
| **Programa** | Análisis y Desarrollo de Software |
