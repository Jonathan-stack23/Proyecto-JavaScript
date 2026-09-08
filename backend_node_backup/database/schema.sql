-- ============================================
-- SCRIPT DE CREACIÃ“N DE BASE DE DATOS
-- MiTienda - Jonathan Martinez
-- ============================================

CREATE DATABASE IF NOT EXISTS mitienda_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mitienda_db;

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  nombre        VARCHAR(50) NOT NULL UNIQUE,
  descripcion   VARCHAR(200),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: permisos
-- ============================================
CREATE TABLE IF NOT EXISTS permisos (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL UNIQUE,
  descripcion   VARCHAR(200),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: rol_permisos (relaciÃ³n muchos a muchos
-- ============================================
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id      INT NOT NULL,
  permiso_id  INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  nombre              VARCHAR(50) NOT NULL,
  apellido            VARCHAR(50) NOT NULL,
  tipo_documento      VARCHAR(10) NOT NULL,
  numero_documento    VARCHAR(20) NOT NULL UNIQUE,
  direccion           VARCHAR(100) NOT NULL,
  telefono            VARCHAR(20) NOT NULL,
  email               VARCHAR(100) NOT NULL UNIQUE,
  password            VARCHAR(255) NOT NULL,
  rol_id              INT NOT NULL DEFAULT 3,
  estado              ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ãndices para optimizar bÃºsquedas (idempotentes)
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  precio          DECIMAL(10, 2) NOT NULL,
  stock           INT NOT NULL DEFAULT 0,
  categoria       VARCHAR(50),
  imagen_url        VARCHAR(255),
  estado          ENUM('activo', 'inactivo') DEFAULT 'activo',
  usuario_id      INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);

-- ============================================
-- TABLA: servicios
-- ============================================
CREATE TABLE IF NOT EXISTS servicios (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  precio          DECIMAL(10, 2) NOT NULL,
  duracion        VARCHAR(50),
  categoria       VARCHAR(50),
  imagen_url    VARCHAR(255),
  estado          ENUM('activo', 'inactivo') DEFAULT 'activo',
  usuario_id      INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios(estado);

-- ============================================
-- DATOS INICIALES: ROLES
-- ============================================
INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'Administrador', 'Acceso total al sistema'),
(2, 'Empleado',      'GestiÃ³n de productos y servicios'),
(3, 'Cliente',       'Compra y consulta de productos');

-- ============================================
-- DATOS INICIALES: PERMISOS
-- ============================================
INSERT IGNORE INTO permisos (id, nombre, descripcion) VALUES
(1,  'ver_usuarios',        'Ver listado de usuarios'),
(2,  'crear_usuarios',      'Crear nuevos usuarios'),
(3,  'editar_usuarios',    'Editar usuarios'),
(4,  'eliminar_usuarios',   'Eliminar o desactivar usuarios'),
(5,  'ver_productos',        'Ver productos'),
(6,  'crear_productos',      'Crear productos'),
(7,  'editar_productos',     'Editar productos'),
(8,  'eliminar_productos',   'Eliminar productos'),
(9,  'ver_servicios',     'Ver servicios'),
(10, 'crear_servicios',     'Crear servicios'),
(11, 'editar_servicios',    'Editar servicios'),
(12, 'eliminar_servicios', 'Eliminar servicios'),
(13, 'ver_panel_admin',     'Acceso al panel de admin'),
(14, 'ver_panel_empleado', 'Acceso al panel de empleado'),
(15, 'ver_panel_cliente',  'Acceso al panel de cliente');

-- ============================================
-- DATOS INICIALES: ROL_PERMISOS
-- ============================================
-- Administrador: todos los permisos
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- Empleado: permisos limitados
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(2, 5), (2, 6), (2, 7), (2, 8),
(2, 9), (2, 10), (2, 11), (2, 12), (2, 14);

-- Cliente: solo ver y panel cliente
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(3, 5), (3, 9), (3, 15);

-- ============================================
-- DATOS INICIALES: USUARIOS (contraseÃ±a: Admin123*)
-- El hash se genera con bcryptjs en el seed
-- ============================================
-- Usuario administrador por defecto
-- email: admin@mitienda.com - password: Admin123*
-- Usuario empleado por defecto
-- email: empleado@mitienda.com - password: Empleado123*
-- NOTA: las contraseÃ±as se hasheadas se insertan a travÃ©s del seed del backend o manualmente

-- ============================================
-- DATOS INICIALES: PRODUCTOS DE EJEMPLO
-- ============================================
INSERT IGNORE INTO productos (id, nombre, descripcion, precio, stock, categoria, imagen_url, estado) VALUES
(1, 'Laptop HP Pavilion',      'Laptop HP Pavilion 15" 8GB RAM 256GB SSD', 3599000.00, 15, 'Computadores', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'activo'),
(2, 'Smartphone Samsung',      'Samsung Galaxy A54 128GB 6GB RAM', 1899000.00, 25, 'Celulares', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', 'activo'),
(3, 'Auriculares Inalámbricos', 'Auriculares Bluetooth Noise Cancelling', 299000.00, 50, 'Accesorios', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 'activo'),
(4, 'Monitor LG 27"',          'Monitor LG 27 pulgadas Full HD IPS', 899000.00, 20, 'Monitores', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', 'activo'),
(5, 'Teclado Mecánico',        'Teclado mecánico RGB gamer', 459000.00, 30, 'Accesorios', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 'activo'),
(6, 'Mouse Gamer',             'Mouse gamer RGB 16000 DPI', 249000.00, 40, 'Accesorios', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', 'activo');

-- ============================================
-- DATOS INICIALES: SERVICIOS DE EJEMPLO
-- ============================================
INSERT IGNORE INTO servicios (id, nombre, descripcion, precio, duracion, categoria, imagen_url, estado) VALUES
(1, 'Mantenimiento de PC',     'Limpieza y optimizaciÃ³n de equipo', 80000.00, '2 horas', 'Mantenimiento', NULL, 'activo'),
(2, 'InstalaciÃ³n de Software', 'InstalaciÃ³n y configuraciÃ³n de programas', 50000.00, '1 hora', 'Soporte', NULL, 'activo'),
(3, 'ReparaciÃ³n de Celulares', 'DiagnÃ³stico y reparaciÃ³n de mÃ³viles', 100000.00, '3 dÃ­as', 'ReparaciÃ³n', NULL, 'activo'),
(4, 'AsesorÃ­a TÃ©cnica',        'AsesorÃ­a personalizada', 60000.00, '1 hora', 'ConsultorÃ­a', NULL, 'activo');

-- ============================================
-- TABLA: pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20) NOT NULL,
  direccion_envio     VARCHAR(200) NOT NULL,
  ciudad              VARCHAR(100) DEFAULT 'BogotÃ¡',
  metodo_pago         VARCHAR(50) NOT NULL,
  notas               TEXT,
  subtotal            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  envio               DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  estado              ENUM('en revision', 'revisado', 'hecho', 'cancelado') DEFAULT 'en revision',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: pedido_items
-- ============================================
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

-- ============================================
-- TABLA: citas_servicios
-- ============================================
CREATE TABLE IF NOT EXISTS citas_servicios (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  servicio_id         INT NOT NULL,
  usuario_id          INT NULL,
  cliente_nombre      VARCHAR(100) NOT NULL,
  cliente_email       VARCHAR(100) NOT NULL,
  cliente_telefono    VARCHAR(20) NOT NULL,
  fecha_cita          DATE NOT NULL,
  hora_cita           TIME NOT NULL,
  direccion           VARCHAR(200),
  notas               TEXT,
  estado              ENUM('en revision', 'revisado', 'hecho', 'cancelado') DEFAULT 'en revision',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;