# Backend FastAPI - MiTienda
## Cuarto Avance: Integración Full Stack con React + Vite, FastAPI y Base de Datos SQL

- **Institución:** Servicio Nacional de Aprendizaje (SENA)
- **Ficha:** 3406204 | **Trimestre:** 03 | **Ambiente:** 502
- **Competencia:** React
- **Instructor:** Jhan Hader Muñoz
- **Aprendiz:** Jonathan Martinez

---

## 1. Descripción del Proyecto

Este componente representa la evolución arquitectónica del backend a **FastAPI (Python)**, conectado a una base de datos relacional SQL y consumido por el frontend desarrollado en **React + Vite** con **Tailwind CSS**.

### Arquitectura Tecnológica
$$\text{React + Vite (Frontend)} \longleftrightarrow \text{FastAPI REST API (Backend)} \longleftrightarrow \text{Base de Datos Relacional SQL (MySQL / SQLite)}$$

---

## 2. Estructura del Proyecto Backend

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicación FastAPI, middleware CORS, health check y registro de rutas
│   ├── database.py          # Configuración de SQLAlchemy con soporte MySQL y fallback SQLite
│   ├── models.py            # Modelos ORM: Rol, Permiso, Usuario, Producto, Servicio, Pedido, Cita
│   ├── schemas.py           # Esquemas Pydantic para validación y serialización de datos
│   ├── security.py          # Hashing bcrypt y generación/verificación de tokens JWT
│   ├── dependencies.py      # Inyección de dependencias y control de roles
│   └── routes/
│       ├── __init__.py
│       ├── auth.py          # Registro (/api/usuarios/registro), login, perfil, recuperación
│       ├── usuarios.py      # CRUD completo de usuarios, roles y cambio de estado
│       ├── productos.py     # CRUD completo de productos y cambio de estado
│       ├── servicios.py     # CRUD completo de servicios y cambio de estado
│       ├── pedidos.py       # Gestión de pedidos y carrito de compras
│       └── citas.py         # Agendamiento de citas para servicios
├── basedatos/
│   └── schema.sql           # Script DDL SQL de creación de tablas y datos iniciales
├── venv/                    # Entorno virtual de Python
├── requirements.txt         # Dependencias del proyecto
├── .env.example             # Plantilla de variables de entorno
├── .env                     # Variables de entorno locales
├── .gitignore               # Exclusión de archivos temporales
├── seed.py                  # Script para poblar la base de datos
├── run.py                   # Script de inicio rápido del servidor
└── README.md                # Documentación del backend
```

---

## 3. Instalación y Configuración

### Requisitos Previos
- Python 3.10 o superior (recomendado Python 3.13)
- MySQL / MariaDB (opcionalmente mediante XAMPP)

### Paso 1: Activar el Entorno Virtual
En la terminal de Windows:
```bash
cd backend
venv\Scripts\activate
```

### Paso 2: Instalar Dependencias
```bash
pip install -r requirements.txt
```

### Paso 3: Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env` y ajusta tus credenciales:
```env
PORT=8000
HOST=127.0.0.1
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mitienda_db
SECRET_KEY=mitienda_jwt_secret_key_jonathan_martinez_2024_secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Paso 4: Poblar la Base de Datos
Ejecuta el script para crear las tablas y registrar usuarios y datos iniciales:
```bash
python seed.py
```

### Paso 5: Iniciar el Servidor Backend
```bash
python run.py
```
O directamente con `uvicorn`:
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 4. Credenciales de Acceso para Pruebas

| Rol | Correo Electrónico | Contraseña | Privilegios |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@mitienda.com` | `Admin1234` | Acceso total: Usuarios, Productos, Servicios, Pedidos, Citas |
| **Empleado** | `empleado@mitienda.com` | `Empleado1234` | Panel Empleado: Gestión de productos, servicios, pedidos y citas |
| **Cliente** | *(Registrado desde el frontend o colección)* | *(Definida por el usuario)* | Compras, agendamiento de citas, visualización de historial |

---

## 5. Documentación Automática de la API

FastAPI genera documentación interactiva en tiempo real:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 6. Principales Endpoints de la API

### Autenticación y Usuarios
- `POST /api/usuarios/registro`: Registro de nuevos clientes (cumple especificación PDF).
- `POST /api/auth/register`: Alias compatible con React.
- `POST /api/auth/login`: Autenticación con generación de token JWT.
- `GET /api/auth/profile`: Consulta del perfil del usuario en sesión.
- `PUT /api/auth/profile`: Actualización del perfil del usuario en sesión.
- `GET /api/usuarios`: Listado de usuarios (*Solo Administrador*).
- `GET /api/usuarios/{id}`: Detalle de usuario (*Solo Administrador*).
- `POST /api/usuarios`: Creación administrativa de usuario (*Solo Administrador*).
- `PUT /api/usuarios/{id}`: Edición de usuario (*Solo Administrador*).
- `PATCH /api/usuarios/{id}/estado`: Cambio de estado activo/inactivo (*Solo Administrador*).
- `DELETE /api/usuarios/{id}`: Eliminación de usuario (*Solo Administrador*).

### Productos
- `GET /api/productos`: Catálogo de productos (soporta filtro `?activos=true`).
- `GET /api/productos/{id}`: Detalle de un producto.
- `POST /api/productos`: Crear producto (*Admin / Empleado*).
- `PUT /api/productos/{id}`: Editar producto (*Admin / Empleado*).
- `PATCH /api/productos/{id}/estado`: Cambiar estado activo/inactivo (*Admin / Empleado*).
- `DELETE /api/productos/{id}`: Eliminar producto (*Admin / Empleado*).

### Servicios
- `GET /api/servicios`: Catálogo de servicios (soporta filtro `?activos=true`).
- `GET /api/servicios/{id}`: Detalle de un servicio.
- `POST /api/servicios`: Crear servicio (*Admin / Empleado*).
- `PUT /api/servicios/{id}`: Editar servicio (*Admin / Empleado*).
- `PATCH /api/servicios/{id}/estado`: Cambiar estado activo/inactivo (*Admin / Empleado*).
- `DELETE /api/servicios/{id}`: Eliminar servicio (*Admin / Empleado*).
