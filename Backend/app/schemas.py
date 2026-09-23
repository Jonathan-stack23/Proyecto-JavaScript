from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

# ----------------- AUTENTICACIÓN Y USUARIOS -----------------

class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)
    apellido: str = Field(..., min_length=2, max_length=50)
    tipo_documento: str = Field(default="CC", min_length=2, max_length=10)
    numero_documento: str = Field(..., min_length=5, max_length=20)
    direccion: str = Field(..., min_length=4, max_length=100)
    telefono: str = Field(..., min_length=7, max_length=20)
    email: EmailStr

class UsuarioRegistro(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)
    apellido: str = Field(..., min_length=2, max_length=50)
    tipo_documento: Optional[str] = Field(default="CC")
    tipoDocumento: Optional[str] = None
    numero_documento: Optional[str] = None
    numeroDocumento: Optional[str] = None
    direccion: str = Field(..., min_length=4, max_length=100)
    telefono: str = Field(..., min_length=7, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)

    @model_validator(mode="before")
    @classmethod
    def unify_camel_snake(cls, values: Any):
        if isinstance(values, dict):
            # Normalizar tipoDocumento -> tipo_documento
            if "tipoDocumento" in values and values["tipoDocumento"]:
                values["tipo_documento"] = values["tipoDocumento"]
            # Normalizar numeroDocumento -> numero_documento
            if "numeroDocumento" in values and values["numeroDocumento"]:
                values["numero_documento"] = values["numeroDocumento"]
            # Asegurar que numero_documento exista
            if not values.get("numero_documento"):
                raise ValueError("El número de documento es obligatorio.")
        return values

class UsuarioCreate(UsuarioRegistro):
    rol_id: Optional[int] = 3
    estado: Optional[str] = "activo"

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=50)
    apellido: Optional[str] = Field(None, min_length=2, max_length=50)
    tipo_documento: Optional[str] = None
    tipoDocumento: Optional[str] = None
    numero_documento: Optional[str] = None
    numeroDocumento: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol_id: Optional[int] = None
    estado: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def unify_fields(cls, values: Any):
        if isinstance(values, dict):
            if "tipoDocumento" in values and values["tipoDocumento"]:
                values["tipo_documento"] = values["tipoDocumento"]
            if "numeroDocumento" in values and values["numeroDocumento"]:
                values["numero_documento"] = values["numeroDocumento"]
        return values

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    rol_id: int
    rol: Optional[str] = None
    rol_nombre: Optional[str] = None
    estado: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr
    newPassword: str = Field(..., min_length=6)

class RecuperarSolicitarCodigo(BaseModel):
    email: EmailStr

class RecuperarVerificarCodigo(BaseModel):
    email: EmailStr
    codigo: str = Field(..., min_length=4, max_length=10)

class RecuperarResetPassword(BaseModel):
    email: EmailStr
    codigo: str = Field(..., min_length=4, max_length=10)
    newPassword: str = Field(..., min_length=6)

class EstadoUpdateRequest(BaseModel):
    estado: str = Field(..., pattern="^(activo|inactivo|en revision|revisado|hecho|cancelado)$")

# ----------------- ROLES Y PERMISOS -----------------

class RolResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- PRODUCTOS -----------------

class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    descripcion: Optional[str] = None
    precio: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: Optional[str] = "activo"

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: Optional[str] = None

class ProductoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: str
    usuario_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- SERVICIOS -----------------

class ServicioBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    descripcion: Optional[str] = None
    precio: float = Field(..., gt=0)
    duracion: Optional[str] = None
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: Optional[str] = "activo"

class ServicioCreate(ServicioBase):
    usuario_id: Optional[int] = None

class ServicioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, gt=0)
    duracion: Optional[str] = None
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: Optional[str] = None
    usuario_id: Optional[int] = None

class ServicioResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    duracion: Optional[str] = None
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: str
    usuario_id: Optional[int] = None
    empleado_nombre: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- PEDIDOS -----------------

class PedidoItemIn(BaseModel):
    producto_id: Optional[int] = None
    id: Optional[int] = None
    nombre: Optional[str] = None
    nombre_producto: Optional[str] = None
    precio: Optional[float] = None
    precio_unitario: Optional[float] = None
    cantidad: int = Field(default=1, ge=1)
    subtotal: Optional[float] = None
    imagen_url: Optional[str] = None

class PedidoCreate(BaseModel):
    cliente_nombre: str
    cliente_email: EmailStr
    cliente_telefono: str
    direccion_envio: str
    ciudad: Optional[str] = "Bogotá"
    metodo_pago: str = "contraentrega"
    notas: Optional[str] = None
    items: List[PedidoItemIn]
    subtotal: Optional[float] = 0.0
    envio: Optional[float] = 0.0
    total: Optional[float] = 0.0

# ----------------- CITAS -----------------

class CitaCreate(BaseModel):
    servicio_id: int
    cliente_nombre: str
    cliente_email: EmailStr
    cliente_telefono: str
    fecha_cita: str
    hora_cita: str
    direccion: Optional[str] = None
    notas: Optional[str] = None


# =============================================================================
# ESQUEMAS QUINTO AVANCE: VENTAS, FACTURAS, PQR, CHATBOT Y DASHBOARD
# =============================================================================

