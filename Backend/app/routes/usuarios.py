# =============================================================================
# RUTAS DE USUARIOS - usuarios.py
# Gestiona el CRUD administrativo de usuarios: listar, crear, actualizar,
# cambiar estado (activo/inactivo) y eliminar. Solo accesible por
# Administradores (y Empleados para consultas limitadas).
# =============================================================================

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Usuario, Rol
    from ..schemas import UsuarioCreate, UsuarioUpdate, EstadoUpdateRequest
    from ..security import hash_password
    from ..dependencies import require_role
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Usuario, Rol
    from app.schemas import UsuarioCreate, UsuarioUpdate, EstadoUpdateRequest
    from app.security import hash_password
    from app.dependencies import require_role

# Router con prefijo /usuarios; agrupa los endpoints bajo el tag "Gestión de Usuarios"
router = APIRouter(prefix="/usuarios", tags=["Gestión de Usuarios"])


# -----------------------------------------------------------------------------
# FUNCIÓN AUXILIAR: Serializar un objeto Usuario a diccionario JSON
# Convierte el modelo ORM en un dict plano con todos los campos relevantes,
# incluyendo el nombre del rol resuelto desde la relación.
# -----------------------------------------------------------------------------
def serialize_usuario(u: Any) -> dict:
    rol_nombre = u.rol.nombre if u.rol else "Cliente"
    return {
        "id": u.id,
        "nombre": u.nombre,
        "apellido": u.apellido,
        "tipo_documento": u.tipo_documento,
        "numero_documento": u.numero_documento,
        "direccion": u.direccion,
        "telefono": u.telefono,
        "email": u.email,
        "rol_id": u.rol_id,
        "rol": rol_nombre,
        "rol_nombre": rol_nombre,
        "estado": u.estado,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "updated_at": u.updated_at.isoformat() if u.updated_at else None,
    }


# -----------------------------------------------------------------------------
# GET /api/usuarios/roles
# Lista todos los roles disponibles del sistema (Administrador, Empleado, Cliente).
# Requiere token JWT con rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.get("/roles")
def get_roles(
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    roles = db.query(Rol).all()
    return {
        "ok": True,
        "roles": [{"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion} for r in roles],
    }


# -----------------------------------------------------------------------------
# GET /api/usuarios/check-email?email=...&excludeId=...
# Verifica la disponibilidad de un correo para uso en formularios administrativos.
# Admite el parámetro 'excludeId' para no marcar como conflicto el propio correo
# del usuario que se está editando.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.get("/check-email")
def check_email_admin(
    email: str = Query(..., description="Correo a verificar"),
    excludeId: Optional[int] = Query(None, description="ID de usuario a excluir"),
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    correo = email.strip().lower()
    query = db.query(Usuario).filter(Usuario.email.ilike(correo))
    if excludeId:
        query = query.filter(Usuario.id != excludeId)
    exists = query.first() is not None
    return {
        "ok": True,
        "email": correo,
        "disponible": not exists,
    }


# -----------------------------------------------------------------------------
# GET /api/usuarios
# Retorna el listado completo de todos los usuarios registrados en el sistema.
# Solo accesible por Administradores.
# -----------------------------------------------------------------------------
@router.get("")
def get_usuarios(
    current_user: Usuario = Depends(require_role("Administrador")),
    db: Session = Depends(get_db),
):
    usuarios = db.query(Usuario).order_by(Usuario.created_at.desc()).all()
    return {
        "ok": True,
        "total": len(usuarios),
        "usuarios": [serialize_usuario(u) for u in usuarios],
    }


# -----------------------------------------------------------------------------
# GET /api/usuarios/{id}
# Retorna los datos completos de un usuario específico por su ID.
# Solo accesible por Administradores.
# -----------------------------------------------------------------------------
@router.get("/{id}")
def get_usuario_by_id(
    id: int,
    current_user: Usuario = Depends(require_role("Administrador")),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Usuario no encontrado."},
        )
    return {"ok": True, "usuario": serialize_usuario(user)}


# -----------------------------------------------------------------------------
# POST /api/usuarios
# Crea un nuevo usuario desde el panel administrativo.
# Valida unicidad de correo y documento, y verifica que el rol especificado exista.
# Solo accesible por Administradores.
# -----------------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_usuario(
    data: UsuarioCreate,
    current_user: Usuario = Depends(require_role("Administrador")),
    db: Session = Depends(get_db),
):
    correo = data.email.strip().lower()
    num_doc = (data.numero_documento or data.numeroDocumento or "").strip()

    # Verificar que el correo no esté registrado
    if db.query(Usuario).filter(Usuario.email.ilike(correo)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"ok": False, "message": "El correo electrónico ya está registrado."},
        )

    # Verificar que el número de documento no esté registrado
    if db.query(Usuario).filter(Usuario.numero_documento == num_doc).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"ok": False, "message": "El número de documento ya está registrado."},
        )

    # Validar que el rol especificado exista en la base de datos
    rol = db.query(Rol).filter(Rol.id == (data.rol_id or 3)).first()
    if not rol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"ok": False, "message": "El rol especificado no existe."},
        )

    # Crear y persistir el nuevo usuario con la contraseña encriptada
    new_user = Usuario(
        nombre=data.nombre.strip(),
        apellido=data.apellido.strip(),
        tipo_documento=(data.tipo_documento or data.tipoDocumento or "CC").strip(),
        numero_documento=num_doc,
        direccion=data.direccion.strip(),
        telefono=data.telefono.strip(),
        email=correo,
        password=hash_password(data.password),
        rol_id=rol.id,
        estado=data.estado or "activo",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "ok": True,
        "message": "Usuario creado exitosamente.",
        "usuario": serialize_usuario(new_user),
    }


