-- ================================================================
-- SCRIPT DDL: BASE DE DATOS RELACIONAL SQL - MITIENDA
-- Cuarto Avance: React + Vite + FastAPI
-- SENA - Centro de Servicios y Gestión Empresarial
-- Ficha: 3406204 | Instructor: Jhan Hader Muñoz
-- Aprendiz: Jonathan Martinez
-- ================================================================

CREATE DATABASE IF NOT EXISTS mitienda_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mitienda_db;

-- ----------------------------------------------------------------
-- 1. TABLA: roles
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  nombre        VARCHAR(50) NOT NULL UNIQUE,
  descripcion   VARCHAR(200),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 2. TABLA: permisos
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL UNIQUE,
  descripcion   VARCHAR(200),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 3. TABLA: rol_permisos (relación muchos a muchos)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id      INT NOT NULL,
  permiso_id  INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 4. TABLA: usuarios
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  nombre              VARCHAR(50) NOT NULL,
  apellido            VARCHAR(50) NOT NULL,
  tipo_documento      VARCHAR(10) NOT NULL DEFAULT 'CC',
  numero_documento    VARCHAR(20) NOT NULL UNIQUE,
  direccion           VARCHAR(100) NOT NULL,
  telefono            VARCHAR(20) NOT NULL,
  email               VARCHAR(100) NOT NULL UNIQUE,
  password            VARCHAR(255) NOT NULL,
  rol_id              INT NOT NULL DEFAULT 3,
  estado              VARCHAR(20) NOT NULL DEFAULT 'activo',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- ----------------------------------------------------------------
-- 5. TABLA: productos
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  precio          DECIMAL(10, 2) NOT NULL,
  stock           INT NOT NULL DEFAULT 0,
  categoria       VARCHAR(50),
  imagen_url      VARCHAR(255),
  estado          VARCHAR(20) NOT NULL DEFAULT 'activo',
  usuario_id      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);

-- ----------------------------------------------------------------
-- 6. TABLA: servicios
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  precio          DECIMAL(10, 2) NOT NULL,
  duracion        VARCHAR(50),
  categoria       VARCHAR(50),
  imagen_url      VARCHAR(255),
  estado          VARCHAR(20) NOT NULL DEFAULT 'activo',
  usuario_id      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios(estado);

-- ----------------------------------------------------------------
-- 7. TABLA: pedidos (para integración completa con React)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20) NOT NULL,
  direccion_envio     VARCHAR(200) NOT NULL,
  ciudad              VARCHAR(100) DEFAULT 'Bogotá',
  metodo_pago         VARCHAR(50) NOT NULL DEFAULT 'contraentrega',
  notas               TEXT,
  subtotal            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  envio               DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  estado              VARCHAR(30) NOT NULL DEFAULT 'en revision',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 8. TABLA: pedido_items
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido_items (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id           INT NOT NULL,
  producto_id         INT NULL,
  nombre_producto     VARCHAR(150) NOT NULL,
  precio_unitario     DECIMAL(10, 2) NOT NULL,
  cantidad            INT NOT NULL DEFAULT 1,
  subtotal            DECIMAL(12, 2) NOT NULL,
  imagen_url          VARCHAR(255),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 9. TABLA: codigos_recuperacion
-- Almacena códigos de verificación de 6 dígitos para recuperación
-- de contraseña. Cada código expira después de 15 minutos y solo
-- puede usarse una vez.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codigos_recuperacion (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  email         VARCHAR(100) NOT NULL,
  codigo        VARCHAR(10) NOT NULL,
  expira_en     DATETIME NOT NULL,
  usado         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_codigos_email (email),
  INDEX idx_codigos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 10. TABLA: citas_servicios
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas_servicios (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  servicio_id         INT NOT NULL,
  usuario_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20) NOT NULL,
  fecha_cita          VARCHAR(20) NOT NULL,
  hora_cita           VARCHAR(20) NOT NULL,
  direccion           VARCHAR(200),
  notas               TEXT,
  estado              VARCHAR(30) NOT NULL DEFAULT 'en revision',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- DATOS INICIALES: ROLES
-- ----------------------------------------------------------------
INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'Administrador', 'Acceso total al sistema'),
(2, 'Empleado',      'Gestión de productos y servicios'),
(3, 'Cliente',       'Compra y consulta de productos');

-- ----------------------------------------------------------------
-- DATOS INICIALES: PERMISOS
-- ----------------------------------------------------------------
INSERT IGNORE INTO permisos (id, nombre, descripcion) VALUES
(1,  'ver_usuarios',        'Ver listado de usuarios'),
(2,  'crear_usuarios',      'Crear nuevos usuarios'),
(3,  'editar_usuarios',     'Editar usuarios'),
(4,  'eliminar_usuarios',   'Eliminar o desactivar usuarios'),
(5,  'ver_productos',       'Ver productos'),
(6,  'crear_productos',     'Crear productos'),
(7,  'editar_productos',    'Editar productos'),
(8,  'eliminar_productos',  'Eliminar productos'),
(9,  'ver_servicios',       'Ver servicios'),
(10, 'crear_servicios',     'Crear servicios'),
(11, 'editar_servicios',    'Editar servicios'),
(12, 'eliminar_servicios',  'Eliminar servicios'),
(13, 'ver_panel_admin',     'Acceso al panel de admin'),
(14, 'ver_panel_empleado',  'Acceso al panel de empleado'),
(15, 'ver_panel_cliente',   'Acceso al panel de cliente');

-- Asignación de permisos al Administrador
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- Asignación de permisos al Empleado
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(2, 5), (2, 6), (2, 7), (2, 8),
(2, 9), (2, 10), (2, 11), (2, 12), (2, 14);

-- Asignación de permisos al Cliente
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(3, 5), (3, 9), (3, 15);

-- ================================================================
-- QUINTO AVANCE: GESTIÓN COMERCIAL, FACTURACIÓN, PQR Y CHATBOT
-- ================================================================

-- ----------------------------------------------------------------
-- 11. TABLA: ventas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  numero_venta        VARCHAR(50) NOT NULL UNIQUE,
  cliente_id          INT NULL,
  usuario_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_documento   VARCHAR(20) DEFAULT '222222222222',
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20) NOT NULL,
  direccion_entrega   VARCHAR(200),
  ciudad              VARCHAR(100) DEFAULT 'Bogotá',
  metodo_pago         VARCHAR(50) NOT NULL DEFAULT 'efectivo',
  subtotal            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  descuento           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  impuestos           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  estado              VARCHAR(30) NOT NULL DEFAULT 'completada',
  notas               TEXT,
  fecha_venta         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);

