# =============================================================================
# RUTAS DE SERVICIOS - servicios.py
# Gestiona el CRUD completo del catálogo de servicios: listar (público),
# obtener por ID (público), crear, editar, cambiar estado y eliminar.
# Las operaciones de escritura requieren rol Administrador o Empleado.
# =============================================================================

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Servicio, Usuario
    from ..schemas import ServicioCreate, ServicioUpdate, EstadoUpdateRequest
    from ..dependencies import require_role
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Servicio, Usuario
    from app.schemas import ServicioCreate, ServicioUpdate, EstadoUpdateRequest
    from app.dependencies import require_role

# Router con prefijo /servicios; agrupa los endpoints bajo el tag "Servicios"
router = APIRouter(prefix="/servicios", tags=["Servicios"])


# -----------------------------------------------------------------------------
# FUNCIÓN AUXILIAR: Serializar un objeto Servicio a diccionario JSON
# Convierte el modelo ORM en un dict plano con todos sus campos.
# empleado asignado al servicio (resuelto desde la relación usuario).
# -----------------------------------------------------------------------------
def serialize_servicio(s: Any) -> dict:
    # Obtener el nombre completo del empleado asignado, si existe
    empleado_nombre = (
        f"{s.usuario.nombre} {s.usuario.apellido}"
        if s.usuario else "Sin asignar"
    )
    return {
        "id": s.id,
        "nombre": s.nombre,
        "descripcion": s.descripcion,
        "precio": float(s.precio) if s.precio is not None else 0.0,
        "duracion": s.duracion,
        "categoria": s.categoria,
        "imagen_url": s.imagen_url,
        "estado": s.estado,
        "usuario_id": s.usuario_id,
        "empleado_nombre": empleado_nombre,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


# -----------------------------------------------------------------------------
# GET /api/servicios
# Lista todos los servicios del catálogo.
# Acepta el parámetro opcional ?activos=true para filtrar solo los activos.
# Endpoint público — no requiere autenticación.
# -----------------------------------------------------------------------------
@router.get("")
def get_servicios(
    activos: Optional[str] = Query(None, description="Filtrar solo activos ('true')"),
    db: Session = Depends(get_db),
):
    query = db.query(Servicio)
    if activos and activos.lower() == "true":
        # Aplicar filtro para retornar únicamente servicios con estado 'activo'
        query = query.filter(Servicio.estado == "activo")
    servicios = query.order_by(Servicio.created_at.desc()).all()
    return {
        "ok": True,
        "total": len(servicios),
        "servicios": [serialize_servicio(s) for s in servicios],
    }


# -----------------------------------------------------------------------------
# GET /api/servicios/{id}
# Retorna los detalles de un servicio específico por su ID.
# Endpoint público — no requiere autenticación.
# -----------------------------------------------------------------------------
@router.get("/{id}")
def get_servicio_by_id(id: int, db: Session = Depends(get_db)):
    srv = db.query(Servicio).filter(Servicio.id == id).first()
    if not srv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Servicio no encontrado."},
        )
    return {"ok": True, "servicio": serialize_servicio(srv)}


# -----------------------------------------------------------------------------
# POST /api/servicios
# Crea un nuevo servicio en el catálogo.
# Si no se especifica un usuario asignado (usuario_id), se asigna automáticamente
# el empleado o administrador que está creando el servicio.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_servicio(
    data: ServicioCreate,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    # Si no se especifica usuario asignado, usar el usuario logueado como responsable
    assigned_user_id = data.usuario_id or current_user.id

    new_srv = Servicio(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        precio=data.precio,
        duracion=data.duracion.strip() if data.duracion else None,
        categoria=data.categoria.strip() if data.categoria else None,
        imagen_url=data.imagen_url.strip() if data.imagen_url else None,
        estado=data.estado or "activo",
        usuario_id=assigned_user_id,
    )
    db.add(new_srv)
    db.commit()
    db.refresh(new_srv)

    return {
        "ok": True,
        "message": "Servicio creado exitosamente.",
        "servicio": serialize_servicio(new_srv),
    }


# -----------------------------------------------------------------------------
# PUT /api/servicios/{id}
# Actualiza los datos de un servicio existente por su ID.
# Solo se modifican los campos que se envíen en el body (actualización parcial).
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.put("/{id}")
def update_servicio(
    id: int,
    data: ServicioUpdate,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    srv = db.query(Servicio).filter(Servicio.id == id).first()
    if not srv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Servicio no encontrado."},
        )

    # Actualizar cada campo solo si fue incluido en la solicitud
    if data.nombre is not None:
        srv.nombre = data.nombre.strip()
    if data.descripcion is not None:
        srv.descripcion = data.descripcion.strip()
    if data.precio is not None:
        srv.precio = data.precio
    if data.duracion is not None:
        srv.duracion = data.duracion.strip()
    if data.categoria is not None:
        srv.categoria = data.categoria.strip()
    if data.imagen_url is not None:
        srv.imagen_url = data.imagen_url.strip()
    if data.estado is not None:
        srv.estado = data.estado
    if data.usuario_id is not None:
        srv.usuario_id = data.usuario_id

    db.commit()
    db.refresh(srv)

    return {
        "ok": True,
        "message": "Servicio actualizado exitosamente.",
        "servicio": serialize_servicio(srv),
    }


# -----------------------------------------------------------------------------
# PATCH /api/servicios/{id}/estado
# Cambia el estado de un servicio entre 'activo' e 'inactivo'.
# Si no se envía un estado específico en el body, alterna el estado actual.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.patch("/{id}/estado")
def toggle_estado_servicio(
    id: int,
    data: Optional[EstadoUpdateRequest] = None,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    srv = db.query(Servicio).filter(Servicio.id == id).first()
    if not srv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Servicio no encontrado."},
        )

    # Si se envía un estado explícito, usarlo; si no, alternar entre activo/inactivo
    nuevo_estado = data.estado if data and data.estado else ("inactivo" if srv.estado == "activo" else "activo")
    srv.estado = nuevo_estado
    db.commit()
    db.refresh(srv)

    return {
        "ok": True,
        "message": f"Estado del servicio cambiado a '{nuevo_estado}'.",
        "servicio": serialize_servicio(srv),
        "estado": nuevo_estado,
        "nuevoEstado": nuevo_estado,
    }


# -----------------------------------------------------------------------------
# DELETE /api/servicios/{id}
# Elimina permanentemente un servicio del catálogo.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.delete("/{id}")
def delete_servicio(
    id: int,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    srv = db.query(Servicio).filter(Servicio.id == id).first()
    if not srv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Servicio no encontrado."},
        )

    db.delete(srv)
    db.commit()

    return {"ok": True, "message": "Servicio eliminado exitosamente."}