# -----------------------------------------------------------------------------
# PUT /api/usuarios/{id}
# Actualiza los datos de un usuario existente por su ID.
# Verifica unicidad de correo y documento frente a otros usuarios antes de guardar.
# Solo accesible por Administradores.
# -----------------------------------------------------------------------------
@router.put("/{id}")
def update_usuario(
    id: int,
    data: UsuarioUpdate,
    current_user: Usuario = Depends(require_role("Administrador")),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Usuario no encontrado."},
        )

    # Verificar que el nuevo correo no esté en uso por otro usuario
    if data.email:
        correo = data.email.strip().lower()
        conflict = db.query(Usuario).filter(Usuario.email.ilike(correo), Usuario.id != id).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"ok": False, "message": "El correo electrónico ya está en uso por otro usuario."},
            )
        user.email = correo

    # Verificar que el nuevo documento no esté en uso por otro usuario
    num_doc = (data.numero_documento or data.numeroDocumento)
    if num_doc:
        doc_str = num_doc.strip()
        conflict = db.query(Usuario).filter(Usuario.numero_documento == doc_str, Usuario.id != id).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"ok": False, "message": "El número de documento ya está en uso por otro usuario."},
            )
        user.numero_documento = doc_str

    # Actualizar solo los campos que se envíen
    if data.nombre:
        user.nombre = data.nombre.strip()
    if data.apellido:
        user.apellido = data.apellido.strip()
    tipo_doc = data.tipo_documento or data.tipoDocumento
    if tipo_doc and tipo_doc.strip():
        user.tipo_documento = tipo_doc.strip()
    if data.direccion:
        user.direccion = data.direccion.strip()
    if data.telefono:
        user.telefono = data.telefono.strip()
    if data.rol_id:
        rol = db.query(Rol).filter(Rol.id == data.rol_id).first()
        if rol:
            user.rol_id = rol.id
    if data.estado:
        user.estado = data.estado
    if data.password:
        user.password = hash_password(data.password)

    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "message": "Usuario actualizado exitosamente.",
        "usuario": serialize_usuario(user),
    }


# -----------------------------------------------------------------------------
# PATCH /api/usuarios/{id}/estado
# Cambia el estado del usuario entre 'activo' e 'inactivo'.
# Si no se envía un estado específico, alterna automáticamente el estado actual.
# Impide que el administrador se desactive a sí mismo.
# Solo accesible por Administradores.
# -----------------------------------------------------------------------------
@router.patch("/{id}/estado")
def toggle_estado_usuario(
    id: int,
    data: Optional[EstadoUpdateRequest] = None,
    current_user: Usuario = Depends(require_role("Administrador")),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Usuario no encontrado."},
        )

    # Restricción de seguridad: NINGUNA cuenta de Administrador puede cambiar de estado
    es_admin_objetivo = (user.rol_id == 1) or (user.rol and user.rol.nombre == "Administrador")
    if es_admin_objetivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "ok": False,
                "message": "No puedes cambiar el estado de una cuenta de Administrador protegida.",
            },
        )

    # Restricción de seguridad: el administrador no puede desactivarse a sí mismo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"ok": False, "message": "No puedes desactivar tu propia cuenta de administrador."},
        )

    # Determinar el nuevo estado: el enviado o el opuesto al actual
    if data and data.estado:
        nuevo_estado = data.estado
    else:
        nuevo_estado = "inactivo" if user.estado == "activo" else "activo"

    user.estado = nuevo_estado
    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "message": f"Estado del usuario cambiado a '{nuevo_estado}'.",
        "usuario": serialize_usuario(user),
        "estado": nuevo_estado,
        "nuevoEstado": nuevo_estado,
    }


# -----------------------------------------------------------------------------
# DELETE /api/usuarios/{id}
# Elimina permanentemente un usuario de la base de datos.
# Impide eliminar cualquier cuenta con rol Administrador y que el admin
# no pueda borrarse a sí mismo.
# Solo accesible por Administradores.
# -----------------------------------------------------------------------------
@router.delete("/{id}")
def delete_usuario(
    id: int,
    current_user: Usuario = Depends(require_role("Administrador")),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Usuario no encontrado."},
        )

    # Restricción de seguridad: NINGUNA cuenta de Administrador se puede eliminar
    es_admin_objetivo = (user.rol_id == 1) or (user.rol and user.rol.nombre == "Administrador")
    if es_admin_objetivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "ok": False,
                "message": "No puedes eliminar cuentas de Administrador protegidas.",
            },
        )

    # Restricción de seguridad: el administrador no puede eliminarse a sí mismo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"ok": False, "message": "No puedes eliminar tu propia cuenta de administrador."},
        )

    db.delete(user)
    db.commit()

    return {"ok": True, "message": "Usuario eliminado exitosamente."}
