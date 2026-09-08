# =============================================================================
# RUTAS DE PRODUCTOS - productos.py
# Gestiona el CRUD completo del catálogo de productos: listar (público),
# obtener por ID (público), crear, editar, cambiar estado y eliminar.
# Las operaciones de escritura requieren rol Administrador o Empleado.
# =============================================================================

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Producto, Usuario
    from ..schemas import ProductoCreate, ProductoUpdate, EstadoUpdateRequest
    from ..dependencies import require_role
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Producto, Usuario
    from app.schemas import ProductoCreate, ProductoUpdate, EstadoUpdateRequest
    from app.dependencies import require_role

# Router con prefijo /productos; agrupa los endpoints bajo el tag "Productos"
router = APIRouter(prefix="/productos", tags=["Productos"])


# -----------------------------------------------------------------------------
# FUNCIÓN AUXILIAR: Serializar un objeto Producto a diccionario JSON
# Convierte el modelo ORM en un dict plano con todos sus campos.
# El precio se convierte explícitamente a float para compatibilidad JSON.
# -----------------------------------------------------------------------------
def serialize_producto(p: Any) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "precio": float(p.precio) if p.precio is not None else 0.0,
        "stock": p.stock,
        "categoria": p.categoria,
        "imagen_url": p.imagen_url,
        "estado": p.estado,
        "usuario_id": p.usuario_id,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


# -----------------------------------------------------------------------------
# GET /api/productos
# Lista todos los productos del catálogo.
# Acepta el parámetro opcional ?activos=true para filtrar solo los activos.
# Endpoint público — no requiere autenticación.
# -----------------------------------------------------------------------------
@router.get("")
def get_productos(
    activos: Optional[str] = Query(None, description="Filtrar solo activos ('true')"),
    db: Session = Depends(get_db),
):
    query = db.query(Producto)
    if activos and activos.lower() == "true":
        # Aplicar filtro para retornar únicamente productos con estado 'activo'
        query = query.filter(Producto.estado == "activo")
    productos = query.order_by(Producto.created_at.desc()).all()
    return {
        "ok": True,
        "total": len(productos),
        "productos": [serialize_producto(p) for p in productos],
    }


# -----------------------------------------------------------------------------
# GET /api/productos/{id}
# Retorna los detalles de un producto específico por su ID.
# Endpoint público — no requiere autenticación.
# -----------------------------------------------------------------------------
@router.get("/{id}")
def get_producto_by_id(id: int, db: Session = Depends(get_db)):
    prod = db.query(Producto).filter(Producto.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Producto no encontrado."},
        )
    return {"ok": True, "producto": serialize_producto(prod)}


# -----------------------------------------------------------------------------
# POST /api/productos
# Crea un nuevo producto en el catálogo.
# Asigna automáticamente el usuario logueado como creador del producto.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_producto(
    data: ProductoCreate,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    # Crear el objeto Producto con los datos validados por el schema Pydantic
    new_prod = Producto(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        precio=data.precio,
        stock=data.stock,
        categoria=data.categoria.strip() if data.categoria else None,
        imagen_url=data.imagen_url.strip() if data.imagen_url else None,
        estado=data.estado or "activo",
        usuario_id=current_user.id,  # Asignar el creador al producto
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    return {
        "ok": True,
        "message": "Producto creado exitosamente.",
        "producto": serialize_producto(new_prod),
    }


# -----------------------------------------------------------------------------
# PUT /api/productos/{id}
# Actualiza los datos de un producto existente por su ID.
# Solo se modifican los campos que se envíen en el body (actualización parcial).
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.put("/{id}")
def update_producto(
    id: int,
    data: ProductoUpdate,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    prod = db.query(Producto).filter(Producto.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Producto no encontrado."},
        )

    # Actualizar cada campo solo si fue incluido en la solicitud
    if data.nombre is not None:
        prod.nombre = data.nombre.strip()
    if data.descripcion is not None:
        prod.descripcion = data.descripcion.strip()
    if data.precio is not None:
        prod.precio = data.precio
    if data.stock is not None:
        prod.stock = data.stock
    if data.categoria is not None:
        prod.categoria = data.categoria.strip()
    if data.imagen_url is not None:
        prod.imagen_url = data.imagen_url.strip()
    if data.estado is not None:
        prod.estado = data.estado

    db.commit()
    db.refresh(prod)

    return {
        "ok": True,
        "message": "Producto actualizado exitosamente.",
        "producto": serialize_producto(prod),
    }


# -----------------------------------------------------------------------------
# PATCH /api/productos/{id}/estado
# Cambia el estado de un producto entre 'activo' e 'inactivo'.
# Si no se envía un estado específico en el body, alterna el estado actual.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.patch("/{id}/estado")
def toggle_estado_producto(
    id: int,
    data: Optional[EstadoUpdateRequest] = None,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    prod = db.query(Producto).filter(Producto.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Producto no encontrado."},
        )

    # Si se envía un estado explícito, usarlo; si no, alternar entre activo/inactivo
    nuevo_estado = data.estado if data and data.estado else ("inactivo" if prod.estado == "activo" else "activo")
    prod.estado = nuevo_estado
    db.commit()
    db.refresh(prod)

    return {
        "ok": True,
        "message": f"Estado del producto cambiado a '{nuevo_estado}'.",
        "producto": serialize_producto(prod),
        "estado": nuevo_estado,
        "nuevoEstado": nuevo_estado,
    }


# -----------------------------------------------------------------------------
# DELETE /api/productos/{id}
# Elimina permanentemente un producto del catálogo.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.delete("/{id}")
def delete_producto(
    id: int,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    prod = db.query(Producto).filter(Producto.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Producto no encontrado."},
        )

    db.delete(prod)
    db.commit()

    return {"ok": True, "message": "Producto eliminado exitosamente."}
