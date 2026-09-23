"""
Rutas de PQR (Peticiones, Quejas, Reclamos y Sugerencias) - Quinto Avance
Módulo completo de atención ciudadana y soporte al cliente con generación de radicados únicos,
seguimiento de estados y gestión de respuestas por administradores y empleados.
"""
from typing import Optional, List, Any
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.database import get_db
from app.models import Usuario, PQR
from app.schemas import PQRCreate, PQRRespuesta, PQRResponse
from app.dependencies import get_current_user, require_role, get_optional_current_user

router = APIRouter(prefix="/pqr", tags=["PQR"])


def serialize_pqr(p: PQR) -> dict:
    respondido_nombre = None
    if p.respondido_por:
        respondido_nombre = f"{p.respondido_por.nombre} {p.respondido_por.apellido or ''}".strip()

    return {
        "id": p.id,
        "numero_radicado": p.numero_radicado,
        "usuario_id": p.usuario_id,
        "cliente_nombre": p.cliente_nombre,
        "cliente_email": p.cliente_email,
        "cliente_telefono": p.cliente_telefono,
        "tipo": p.tipo,
        "asunto": p.asunto,
        "descripcion": p.descripcion,
        "estado": p.estado,
        "prioridad": p.prioridad,
        "respuesta": p.respuesta,
        "respondido_por_id": p.respondido_por_id,
        "respondido_por_nombre": respondido_nombre,
        "fecha_radicado": p.fecha_radicado.isoformat() if p.fecha_radicado else None,
        "fecha_respuesta": p.fecha_respuesta.isoformat() if p.fecha_respuesta else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def generate_radicado_pqr(db: Session) -> str:
    current_year = datetime.now().year
    prefix = f"PQR-{current_year}-"
    last_pqr = (
        db.query(PQR)
        .filter(PQR.numero_radicado.like(f"{prefix}%"))
        .order_by(desc(PQR.id))
        .first()
    )
    if last_pqr and last_pqr.numero_radicado:
        try:
            last_seq = int(last_pqr.numero_radicado.split("-")[-1])
            new_seq = last_seq + 1
        except Exception:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


@router.post("", status_code=status.HTTP_201_CREATED)
def radicar_pqr(
    pqr_in: PQRCreate,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Radica una nueva solicitud de PQR (Petición, Queja, Reclamo o Sugerencia).
    Genera un número de radicado consecutivo único (PQR-2026-XXXX).
    Permite radicación tanto de usuarios autenticados como de clientes invitados.
    """
    cliente_nombre = pqr_in.cliente_nombre
    cliente_email = pqr_in.cliente_email
    cliente_telefono = pqr_in.cliente_telefono
    usuario_id = None

    if current_user:
        usuario_id = current_user.id
        if not cliente_nombre:
            cliente_nombre = f"{current_user.nombre} {current_user.apellido or ''}".strip()
        if not cliente_email:
            cliente_email = current_user.email
        if not cliente_telefono and current_user.telefono:
            cliente_telefono = current_user.telefono

    if not cliente_nombre or not cliente_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre y el correo electrónico son obligatorios para radicar la PQR.",
        )

    tipo_norm = pqr_in.tipo.lower().strip()
    tipos_validos = ["peticion", "petición", "queja", "reclamo", "sugerencia"]
    if tipo_norm not in tipos_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de PQR inválido. Debe ser: peticion, queja, reclamo o sugerencia.",
        )
    if tipo_norm == "petición":
        tipo_norm = "peticion"

    radicado = generate_radicado_pqr(db)

    nueva_pqr = PQR(
        numero_radicado=radicado,
        usuario_id=usuario_id,
        cliente_nombre=cliente_nombre,
        cliente_email=str(cliente_email),
        cliente_telefono=cliente_telefono,
        tipo=tipo_norm,
        asunto=pqr_in.asunto.strip(),
        descripcion=pqr_in.descripcion.strip(),
        estado="pendiente",
        prioridad=pqr_in.prioridad or "media",
        fecha_radicado=datetime.now(timezone.utc),
    )

    db.add(nueva_pqr)
    db.commit()
    db.refresh(nueva_pqr)

    return {
        "ok": True,
        "mensaje": f"PQR radicada exitosamente con número {radicado}",
        "pqr": serialize_pqr(nueva_pqr),
    }


@router.get("")
def listar_pqrs(
    tipo: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Búsqueda por radicado, asunto, cliente o email"),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    """
    Listado general de PQR con filtros avanzados para Administradores y Empleados.
    """
    query = db.query(PQR)

    if tipo:
        query = query.filter(PQR.tipo.ilike(f"%{tipo}%"))
    if estado:
        query = query.filter(PQR.estado == estado.lower())
    if prioridad:
        query = query.filter(PQR.prioridad == prioridad.lower())

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                PQR.numero_radicado.ilike(search_term),
                PQR.asunto.ilike(search_term),
                PQR.cliente_nombre.ilike(search_term),
                PQR.cliente_email.ilike(search_term),
            )
        )

    if fecha_inicio:
        try:
            dt_inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(PQR.fecha_radicado >= dt_inicio)
        except ValueError:
            pass

    if fecha_fin:
        try:
            dt_fin = datetime.strptime(fecha_fin, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(PQR.fecha_radicado <= dt_fin)
        except ValueError:
            pass

    pqrs = query.order_by(desc(PQR.fecha_radicado)).all()

    # Métricas de resumen rápido
    total_pendientes = db.query(func.count(PQR.id)).filter(PQR.estado == "pendiente").scalar() or 0
    total_en_proceso = db.query(func.count(PQR.id)).filter(PQR.estado == "en proceso").scalar() or 0
    total_respondidas = db.query(func.count(PQR.id)).filter(PQR.estado == "respondida").scalar() or 0
    total_cerradas = db.query(func.count(PQR.id)).filter(PQR.estado == "cerrada").scalar() or 0

    return {
        "ok": True,
        "resumen": {
            "total": len(pqrs),
            "pendientes": total_pendientes,
            "en_proceso": total_en_proceso,
            "respondidas": total_respondidas,
            "cerradas": total_cerradas,
        },
        "pqrs": [serialize_pqr(p) for p in pqrs],
    }


@router.get("/mis-pqr")
def mis_pqrs(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene las PQR radicadas por el cliente actualmente autenticado.
    """
    pqrs = (
        db.query(PQR)
        .filter(or_(PQR.usuario_id == current_user.id, PQR.cliente_email.ilike(current_user.email)))
        .order_by(desc(PQR.fecha_radicado))
        .all()
    )
    return {
        "ok": True,
        "total": len(pqrs),
        "pqrs": [serialize_pqr(p) for p in pqrs],
    }


@router.get("/radicado/{numero_radicado}")
def consultar_pqr_por_radicado(
    numero_radicado: str,
    db: Session = Depends(get_db),
):
    """
    Consulta pública del estado de una PQR utilizando el número de radicado.
    Ideal para consulta directa desde el Chatbot o portal web.
    """
    pqr = db.query(PQR).filter(PQR.numero_radicado == numero_radicado.strip().upper()).first()
    if not pqr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ninguna solicitud con el radicado {numero_radicado}.",
        )
    return {
        "ok": True,
        "pqr": serialize_pqr(pqr),
    }


@router.get("/{id}")
def obtener_detalle_pqr(
    id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene el detalle de una PQR específica.
    """
    pqr = db.query(PQR).filter(PQR.id == id).first()
    if not pqr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PQR no encontrada.")

    # Seguridad: solo admin/empleado o el propietario
    rol_nombre = current_user.rol.nombre if current_user.rol else ""
    if rol_nombre not in ["Administrador", "Empleado"]:
        if pqr.usuario_id != current_user.id and pqr.cliente_email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para consultar esta PQR.",
            )

    return {
        "ok": True,
        "pqr": serialize_pqr(pqr),
    }


@router.patch("/{id}/responder")
def responder_pqr(
    id: int,
    respuesta_in: PQRRespuesta,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    """
    Registra la respuesta formal a una PQR y actualiza su estado.
    Exclusivo para usuarios con rol Administrador o Empleado.
    """
    pqr = db.query(PQR).filter(PQR.id == id).first()
    if not pqr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PQR no encontrada.")

    nuevo_estado = respuesta_in.estado.lower().strip()
    if nuevo_estado not in ["en proceso", "respondida", "cerrada"]:
        nuevo_estado = "respondida"

    pqr.respuesta = respuesta_in.respuesta.strip()
    pqr.estado = nuevo_estado
    pqr.respondido_por_id = current_user.id
    pqr.fecha_respuesta = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pqr)

    return {
        "ok": True,
        "mensaje": f"Respuesta registrada exitosamente para la PQR {pqr.numero_radicado}.",
        "pqr": serialize_pqr(pqr),
    }