# ----------------- VENTAS -----------------

class ItemVentaCreate(BaseModel):
    tipo_item: str = Field(default="producto", description="'producto' o 'servicio'")
    producto_id: Optional[int] = None
    servicio_id: Optional[int] = None
    nombre_item: str
    precio_unitario: float = Field(..., ge=0)
    cantidad: int = Field(default=1, ge=1)
    descuento: Optional[float] = Field(default=0.0, ge=0)

class VentaCreate(BaseModel):
    cliente_id: Optional[int] = None
    cliente_nombre: str
    cliente_documento: Optional[str] = "222222222222"
    cliente_email: EmailStr
    cliente_telefono: str
    direccion_entrega: Optional[str] = None
    ciudad: Optional[str] = "Bogotá"
    metodo_pago: str = "efectivo"
    descuento: Optional[float] = 0.0
    impuestos: Optional[float] = 0.0
    notas: Optional[str] = None
    items: List[ItemVentaCreate]

class DetalleVentaResponse(BaseModel):
    id: int
    tipo_item: str
    producto_id: Optional[int] = None
    servicio_id: Optional[int] = None
    nombre_item: str
    precio_unitario: float
    cantidad: int
    descuento: float
    subtotal: float

    class Config:
        from_attributes = True

class VentaResponse(BaseModel):
    id: int
    numero_venta: str
    cliente_id: Optional[int] = None
    usuario_id: Optional[int] = None
    cliente_nombre: str
    cliente_documento: Optional[str] = None
    cliente_email: str
    cliente_telefono: str
    direccion_entrega: Optional[str] = None
    ciudad: Optional[str] = None
    metodo_pago: str
    subtotal: float
    descuento: float
    impuestos: float
    total: float
    estado: str
    notas: Optional[str] = None
    fecha_venta: Optional[datetime] = None
    detalles: List[DetalleVentaResponse] = []

    class Config:
        from_attributes = True


# ----------------- FACTURAS -----------------

class FacturaCreate(BaseModel):
    venta_id: int
    cliente_documento: Optional[str] = None
    cliente_direccion: Optional[str] = None
    ciudad: Optional[str] = "Bogotá"

class DetalleFacturaResponse(BaseModel):
    id: int
    tipo_item: str
    nombre_item: str
    precio_unitario: float
    cantidad: int
    subtotal: float

    class Config:
        from_attributes = True

class FacturaResponse(BaseModel):
    id: int
    numero_factura: str
    venta_id: int
    cliente_id: Optional[int] = None
    cliente_nombre: str
    cliente_documento: str
    cliente_email: str
    cliente_telefono: Optional[str] = None
    cliente_direccion: Optional[str] = None
    ciudad: Optional[str] = None
    subtotal: float
    impuestos: float
    descuento: float
    total: float
    metodo_pago: str
    estado: str
    fecha_emision: Optional[datetime] = None
    detalles: List[DetalleFacturaResponse] = []

    class Config:
        from_attributes = True


# ----------------- PQR -----------------

class PQRCreate(BaseModel):
    tipo: str = Field(..., description="'peticion', 'queja', 'reclamo' o 'sugerencia'")
    asunto: str = Field(..., min_length=4, max_length=150)
    descripcion: str = Field(..., min_length=10)
    prioridad: Optional[str] = "media"
    cliente_nombre: Optional[str] = None
    cliente_email: Optional[EmailStr] = None
    cliente_telefono: Optional[str] = None

class PQRRespuesta(BaseModel):
    respuesta: str = Field(..., min_length=5)
    estado: str = Field(default="respondida", description="'en proceso', 'respondida', 'cerrada'")

class PQRResponse(BaseModel):
    id: int
    numero_radicado: str
    usuario_id: Optional[int] = None
    cliente_nombre: str
    cliente_email: str
    cliente_telefono: Optional[str] = None
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    prioridad: str
    respuesta: Optional[str] = None
    respondido_por_id: Optional[int] = None
    respondido_por_nombre: Optional[str] = None
    fecha_radicado: Optional[datetime] = None
    fecha_respuesta: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------- CHATBOT CON IA -----------------

class ChatbotMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None

class ChatbotMessageResponse(BaseModel):
    ok: bool = True
    session_id: str
    reply: str
    source: str = "ai"  # 'ai' (OpenAI/Gemini) o 'local_knowledge'
    suggestions: List[str] = []


# ----------------- DASHBOARD Y ESTADÍSTICAS -----------------

class DashboardStatsResponse(BaseModel):
    total_usuarios: int
    total_productos: int
    total_servicios: int
    total_ventas: int
    facturacion_total: float
    pqr_totales: int
    pqr_pendientes: int
    ventas_hoy: int
    facturacion_hoy: float

class ChartDataPoint(BaseModel):
    label: str
    valor: float
    cantidad: Optional[int] = None

class DashboardChartsResponse(BaseModel):
    ventas_por_periodo: List[ChartDataPoint]
    ingresos_por_periodo: List[ChartDataPoint]
    productos_mas_vendidos: List[ChartDataPoint]
    servicios_mas_solicitados: List[ChartDataPoint]

