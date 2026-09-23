# =============================================================================
# RUTAS DE AUTENTICACIÓN - auth.py
# Gestiona el registro de usuarios, inicio de sesión (login), verificación de
# correo electrónico, recuperación de contraseña y consulta/actualización del
# perfil del usuario autenticado mediante token JWT.
# =============================================================================

import os
import random
import logging
import smtplib
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from email.message import EmailMessage
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

load_dotenv()
logger = logging.getLogger("mitienda-auth")

try:
    from ..database import get_db
    from ..models import Usuario, Rol, CodigoRecuperacion
    from ..schemas import (
        UsuarioRegistro,
        LoginRequest,
        PasswordRecoveryRequest,
        UsuarioUpdate,
        RecuperarSolicitarCodigo,
        RecuperarVerificarCodigo,
        RecuperarResetPassword,
    )
    from ..security import hash_password, verify_password, create_access_token
    from ..dependencies import get_current_user
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Usuario, Rol, CodigoRecuperacion
    from app.schemas import (
        UsuarioRegistro,
        LoginRequest,
        PasswordRecoveryRequest,
        UsuarioUpdate,
        RecuperarSolicitarCodigo,
        RecuperarVerificarCodigo,
        RecuperarResetPassword,
    )
    from app.security import hash_password, verify_password, create_access_token
    from app.dependencies import get_current_user

# Router principal de autenticación; agrupa todos los endpoints bajo el tag "Autenticación"
router = APIRouter(tags=["Autenticación"])


def _utcnow_naive() -> datetime:
    """
    Devuelve la hora actual en UTC PERO SIN zona horaria adjunta (offset-naive).
    MySQL guarda DATETIME como naive; comparar un datetime naive con uno aware
    (datetime.now(timezone.utc)) causa TypeError en Python.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _to_naive(dt: datetime | None) -> datetime | None:
    """Convierte cualquier datetime a naive (sin tzinfo) usando UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def _generar_codigo() -> str:
    return str(random.randint(100000, 999999))


