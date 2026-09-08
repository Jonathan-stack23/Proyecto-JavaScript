# =============================================================================
# RUTAS DE AUTENTICACIÓN - auth.py
# Gestiona el registro de usuarios, inicio de sesión (login), verificación de
# correo electrónico, recuperación de contraseña y consulta/actualización del
# perfil del usuario autenticado mediante token JWT.
# =============================================================================

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Usuario, Rol
    from ..schemas import (
        UsuarioRegistro,
        LoginRequest,
        PasswordRecoveryRequest,
        UsuarioUpdate,
    )
    from ..security import hash_password, verify_password, create_access_token
    from ..dependencies import get_current_user
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Usuario, Rol
    from app.schemas import (
        UsuarioRegistro,
        LoginRequest,
        PasswordRecoveryRequest,
        UsuarioUpdate,
    )
    from app.security import hash_password, verify_password, create_access_token
    from app.dependencies import get_current_user

# Router principal de autenticación; agrupa todos los endpoints bajo el tag "Autenticación"
router = APIRouter(tags=["Autenticación"])


# -----------------------------------------------------------------------------
# FUNCIÓN AUXILIAR: Lógica compartida de registro de usuario
# Valida unicidad de correo y documento, crea el usuario con rol "Cliente" y
# retorna un token JWT junto con los datos del nuevo usuario.
# -----------------------------------------------------------------------------
def handle_user_registration(data: UsuarioRegistro, db: Session):
    correo = data.email.strip().lower()

    # Verificar si el correo ya existe en la base de datos
    existing_email = db.query(Usuario).filter(Usuario.email.ilike(correo)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "ok": False,
                "message": "El correo electrónico ya está registrado.",
                "errors": {"email": "El correo electrónico ya está registrado. Usa otro o inicia sesión."},
            },
        )

    # Verificar si el número de documento ya existe en la base de datos
    num_doc = (data.numero_documento or data.numeroDocumento or "").strip()
    existing_doc = db.query(Usuario).filter(Usuario.numero_documento == num_doc).first()
    if existing_doc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "ok": False,
                "message": "El número de documento ya está registrado.",
                "errors": {"numeroDocumento": "El número de documento ya está registrado."},
            },
        )

    # Buscar el rol 'Cliente' (id=3) para asignarlo al nuevo usuario
    cliente_rol = db.query(Rol).filter(Rol.id == 3).first()
    if not cliente_rol:
        cliente_rol = db.query(Rol).filter(Rol.nombre.ilike("Cliente")).first()
    rol_id = cliente_rol.id if cliente_rol else 3

    # Encriptar la contraseña con bcrypt antes de guardarla
    hashed_pw = hash_password(data.password)

    # Crear el objeto Usuario y persistirlo en la base de datos
    new_user = Usuario(
        nombre=data.nombre.strip(),
        apellido=data.apellido.strip(),
        tipo_documento=(data.tipo_documento or data.tipoDocumento or "CC").strip(),
        numero_documento=num_doc,
        direccion=data.direccion.strip(),
        telefono=data.telefono.strip(),
        email=correo,
        password=hashed_pw,
        rol_id=rol_id,
        estado="activo",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    rol_nombre = new_user.rol.nombre if new_user.rol else "Cliente"

    # Generar token JWT con los datos del usuario recién creado
    token = create_access_token(
        {
            "sub": new_user.email,
            "email": new_user.email,
            "role": rol_nombre,
            "rol": rol_nombre,
            "userId": new_user.id,
            "id": new_user.id,
        }
    )

    return {
        "ok": True,
        "message": "Registro exitoso.",
        "token": token,
        "user": {
            "id": new_user.id,
            "nombre": new_user.nombre,
            "apellido": new_user.apellido,
            "tipo_documento": new_user.tipo_documento,
            "numero_documento": new_user.numero_documento,
            "direccion": new_user.direccion,
            "telefono": new_user.telefono,
            "email": new_user.email,
            "rol": rol_nombre,
            "rol_nombre": rol_nombre,
            "estado": new_user.estado,
        },
    }


# -----------------------------------------------------------------------------
# POST /api/usuarios/registro
# Endpoint requerido según la especificación del PDF (Pág. 7 y 10).
# Registra un nuevo cliente en el sistema.
# -----------------------------------------------------------------------------
@router.post("/usuarios/registro", status_code=status.HTTP_201_CREATED)
def registrar_usuario_pdf(data: UsuarioRegistro, db: Session = Depends(get_db)):
    return handle_user_registration(data, db)


# -----------------------------------------------------------------------------
# POST /api/auth/register
# Alias para compatibilidad directa con el Frontend React existente.
# Redirige a la misma lógica de registro que el endpoint anterior.
# -----------------------------------------------------------------------------
@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def registrar_usuario_auth(data: UsuarioRegistro, db: Session = Depends(get_db)):
    return handle_user_registration(data, db)


# -----------------------------------------------------------------------------
# POST /api/auth/login
# Autentica al usuario verificando su correo y contraseña.
# Si las credenciales son válidas y la cuenta está activa, retorna un JWT.
# -----------------------------------------------------------------------------
@router.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    correo = data.email.strip().lower()

    # Buscar usuario por correo (sin distinguir mayúsculas/minúsculas)
    user = db.query(Usuario).filter(Usuario.email.ilike(correo)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"ok": False, "message": "Correo o contraseña incorrectos."},
        )

    # Verificar que la cuenta no esté desactivada
    if user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"ok": False, "message": "Tu cuenta se encuentra inactiva. Contacta al administrador."},
        )

    # Verificar la contraseña usando bcrypt
    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"ok": False, "message": "Correo o contraseña incorrectos."},
        )

    rol_nombre = user.rol.nombre if user.rol else "Cliente"

    # Generar y retornar el token JWT con la información del usuario autenticado
    token = create_access_token(
        {
            "sub": user.email,
            "email": user.email,
            "role": rol_nombre,
            "rol": rol_nombre,
            "userId": user.id,
            "id": user.id,
        }
    )

    return {
        "ok": True,
        "message": "Inicio de sesión exitoso.",
        "token": token,
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "tipo_documento": user.tipo_documento,
            "numero_documento": user.numero_documento,
            "direccion": user.direccion,
            "telefono": user.telefono,
            "email": user.email,
            "rol": rol_nombre,
            "rol_nombre": rol_nombre,
            "estado": user.estado,
        },
    }


