from typing import Any
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    DateTime,
    ForeignKey,
    Table,
)
from sqlalchemy.orm import relationship
try:
    from .database import Base
except (ImportError, ValueError):
    from app.database import Base

# Función auxiliar para timestamps timezone-aware (reemplaza el deprecado datetime.utcnow)
def _now():
    return datetime.now(timezone.utc)

# Tabla asociativa Rol - Permisos
rol_permisos = Table(
    "rol_permisos",
    Base.metadata,
    Column("rol_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permiso_id", Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True),
)

class Rol(Base):
    __tablename__ = "roles"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Any = Column(String(50), unique=True, nullable=False, index=True)
    descripcion: Any = Column(String(200), nullable=True)
    created_at: Any = Column(DateTime(timezone=True), default=_now)
    updated_at: Any = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuarios: Any = relationship("Usuario", back_populates="rol")
    permisos: Any = relationship("Permiso", secondary=rol_permisos, back_populates="roles")


class Permiso(Base):
    __tablename__ = "permisos"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Any = Column(String(100), unique=True, nullable=False)
    descripcion: Any = Column(String(200), nullable=True)
    created_at: Any = Column(DateTime(timezone=True), default=_now)

    roles: Any = relationship("Rol", secondary=rol_permisos, back_populates="permisos")


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Any = Column(String(50), nullable=False)
    apellido: Any = Column(String(50), nullable=False)
    tipo_documento: Any = Column(String(10), nullable=False, default="CC")
    numero_documento: Any = Column(String(20), unique=True, nullable=False, index=True)
    direccion: Any = Column(String(100), nullable=False)
    telefono: Any = Column(String(20), nullable=False)
    email: Any = Column(String(100), unique=True, nullable=False, index=True)
    password: Any = Column(String(255), nullable=False)
    rol_id: Any = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, default=3)
    estado: Any = Column(String(20), nullable=False, default="activo", index=True)
    created_at: Any = Column(DateTime(timezone=True), default=_now)
    updated_at: Any = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    rol: Any = relationship("Rol", back_populates="usuarios")
    productos: Any = relationship("Producto", back_populates="usuario")
    servicios: Any = relationship("Servicio", back_populates="usuario")
    pedidos: Any = relationship("Pedido", back_populates="usuario")
    citas: Any = relationship("CitaServicio", back_populates="usuario")


class Producto(Base):
    __tablename__ = "productos"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Any = Column(String(100), nullable=False, index=True)
    descripcion: Any = Column(Text, nullable=True)
    precio: Any = Column(Numeric(10, 2), nullable=False)
    stock: Any = Column(Integer, nullable=False, default=0)
    categoria: Any = Column(String(50), nullable=True, index=True)
    imagen_url: Any = Column(String(255), nullable=True)
    estado: Any = Column(String(20), nullable=False, default="activo", index=True)
    usuario_id: Any = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at: Any = Column(DateTime(timezone=True), default=_now)
    updated_at: Any = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Any = relationship("Usuario", back_populates="productos")
    items_pedido: Any = relationship("PedidoItem", back_populates="producto")


class Servicio(Base):
    __tablename__ = "servicios"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Any = Column(String(100), nullable=False, index=True)
    descripcion: Any = Column(Text, nullable=True)
    precio: Any = Column(Numeric(10, 2), nullable=False)
    duracion: Any = Column(String(50), nullable=True)
    categoria: Any = Column(String(50), nullable=True, index=True)
    imagen_url: Any = Column(String(255), nullable=True)
    estado: Any = Column(String(20), nullable=False, default="activo", index=True)
    usuario_id: Any = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at: Any = Column(DateTime(timezone=True), default=_now)
    updated_at: Any = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Any = relationship("Usuario", back_populates="servicios")
    citas: Any = relationship("CitaServicio", back_populates="servicio")


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id: Any = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Any = Column(String(100), nullable=False)
    cliente_email: Any = Column(String(100), nullable=False)
    cliente_telefono: Any = Column(String(20), nullable=False)
    direccion_envio: Any = Column(String(200), nullable=False)
    ciudad: Any = Column(String(100), nullable=True, default="Bogotá")
    metodo_pago: Any = Column(String(50), nullable=False, default="contraentrega")
    notas: Any = Column(Text, nullable=True)
    subtotal: Any = Column(Numeric(12, 2), nullable=False, default=0.0)
    envio: Any = Column(Numeric(10, 2), nullable=False, default=0.0)
    total: Any = Column(Numeric(12, 2), nullable=False, default=0.0)
    estado: Any = Column(String(30), nullable=False, default="en revision")  # 'en revision', 'revisado', 'hecho', 'cancelado'
    created_at: Any = Column(DateTime(timezone=True), default=_now)
    updated_at: Any = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Any = relationship("Usuario", back_populates="pedidos")
    items: Any = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pedido_id: Any = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id: Any = Column(Integer, ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    nombre_producto: Any = Column(String(150), nullable=False)
    precio_unitario: Any = Column(Numeric(10, 2), nullable=False)
    cantidad: Any = Column(Integer, nullable=False, default=1)
    subtotal: Any = Column(Numeric(12, 2), nullable=False)
    imagen_url: Any = Column(String(255), nullable=True)

    pedido: Any = relationship("Pedido", back_populates="items")
    producto: Any = relationship("Producto", back_populates="items_pedido")


class CitaServicio(Base):
    __tablename__ = "citas_servicios"

    id: Any = Column(Integer, primary_key=True, index=True, autoincrement=True)
    servicio_id: Any = Column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Any = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Any = Column(String(100), nullable=False)
    cliente_email: Any = Column(String(100), nullable=False)
    cliente_telefono: Any = Column(String(20), nullable=False)
    fecha_cita: Any = Column(String(20), nullable=False)  # YYYY-MM-DD
    hora_cita: Any = Column(String(20), nullable=False)   # HH:MM
    direccion: Any = Column(String(200), nullable=True)
    notas: Any = Column(Text, nullable=True)
    estado: Any = Column(String(30), nullable=False, default="en revision")  # 'en revision', 'revisado', 'hecho', 'cancelado'
    created_at: Any = Column(DateTime(timezone=True), default=_now)
    updated_at: Any = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    servicio: Any = relationship("Servicio", back_populates="citas")
    usuario: Any = relationship("Usuario", back_populates="citas")
