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
    ventas: Mapped[list["Venta"]] = relationship("Venta", foreign_keys="[Venta.cliente_id]", back_populates="cliente")
    facturas: Mapped[list["Factura"]] = relationship("Factura", back_populates="cliente")
    pqrs: Mapped[list["PQR"]] = relationship("PQR", foreign_keys="[PQR.usuario_id]", back_populates="usuario")


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
    venta: Mapped["Venta | None"] = relationship("Venta", back_populates="pedido", uselist=False)


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


class CodigoRecuperacion(Base):
    __tablename__ = "codigos_recuperacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    codigo: Mapped[str] = mapped_column(String(10), nullable=False)
    expira_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usado: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)


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


# =============================================================================
# MODELOS QUINTO AVANCE: VENTAS, FACTURACIÓN, PQR Y CHATBOT CON IA
# =============================================================================

class Venta(Base):
    __tablename__ = "ventas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_venta: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    cliente_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_documento: Mapped[str | None] = mapped_column(String(20), nullable=True, default="222222222222")
    cliente_email: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    direccion_entrega: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ciudad: Mapped[str | None] = mapped_column(String(100), nullable=True, default="Bogotá")
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=False, default="efectivo")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    descuento: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    impuestos: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="completada")
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_venta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    pedido_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("pedidos.id", ondelete="SET NULL"), nullable=True)
    cliente: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[cliente_id], back_populates="ventas")
    usuario: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[usuario_id])
    pedido: Mapped["Pedido | None"] = relationship("Pedido", back_populates="venta")
    detalles: Mapped[list["DetalleVenta"]] = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    factura: Mapped["Factura | None"] = relationship("Factura", back_populates="venta", uselist=False)


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    venta_id: Mapped[int] = mapped_column(Integer, ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False)
    tipo_item: Mapped[str] = mapped_column(String(20), nullable=False, default="producto")
    producto_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    servicio_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("servicios.id", ondelete="SET NULL"), nullable=True)
    nombre_item: Mapped[str] = mapped_column(String(150), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    descuento: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    venta: Mapped["Venta"] = relationship("Venta", back_populates="detalles")
    producto: Mapped["Producto | None"] = relationship("Producto")
    servicio: Mapped["Servicio | None"] = relationship("Servicio")


class Factura(Base):
    __tablename__ = "facturas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_factura: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    venta_id: Mapped[int] = mapped_column(Integer, ForeignKey("ventas.id", ondelete="CASCADE"), unique=True, nullable=False)
    pedido_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("pedidos.id", ondelete="SET NULL"), nullable=True)
    cliente_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_documento: Mapped[str] = mapped_column(String(20), nullable=False)
    cliente_email: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cliente_direccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ciudad: Mapped[str | None] = mapped_column(String(100), nullable=True, default="Bogotá")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    impuestos: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    descuento: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=False, default="efectivo")
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="emitida")
    fecha_emision: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    venta: Mapped["Venta"] = relationship("Venta", back_populates="factura")
    pedido: Mapped["Pedido | None"] = relationship("Pedido")
    cliente: Mapped["Usuario | None"] = relationship("Usuario", back_populates="facturas")
    detalles: Mapped[list["DetalleFactura"]] = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    factura_id: Mapped[int] = mapped_column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    tipo_item: Mapped[str] = mapped_column(String(20), nullable=False, default="producto")
    nombre_item: Mapped[str] = mapped_column(String(150), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    factura: Mapped["Factura"] = relationship("Factura", back_populates="detalles")


class PQR(Base):
    __tablename__ = "pqr"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_radicado: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_email: Mapped[str] = mapped_column(String(100), nullable=False)
    cliente_telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tipo: Mapped[str] = mapped_column(String(30), nullable=False)  # peticion, queja, reclamo, sugerencia
    asunto: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="pendiente")  # pendiente, en proceso, respondida, cerrada
    prioridad: Mapped[str] = mapped_column(String(20), nullable=False, default="media")  # baja, media, alta
    respuesta: Mapped[str | None] = mapped_column(Text, nullable=True)
    respondido_por_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_radicado: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    fecha_respuesta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    usuario: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[usuario_id], back_populates="pqrs")
    respondido_por: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[respondido_por_id])


class ConversacionChatbot(Base):
    __tablename__ = "conversaciones_chatbot"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    mensajes: Mapped[list["MensajeChatbot"]] = relationship("MensajeChatbot", back_populates="conversacion", cascade="all, delete-orphan")


class MensajeChatbot(Base):
    __tablename__ = "mensajes_chatbot"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    conversacion_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversaciones_chatbot.id", ondelete="CASCADE"), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)  # usuario, asistente, sistema
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now)

    conversacion: Mapped["ConversacionChatbot"] = relationship("ConversacionChatbot", back_populates="mensajes")

