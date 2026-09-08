# =============================================================================
# RUTAS DE PEDIDOS - pedidos.py
# Gestiona el ciclo de vida de los pedidos: crear (cliente o invitado),
# consultar pedidos propios, listar todos (Admin/Empleado), obtener por ID
# y actualizar el estado del pedido.
# =============================================================================

from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Pedido, PedidoItem, Producto, Usuario
    from ..schemas import PedidoCreate, EstadoUpdateRequest
    from ..dependencies import (
        get_current_user,
        get_optional_current_user,
        require_role,
    )
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Pedido, PedidoItem, Producto, Usuario
    from app.schemas import PedidoCreate, EstadoUpdateRequest
    from app.dependencies import (
        get_current_user,
        get_optional_current_user,
        require_role,
    )

# Router con prefijo /pedidos; agrupa los endpoints bajo el tag "Pedidos"
router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


# -----------------------------------------------------------------------------
# FUNCIÓN AUXILIAR: Serializar un objeto Pedido a diccionario JSON
# Convierte el modelo ORM en un dict plano con todos sus campos.
# (productos comprados) como una lista embebida dentro del pedido.
# -----------------------------------------------------------------------------
def serialize_pedido(p: Any) -> dict:
    return {
        "id": p.id,
        "usuario_id": p.usuario_id,
        "cliente_nombre": p.cliente_nombre,
        "cliente_email": p.cliente_email,
        "cliente_telefono": p.cliente_telefono,
        "direccion_envio": p.direccion_envio,
        "ciudad": p.ciudad,
        "metodo_pago": p.metodo_pago,
        "notas": p.notas,
        "subtotal": float(p.subtotal) if p.subtotal is not None else 0.0,
        "envio": float(p.envio) if p.envio is not None else 0.0,
        "total": float(p.total) if p.total is not None else 0.0,
        "estado": p.estado,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        # Lista de items (productos) incluidos en el pedido
        "items": [
            {
                "id": it.id,
                "producto_id": it.producto_id,
                "nombre_producto": it.nombre_producto,
                "precio_unitario": float(it.precio_unitario),
                "cantidad": it.cantidad,
                "subtotal": float(it.subtotal),
                "imagen_url": it.imagen_url,
            }
            for it in p.items
        ],
    }


# -----------------------------------------------------------------------------
# POST /api/pedidos
# Crea un nuevo pedido. Acepta tanto clientes autenticados como invitados.
# Valida que el pedido tenga al menos un producto. Calcula automáticamente
# los subtotales de cada item y el total final del pedido incluyendo el envío.
# -----------------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_pedido(
    data: PedidoCreate,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    # Validar que el carrito no esté vacío
    if not data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"ok": False, "message": "El pedido debe contener al menos un producto."},
        )

    # Si hay un usuario autenticado, asociar el pedido a su ID
    user_id = current_user.id if current_user else None

    # Calcular subtotales y preparar los items a persistir
    calc_subtotal = 0.0
    items_to_create = []

    for item in data.items:
        # Resolver el ID del producto y buscar en BD para completar datos faltantes
        prod_id = item.producto_id or item.id
        prod = db.query(Producto).filter(Producto.id == prod_id).first() if prod_id else None

        # Usar datos enviados por el frontend; si faltan, completar con datos de BD
        nombre_prod = item.nombre or item.nombre_producto or (prod.nombre if prod else "Producto")
        precio_val = item.precio or item.precio_unitario or (prod.precio if prod else 0.0)
        precio_un = float(precio_val or 0.0)
        cantidad = max(1, item.cantidad) if item.cantidad else 1
        item_sub = precio_un * cantidad
        calc_subtotal += item_sub

        img = item.imagen_url or (prod.imagen_url if prod else None)
        items_to_create.append({
            "producto_id": prod_id,
            "nombre_producto": nombre_prod,
            "precio_unitario": precio_un,
            "cantidad": cantidad,
            "subtotal": item_sub,
            "imagen_url": img,
        })

    # Calcular costo de envío y total final
    envio_cost = data.envio or 0.0
    total_cost = calc_subtotal + envio_cost

    # Crear y persistir el pedido principal
    new_pedido = Pedido(
        usuario_id=user_id,
        cliente_nombre=data.cliente_nombre.strip(),
        cliente_email=data.cliente_email.strip().lower(),
        cliente_telefono=data.cliente_telefono.strip(),
        direccion_envio=data.direccion_envio.strip(),
        ciudad=(data.ciudad or "Bogotá").strip(),
        metodo_pago=data.metodo_pago.strip(),
        notas=data.notas.strip() if data.notas else None,
        subtotal=calc_subtotal,
        envio=envio_cost,
        total=total_cost,
        estado="en revision",
    )
    db.add(new_pedido)
    db.commit()
    db.refresh(new_pedido)

    # Persistir cada item del pedido como registros PedidoItem vinculados al pedido
    for it in items_to_create:
        p_item = PedidoItem(
            pedido_id=new_pedido.id,
            producto_id=it["producto_id"],
            nombre_producto=it["nombre_producto"],
            precio_unitario=it["precio_unitario"],
            cantidad=it["cantidad"],
            subtotal=it["subtotal"],
            imagen_url=it["imagen_url"],
        )
        db.add(p_item)

    db.commit()
    db.refresh(new_pedido)

    return {
        "ok": True,
        "message": "Pedido creado exitosamente.",
        "pedido": serialize_pedido(new_pedido),
    }


