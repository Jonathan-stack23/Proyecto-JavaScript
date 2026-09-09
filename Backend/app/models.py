from typing import Any
from datetime import datetime, timezone
from decimal import Decimal
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
from sqlalchemy.orm import relationship, Mapped, mapped_column, DeclarativeBase
try:
    from .database import Base
except (ImportError, ValueError):
    from app.database import Base

def _now():
    return datetime.now(timezone.utc)

rol_permisos = Table(
    "rol_permisos",
    Base.metadata,
    Column("rol_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permiso_id", Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True),
)

class Rol(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuarios: Mapped[list["Usuario"]] = relationship("Usuario", back_populates="rol")
    permisos: Mapped[list["Permiso"]] = relationship("Permiso", secondary=rol_permisos, back_populates="roles")


class Permiso(Base):
    __tablename__ = "permisos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)

    roles: Mapped[list["Rol"]] = relationship("Rol", secondary=rol_permisos, back_populates="permisos")


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    tipo_documento: Mapped[str] = mapped_column(String(10), nullable=False, default="CC")
    numero_documento: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    direccion: Mapped[str] = mapped_column(String(100), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    rol_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, default=3)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="activo", index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    rol: Mapped["Rol"] = relationship("Rol", back_populates="usuarios")
    productos: Mapped[list["Producto"]] = relationship("Producto", back_populates="usuario")
    servicios: Mapped[list["Servicio"]] = relationship("Servicio", back_populates="usuario")
    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", back_populates="usuario")
    citas: Mapped[list["CitaServicio"]] = relationship("CitaServicio", back_populates="usuario")


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    imagen_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="activo", index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Mapped["Usuario | None"] = relationship("Usuario", back_populates="productos")
    items_pedido: Mapped[list["PedidoItem"]] = relationship("PedidoItem", back_populates="producto")


class Servicio(Base):
    __tablename__ = "servicios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duracion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    imagen_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="activo", index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Mapped["Usuario | None"] = relationship("Usuario", back_populates="servicios")
    citas: Mapped[list["CitaServicio"]] = relationship("CitaServicio", back_populates="servicio")


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_email: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    direccion_envio: Mapped[str] = mapped_column(String(200), nullable=False)
    ciudad: Mapped[str | None] = mapped_column(String(100), nullable=True, default="Bogotá")
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=False, default="contraentrega")
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    envio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="en revision")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Mapped["Usuario | None"] = relationship("Usuario", back_populates="pedidos")
    items: Mapped[list["PedidoItem"]] = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    pedido_id: Mapped[int] = mapped_column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    nombre_producto: Mapped[str] = mapped_column(String(150), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    imagen_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    pedido: Mapped["Pedido"] = relationship("Pedido", back_populates="items")
    producto: Mapped["Producto | None"] = relationship("Producto", back_populates="items_pedido")


class CitaServicio(Base):
    __tablename__ = "citas_servicios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    servicio_id: Mapped[int] = mapped_column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_email: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_cita: Mapped[str] = mapped_column(String(20), nullable=False)
    hora_cita: Mapped[str] = mapped_column(String(20), nullable=False)
    direccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="en revision")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    servicio: Mapped["Servicio"] = relationship("Servicio", back_populates="citas")
    usuario: Mapped["Usuario | None"] = relationship("Usuario", back_populates="citas")