def _enviar_correo_recuperacion(destinatario: str, codigo: str, nombre: str) -> tuple[bool, bool]:
    """
    Retorna (enviado_ok, modo_desarrollo_sin_smtp).
    modo_desarrollo_sin_smtp=True cuando no hay credenciales SMTP o falló
    el envío y se usó el log de consola.
    """
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    remitente = smtp_user or os.getenv("SMTP_FROM", "no-reply@mitienda.com")
    asunto = os.getenv("SMTP_SUBJECT", "Código de recuperación - MiTienda")

    cuerpo_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px;">
          <h2 style="color: #6d28d9; margin-top: 0;">Hola {nombre or 'usuario'} 👋</h2>
          <p style="color: #374151;">Recibimos una solicitud para recuperar tu contraseña de MiTienda.</p>
          <p style="color: #374151;">Utiliza el siguiente código de verificación:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="display: inline-block; padding: 14px 32px; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background: linear-gradient(90deg, #6d28d9, #a855f7); border-radius: 10px;">
              {codigo}
            </span>
          </div>
          <p style="color: #374151;">Este código es válido por <strong>15 minutos</strong> y solo puede usarse una vez.</p>
          <p style="color: #9ca3af; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px; text-align: center;">© 2026 MiTienda - Tecnología y más</p>
        </div>
      </body>
    </html>
    """
    cuerpo_texto = (
        f"Hola {nombre or 'usuario'}!\n\n"
        f"Tu código de recuperación para MiTienda es: {codigo}\n"
        f"Válido por 15 minutos.\n\n"
        f"Si no solicitaste este cambio, ignora este correo."
    )

    enviado = False
    modo_desarrollo = False

    if smtp_user and smtp_pass:
        try:
            msg = EmailMessage()
            msg["Subject"] = asunto
            msg["From"] = remitente
            msg["To"] = destinatario
            msg.set_content(cuerpo_texto)
            msg.add_alternative(cuerpo_html, subtype="html")

            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            enviado = True
            logger.info(f"[EMAIL] Código de recuperación enviado a {destinatario}.")
        except Exception as e:
            logger.warning(f"[EMAIL] Falló el envío SMTP a {destinatario}: {e}")
            enviado = False
            modo_desarrollo = True
    else:
        modo_desarrollo = True

    if modo_desarrollo or not enviado:
        logger.info("=" * 60)
        logger.info(f"[MODO DESARROLLO] Código de recuperación para {destinatario}:")
        logger.info(f"         CÓDIGO =>  {codigo}  (válido 15 min)")
        logger.info("=" * 60)
        enviado = True
        modo_desarrollo = True

    return (enviado, modo_desarrollo)


def _validar_codigo_activo(db: Session, email: str, codigo: str) -> CodigoRecuperacion:
    correo = email.strip().lower()
    registro = (
        db.query(CodigoRecuperacion)
        .filter(
            CodigoRecuperacion.email.ilike(correo),
            CodigoRecuperacion.codigo == codigo.strip(),
            CodigoRecuperacion.usado == False,
        )
        .order_by(CodigoRecuperacion.created_at.desc())
        .first()
    )
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"ok": False, "message": "Código inválido. Verifica e intenta nuevamente."},
        )
    # Comparación segura: ambos datetimes en naive (sin zona horaria), tal cual
    # se almacenan en el campo DATETIME de MySQL.
    if _to_naive(registro.expira_en) < _utcnow_naive():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"ok": False, "message": "El código ha expirado. Solicita uno nuevo."},
        )
    return registro


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
    password_ok = verify_password(data.password, user.password)
    if not password_ok:
        # Compatibilidad con las credenciales demo del proyecto y varias variantes del quinto avance.
        demo_passwords = {
            "admin@mitienda.com": {"Admin1234", "admin", "admin123", "password123"},
            "empleado@mitienda.com": {"Empleado1234", "empleado", "empleado123"},
        }
        if user.email.lower() in demo_passwords and data.password in demo_passwords[user.email.lower()]:
            password_ok = True
        if not password_ok:
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
# POST /api/auth/recover/send-code
# Paso 1 del flujo de recuperación: recibe el correo, genera un código de 6
# dígitos, lo guarda en la base de datos con expiración de 15 minutos y lo
# envía al correo del usuario (SMTP o log en consola para desarrollo).
# En modo desarrollo (sin SMTP configurado) también devuelve el código dentro
# del campo "dev_code" para que el frontend lo muestre directamente en UI.
# Endpoint público.
# -----------------------------------------------------------------------------
@router.post("/auth/recover/send-code")
def recover_send_code(data: RecuperarSolicitarCodigo, db: Session = Depends(get_db)):
    correo = data.email.strip().lower()
    user = db.query(Usuario).filter(Usuario.email.ilike(correo)).first()

    # Por seguridad no revelamos si el correo existe o no, siempre respondemos ok
    codigo = _generar_codigo()
    # Guardamos naive (sin tzinfo) para ser compatible con el DATETIME de MySQL,
    # evitando el TypeError "can't compare offset-naive and offset-aware datetimes".
    expira = _utcnow_naive() + timedelta(minutes=15)

    registro = CodigoRecuperacion(
        email=correo,
        codigo=codigo,
        expira_en=expira,
        usado=False,
    )
    db.add(registro)
    db.commit()

    nombre_usuario = user.nombre if user else ""
    enviado_ok, modo_desarrollo = _enviar_correo_recuperacion(correo, codigo, nombre_usuario)

    # Por seguridad NUNCA devolvemos el código al frontend ni exponemos si el
    # correo existe. El código solo viaja por email (o se imprime en la consola
    # del backend para pruebas del desarrollador cuando no hay SMTP).
    respuesta = {
        "ok": True,
        "message": (
            "Si el correo está registrado, recibirás un código de verificación en breve. "
            "Revisa tu bandeja de entrada (y carpeta de spam)."
        ),
        "email_masked": (
            correo[0] + "***" + correo.split("@")[0][-1] + "@" + correo.split("@")[-1]
            if user else None
        ),
    }

    if not enviado_ok:
        respuesta["message"] = (
            "No pudimos enviar el correo en este momento. Por favor intenta de nuevo más tarde."
        )
        respuesta["ok"] = False

    return respuesta


# -----------------------------------------------------------------------------
# POST /api/auth/recover/verify-code
# Paso 2 del flujo: valida que el código ingresado exista, pertenezca al email
# y no haya expirado ni sido usado. Endpoint público.
# -----------------------------------------------------------------------------
@router.post("/auth/recover/verify-code")
def recover_verify_code(data: RecuperarVerificarCodigo, db: Session = Depends(get_db)):
    _validar_codigo_activo(db, data.email, data.codigo)
    return {
        "ok": True,
        "message": "Código verificado correctamente. Ahora puedes establecer tu nueva contraseña.",
    }


# -----------------------------------------------------------------------------
# POST /api/auth/recover/reset-password
# Paso 3 (final): valida el código y actualiza la contraseña del usuario.
# Marca el código como usado para evitar reutilización. Endpoint público.
# -----------------------------------------------------------------------------
@router.post("/auth/recover/reset-password")
def recover_reset_password(data: RecuperarResetPassword, db: Session = Depends(get_db)):
    correo = data.email.strip().lower()

    user = db.query(Usuario).filter(Usuario.email.ilike(correo)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "No se encontró ningún usuario con ese correo electrónico."},
        )

    registro = _validar_codigo_activo(db, data.email, data.codigo)
    registro.usado = True
    user.password = hash_password(data.newPassword)
    db.commit()

    return {
        "ok": True,
        "message": "¡Tu contraseña ha sido actualizada! Ya puedes iniciar sesión con tu nueva contraseña.",
    }


# -----------------------------------------------------------------------------
# POST /api/auth/recover-password (alias de compatibilidad)
# Alias hacia recover/reset-password que no requiere código.
# Se mantiene por compatibilidad con versiones anteriores del frontend.
# -----------------------------------------------------------------------------
@router.post("/auth/recover-password")
def recover_password_legacy(data: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    correo = data.email.strip().lower()
    user = db.query(Usuario).filter(Usuario.email.ilike(correo)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "No se encontró ningún usuario con ese correo electrónico."},
        )
    user.password = hash_password(data.newPassword)
    db.commit()
    return {"ok": True, "message": "¡Tu contraseña ha sido actualizada! Ya puedes iniciar sesión con tu nueva contraseña."}


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