# -----------------------------------------------------------------------------
# GET /api/pedidos/mis-pedidos
# Retorna el historial de pedidos del cliente actualmente autenticado.
# Requiere token JWT válido (solo clientes ven sus propios pedidos).
# -----------------------------------------------------------------------------
@router.get("/mis-pedidos")
def get_mis_pedidos(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == current_user.id)
        .order_by(Pedido.created_at.desc())
        .all()
    )
    return {
        "ok": True,
        "total": len(pedidos),
        "pedidos": [serialize_pedido(p) for p in pedidos],
    }


# -----------------------------------------------------------------------------
# GET /api/pedidos
# Retorna todos los pedidos del sistema, ordenados por fecha de creación.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.get("")
def get_todos_los_pedidos(
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    pedidos = db.query(Pedido).order_by(Pedido.created_at.desc()).all()
    return {
        "ok": True,
        "total": len(pedidos),
        "pedidos": [serialize_pedido(p) for p in pedidos],
    }


# -----------------------------------------------------------------------------
# GET /api/pedidos/{id}
# Retorna los detalles completos de un pedido por su ID.
# Los clientes solo pueden ver sus propios pedidos.
# Los administradores y empleados pueden ver cualquier pedido.
# -----------------------------------------------------------------------------
@router.get("/{id}")
def get_pedido_by_id(
    id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Pedido no encontrado."},
        )

    # Verificar que el cliente solo pueda acceder a sus propios pedidos
    user_role = current_user.rol.nombre if current_user.rol else ""
    if user_role not in ["Administrador", "Empleado"] and pedido.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"ok": False, "message": "No tienes permiso para ver este pedido."},
        )

    return {"ok": True, "pedido": serialize_pedido(pedido)}


# -----------------------------------------------------------------------------
# PATCH /api/pedidos/{id}/estado
# Actualiza el estado de un pedido (ej: 'en revision' → 'revisado' → 'hecho').
# El body debe incluir el nuevo estado explícitamente.
# Requiere rol Administrador o Empleado.
# -----------------------------------------------------------------------------
@router.patch("/{id}/estado")
def update_estado_pedido(
    id: int,
    data: EstadoUpdateRequest,
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
    db: Session = Depends(get_db),
):
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"ok": False, "message": "Pedido no encontrado."},
        )

    # Actualizar el estado del pedido con el valor enviado en el body
    pedido.estado = data.estado
    db.commit()
    db.refresh(pedido)

    return {
        "ok": True,
        "message": f"Estado del pedido actualizado a '{data.estado}'.",
        "pedido": serialize_pedido(pedido),
    }
