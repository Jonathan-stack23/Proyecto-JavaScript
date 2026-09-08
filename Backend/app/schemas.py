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
