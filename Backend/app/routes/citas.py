# =============================================================================
# RUTAS DE CITAS - citas.py
# Gestiona el agendamiento de citas para los servicios ofrecidos por MiTienda.
# Permite agendar (público o cliente autenticado), consultar citas propias,
# listar todas las citas (Admin/Empleado) y actualizar el estado de una cita.
# =============================================================================

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import CitaServicio, Servicio, Usuario
    from ..schemas import CitaCreate, EstadoUpdateRequest
    from ..dependencies import (
        get_current_user,
        get_optional_current_user,
        require_role,
    )
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import CitaServicio, Servicio, Usuario
    from app.schemas import CitaCreate, EstadoUpdateRequest
    from app.dependencies import (
        get_current_user,
        get_optional_current_user,
        require_role,
    )

# Router con prefijo /citas; agrupa los endpoints bajo el tag "Citas y Agendamiento"
router = APIRouter(prefix="/citas", tags=["Citas y Agendamiento"])


# -----------------------------------------------------------------------------
# FUNCIÓN AUXILIAR: Serializar un objeto CitaServicio a diccionario JSON
# Convierte el modelo ORM en un dict plano incluyendo el nombre del servicio y
# el nombre del empleado responsable del servicio (resueltos desde relaciones ORM).
# -----------------------------------------------------------------------------
def serialize_cita(c: Any) -> dict:
    # Obtener el nombre del servicio vinculado a la cita
    servicio_nombre = c.servicio.nombre if c.servicio else "Servicio no especificado"

    # Obtener el nombre del empleado responsable del servicio
    empleado_nombre = (
        f"{c.servicio.usuario.nombre} {c.servicio.usuario.apellido}"
        if c.servicio and c.servicio.usuario
        else "Sin asignar"
    )
    return {
        "id": c.id,
        "servicio_id": c.servicio_id,
        "servicio_nombre": servicio_nombre,
        "empleado_nombre": empleado_nombre,
        "usuario_id": c.usuario_id,
        "cliente_nombre": c.cliente_nombre,
        "cliente_email": c.cliente_email,
        "cliente_telefono": c.cliente_telefono,
        "fecha_cita": str(c.fecha_cita),
        "hora_cita": str(c.hora_cita),
        "direccion": c.direccion,
        "notas": c.notas,
        "estado": c.estado,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


# -----------------------------------------------------------------------------
# POST /api/citas
# Crea una nueva cita para un servicio. Acepta tanto clientes autenticados
# como usuarios no registrados (invitados). Verifica que el servicio exista
# antes de agendar la cita.
# -----------------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_cita(
    data: CitaCreate,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    # Verificar que el servicio solicitado exista en la base de datos
    srv = db.query(Servicio).filter(Servicio.id == data.servicio_id).first()
    if not srv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "El servicio especificado no existe."},
        )

    # Si hay un usuario autenticado, asociar la cita a su ID; si no, dejarla como invitado
    user_id = current_user.id if current_user else None

    # Crear y persistir la nueva cita con estado inicial 'en revision'
    nueva_cita = CitaServicio(
        servicio_id=data.servicio_id,
        usuario_id=user_id,
        cliente_nombre=data.cliente_nombre.strip(),
        cliente_email=data.cliente_email.strip().lower(),
        cliente_telefono=data.cliente_telefono.strip(),
        fecha_cita=data.fecha_cita.strip(),
        hora_cita=data.hora_cita.strip(),
        direccion=data.direccion.strip() if data.direccion else None,
        notas=data.notas.strip() if data.notas else None,
        estado="en revision",
    )
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    return {
        "ok": True,
        "message": "Cita agendada exitosamente.",
        "cita": serialize_cita(nueva_cita),
    }


# -----------------------------------------------------------------------------
# GET /api/citas/mis-citas
# Retorna todas las citas agendadas por el cliente actualmente autenticado.
# Requiere token JWT válido (el cliente solo ve sus propias citas).
# -----------------------------------------------------------------------------
@router.get("/mis-citas")
def get_mis_citas(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    citas = (
        db.query(CitaServicio)
        .filter(CitaServicio.usuario_id == current_user.id)
        .order_by(CitaServicio.created_at.desc())
        .all()
    )
    return {
        "ok": True,
        "total": len(citas),
        "citas": [serialize_cita(c) for c in citas],
    }


# -----------------------------------------------------------------------------
# GET /api/citas
# Retorna las citas registradas en el sistema, ordenadas por fecha.
# - Administrador: ve todas las citas.
# - Empleado: solo ve las citas cuyos servicios le están asignados (servicio.usuario_id == empleado.id).
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.get("")
def get_todas_las_citas(
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    query = db.query(CitaServicio)

    is_empleado = getattr(current_user, "rol_id", None) == 2 or (
        current_user.rol and current_user.rol.nombre == "Empleado"
    )
    if is_empleado:
        query = query.join(CitaServicio.servicio).filter(Servicio.usuario_id == current_user.id)

    citas = query.order_by(CitaServicio.created_at.desc()).all()
    return {
        "ok": True,
        "total": len(citas),
        "citas": [serialize_cita(c) for c in citas],
    }


# -----------------------------------------------------------------------------
# PATCH /api/citas/{id}/estado
# Actualiza el estado de una cita (ej: 'en revision' → 'revisado' → 'hecho').
# El body debe incluir el nuevo estado explícitamente.
# Si el usuario es Empleado, solo puede modificar citas de sus servicios asignados.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.patch("/{id}/estado")
def update_estado_cita(
    id: int,
    data: EstadoUpdateRequest,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    cita = db.query(CitaServicio).filter(CitaServicio.id == id).first()
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Cita no encontrada."},
        )

    is_empleado = getattr(current_user, "rol_id", None) == 2 or (
        current_user.rol and current_user.rol.nombre == "Empleado"
    )
    if is_empleado:
        if not cita.servicio or cita.servicio.usuario_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"ok": False, "message": "No tienes permiso para modificar esta cita."},
            )

    # Actualizar el estado de la cita con el valor enviado en el body
    cita.estado = data.estado
    db.commit()
    db.refresh(cita)

    return {
        "ok": True,
        "message": f"Estado de la cita actualizado a '{data.estado}'.",
        "cita": serialize_cita(cita),
    }