# -----------------------------------------------------------------------------
# GET /api/auth/check-email?email=...&excludeId=...
# Verifica si un correo electrónico ya está registrado en la base de datos.
# Acepta un parámetro opcional 'excludeId' para excluir al usuario actual
# (útil al editar perfil sin que su propio correo genere conflicto).
# Endpoint público — no requiere autenticación.
# -----------------------------------------------------------------------------
@router.get("/auth/check-email")
def check_email_disponible(
    email: str = Query(..., description="Correo a verificar"),
    excludeId: Optional[int] = Query(None, description="ID de usuario a excluir"),
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
# POST /api/auth/recover-password
# Permite al usuario cambiar su contraseña proporcionando su correo y la nueva
# contraseña. No requiere el envío de correo electrónico; es una recuperación
# directa validada desde el frontend.
# -----------------------------------------------------------------------------
@router.post("/auth/recover-password")
def recover_password(data: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    correo = data.email.strip().lower()

    # Verificar que el correo esté registrado antes de actualizar la contraseña
    user = db.query(Usuario).filter(Usuario.email.ilike(correo)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "No se encontró ningún usuario con ese correo electrónico."},
        )

    # Encriptar y guardar la nueva contraseña
    user.password = hash_password(data.newPassword)
    db.commit()

    return {"ok": True, "message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."}


# -----------------------------------------------------------------------------
# GET /api/auth/profile
# Retorna los datos del perfil del usuario actualmente autenticado.
# Requiere un token JWT válido en la cabecera Authorization.
# -----------------------------------------------------------------------------
@router.get("/auth/profile")
def get_user_profile(current_user: Any = Depends(get_current_user)):
    rol_nombre = current_user.rol.nombre if current_user.rol else "Cliente"
    return {
        "ok": True,
        "user": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "apellido": current_user.apellido,
            "tipo_documento": current_user.tipo_documento,
            "numero_documento": current_user.numero_documento,
            "direccion": current_user.direccion,
            "telefono": current_user.telefono,
            "email": current_user.email,
            "rol": rol_nombre,
            "rol_nombre": rol_nombre,
            "estado": current_user.estado,
        },
    }


# -----------------------------------------------------------------------------
# PUT /api/auth/profile
# Permite al usuario autenticado actualizar sus propios datos de perfil.
# Solo modifica los campos enviados; los campos omitidos no se tocan.
# Si se cambia el número de documento, verifica que no esté en uso por otro usuario.
# -----------------------------------------------------------------------------
@router.put("/auth/profile")
def update_user_profile(
    data: UsuarioUpdate,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Actualizar solo los campos que se envíen en el cuerpo de la petición
    if data.nombre:
        current_user.nombre = data.nombre.strip()
    if data.apellido:
        current_user.apellido = data.apellido.strip()
    if data.direccion:
        current_user.direccion = data.direccion.strip()
    if data.telefono:
        current_user.telefono = data.telefono.strip()
    if data.tipo_documento:
        current_user.tipo_documento = data.tipo_documento.strip()
    if data.numero_documento:
        # Verificar que el documento no esté en uso por otro usuario
        doc_exists = (
            db.query(Usuario)
            .filter(Usuario.numero_documento == data.numero_documento, Usuario.id != current_user.id)
            .first()
        )
        if doc_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"ok": False, "message": "El número de documento ya está registrado por otro usuario."},
            )
        current_user.numero_documento = data.numero_documento.strip()
    if data.password:
        # Encriptar la nueva contraseña antes de guardarla
        current_user.password = hash_password(data.password)

    db.commit()
    db.refresh(current_user)

    rol_nombre = current_user.rol.nombre if current_user.rol else "Cliente"
    return {
        "ok": True,
        "message": "Perfil actualizado exitosamente.",
        "user": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "apellido": current_user.apellido,
            "tipo_documento": current_user.tipo_documento,
            "numero_documento": current_user.numero_documento,
            "direccion": current_user.direccion,
            "telefono": current_user.telefono,
            "email": current_user.email,
            "rol": rol_nombre,
            "rol_nombre": rol_nombre,
            "estado": current_user.estado,
        },
    }
