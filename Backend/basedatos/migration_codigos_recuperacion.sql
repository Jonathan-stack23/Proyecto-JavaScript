-- ================================================================
-- MIGRACIÓN: AGREGAR TABLA codigos_recuperacion (PARA RECUPERACIÓN DE CONTRASEÑA
-- Ejecuta esto en phpMyAdmin dentro de tu base de datos "mitienda_db"
-- (NO TOCA TUS DATOS EXISTENTES, SOLO AGREGA LO QUE FALTA
-- Autor: Jonathan Martinez
-- ================================================================

USE mitienda_db;

-- 1) Crear la tabla de códigos de recuperación (si no existe todavía)
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

-- Mensaje de confirmación (s e puede ver en phpMyAdmin en la pestaña SQL.
-- 2) Verificar que se creó la tabla (al finalizar, debería verse en el listado:
SHOW TABLES LIKE 'codigos_recuperacion';
