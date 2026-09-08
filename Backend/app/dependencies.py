from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

try:
    from .database import get_db
    from .models import Usuario, Rol
    from .security import decode_access_token
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Usuario, Rol
    from app.security import decode_access_token

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token. Se requiere encabezado de autorización Bearer.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        email = payload.get("sub") or payload.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: falta información de usuario.",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token ha expirado. Por favor inicia sesión nuevamente.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o firma incorrecta.",
        )

    user = db.query(Usuario).filter(Usuario.email.ilike(email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario asociado al token no encontrado.",
        )

    if user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta se encuentra inactiva. Contacta al administrador.",
        )

    return user

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[Usuario]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        email = payload.get("sub") or payload.get("email")
        if not email:
            return None
        user = db.query(Usuario).filter(Usuario.email.ilike(email)).first()
        if user and user.estado == "activo":
            return user
    except Exception:
        return None
    return None

def require_role(*roles: str):
    def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        user_role = current_user.rol.nombre if current_user.rol else ""
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(roles)}.",
            )
        return current_user
    return role_checker