-- ----------------------------------------------------------------
-- 12. TABLA: detalle_ventas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  venta_id            INT NOT NULL,
  tipo_item           VARCHAR(20) NOT NULL DEFAULT 'producto',
  producto_id         INT NULL,
  servicio_id         INT NULL,
  nombre_item         VARCHAR(150) NOT NULL,
  precio_unitario     DECIMAL(10, 2) NOT NULL,
  cantidad            INT NOT NULL DEFAULT 1,
  descuento           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  subtotal            DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 13. TABLA: facturas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  numero_factura      VARCHAR(50) NOT NULL UNIQUE,
  venta_id            INT NOT NULL UNIQUE,
  cliente_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_documento   VARCHAR(20) NOT NULL,
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20),
  cliente_direccion   VARCHAR(200),
  ciudad              VARCHAR(100) DEFAULT 'Bogotá',
  subtotal            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  impuestos           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  descuento           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  metodo_pago         VARCHAR(50) NOT NULL DEFAULT 'efectivo',
  estado              VARCHAR(30) NOT NULL DEFAULT 'emitida',
  fecha_emision       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);

-- ----------------------------------------------------------------
-- 14. TABLA: detalle_facturas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_facturas (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  factura_id          INT NOT NULL,
  tipo_item           VARCHAR(20) NOT NULL DEFAULT 'producto',
  nombre_item         VARCHAR(150) NOT NULL,
  precio_unitario     DECIMAL(10, 2) NOT NULL,
  cantidad            INT NOT NULL DEFAULT 1,
  subtotal            DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 15. TABLA: pqr (Peticiones, Quejas, Reclamos y Sugerencias)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pqr (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  numero_radicado     VARCHAR(50) NOT NULL UNIQUE,
  usuario_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20),
  tipo                VARCHAR(30) NOT NULL,
  asunto              VARCHAR(150) NOT NULL,
  descripcion         TEXT NOT NULL,
  estado              VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  prioridad           VARCHAR(20) NOT NULL DEFAULT 'media',
  respuesta           TEXT NULL,
  respondido_por_id   INT NULL,
  fecha_radicado      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta     TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (respondido_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_pqr_estado ON pqr(estado);
CREATE INDEX IF NOT EXISTS idx_pqr_tipo ON pqr(tipo);
CREATE INDEX IF NOT EXISTS idx_pqr_usuario ON pqr(usuario_id);

-- ----------------------------------------------------------------
-- 16. TABLAS: conversaciones y mensajes del Chatbot
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversaciones_chatbot (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  session_id          VARCHAR(100) NOT NULL UNIQUE,
  usuario_id          INT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mensajes_chatbot (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  conversacion_id     INT NOT NULL,
  rol                 VARCHAR(20) NOT NULL,
  contenido           TEXT NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES conversaciones_chatbot(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

