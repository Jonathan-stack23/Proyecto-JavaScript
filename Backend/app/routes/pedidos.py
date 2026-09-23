# =============================================================================
# RUTAS DE PEDIDOS - pedidos.py
# Gestiona el ciclo de vida de los pedidos: crear (cliente o invitado),
# consultar pedidos propios, listar todos (Admin/Empleado), obtener por ID
# y actualizar el estado del pedido.
# =============================================================================

from typing import Optional, Any
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    from ..database import get_db
    from ..models import (
        Pedido,
        PedidoItem,
        Producto,
        Usuario,
        Venta,
        DetalleVenta,
        Factura,
        DetalleFactura,
    )
    from ..schemas import PedidoCreate, EstadoUpdateRequest
    from ..dependencies import (
        get_current_user,
        get_optional_current_user,
        require_role,
    )
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import (
        Pedido,
        PedidoItem,
        Producto,
        Usuario,
        Venta,
        DetalleVenta,
        Factura,
        DetalleFactura,
    )
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
    factura = None
    venta = getattr(p, "venta", None)
    if venta and getattr(venta, "factura", None):
        factura = venta.factura
    elif hasattr(p, "facturas") and p.facturas:
        factura = p.facturas[0]

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
        "venta_id": venta.id if venta else None,
        "numero_venta": venta.numero_venta if venta else None,
        "factura_id": factura.id if factura else None,
        "numero_factura": factura.numero_factura if factura else None,
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

    now_dt = datetime.now(timezone.utc)

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
        created_at=now_dt,
    )
    db.add(new_pedido)
    db.flush()

    # Persistir cada item del pedido y descontar inventario
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

        # Descontar stock del producto en inventario
        if it["producto_id"]:
            prod = db.query(Producto).filter(Producto.id == it["producto_id"]).first()
            if prod and prod.stock is not None:
                prod.stock = max(0, prod.stock - it["cantidad"])

    # -------------------------------------------------------------------------
    # SINCRONIZACIÓN AUTOMÁTICA: Crear Venta y Factura comercial vinculadas
    # -------------------------------------------------------------------------
    subtotal_dec = Decimal(str(round(calc_subtotal, 2)))
    # IVA 19% calculado sobre el subtotal comercial
    impuestos_dec = (subtotal_dec * Decimal("0.19")).quantize(Decimal("0.01"))
    total_dec = Decimal(str(round(total_cost, 2)))

    # Generar número de venta consecutivo
    max_venta_id = db.query(func.max(Venta.id)).scalar() or 0
    numero_venta = f"VTA-{now_dt.year}-{(max_venta_id + 1):04d}"

    # Obtener documento del cliente si existe
    doc_cliente = getattr(data, "cliente_documento", None) or "222222222222"
    if current_user and getattr(current_user, "numero_documento", None):
        doc_cliente = current_user.numero_documento

    nueva_venta = Venta(
        numero_venta=numero_venta,
        pedido_id=new_pedido.id,
        cliente_id=user_id,
        usuario_id=user_id,
        cliente_nombre=new_pedido.cliente_nombre,
        cliente_documento=doc_cliente,
        cliente_email=new_pedido.cliente_email,
        cliente_telefono=new_pedido.cliente_telefono,
        direccion_entrega=new_pedido.direccion_envio,
        ciudad=new_pedido.ciudad,
        metodo_pago=new_pedido.metodo_pago,
        subtotal=subtotal_dec,
        descuento=Decimal("0.00"),
        impuestos=impuestos_dec,
        total=total_dec,
        estado="completada",
        notas=new_pedido.notas,
        fecha_venta=now_dt,
    )
    db.add(nueva_venta)
    db.flush()

    for it in items_to_create:
        det_v = DetalleVenta(
            venta_id=nueva_venta.id,
            tipo_item="producto",
            producto_id=it["producto_id"],
            nombre_item=it["nombre_producto"],
            precio_unitario=Decimal(str(it["precio_unitario"])),
            cantidad=it["cantidad"],
            descuento=Decimal("0.00"),
            subtotal=Decimal(str(it["subtotal"])),
        )
        db.add(det_v)

    # Generar número de factura consecutivo
    max_fac_id = db.query(func.max(Factura.id)).scalar() or 0
    numero_factura = f"FAC-{now_dt.year}-{(max_fac_id + 1):04d}"

    nueva_factura = Factura(
        numero_factura=numero_factura,
        venta_id=nueva_venta.id,
        pedido_id=new_pedido.id,
        cliente_id=user_id,
        cliente_nombre=new_pedido.cliente_nombre,
        cliente_documento=doc_cliente,
        cliente_email=new_pedido.cliente_email,
        cliente_telefono=new_pedido.cliente_telefono,
        cliente_direccion=new_pedido.direccion_envio,
        ciudad=new_pedido.ciudad,
        subtotal=subtotal_dec,
        impuestos=impuestos_dec,
        descuento=Decimal("0.00"),
        total=total_dec,
        metodo_pago=new_pedido.metodo_pago,
        estado="emitida",
        fecha_emision=now_dt,
    )
    db.add(nueva_factura)
    db.flush()

    for it in items_to_create:
        det_f = DetalleFactura(
            factura_id=nueva_factura.id,
            tipo_item="producto",
            nombre_item=it["nombre_producto"],
            precio_unitario=Decimal(str(it["precio_unitario"])),
            cantidad=it["cantidad"],
            subtotal=Decimal(str(it["subtotal"])),
        )
        db.add(det_f)

    db.commit()
    db.refresh(new_pedido)

    return {
        "ok": True,
        "message": "Pedido y Factura creados exitosamente.",
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

    # Sincronizar estado en Venta y Factura si existen
    if pedido.venta:
        if data.estado == "cancelado":
            pedido.venta.estado = "anulada"
            if pedido.venta.factura:
                pedido.venta.factura.estado = "anulada"
        elif data.estado == "hecho":
            pedido.venta.estado = "completada"
            if pedido.venta.factura:
                pedido.venta.factura.estado = "pagada"
        elif data.estado in ["en revision", "revisado"]:
            pedido.venta.estado = "completada"
            if pedido.venta.factura:
                pedido.venta.factura.estado = "emitida"

    db.commit()
    db.refresh(pedido)

    return {
        "ok": True,
        "message": f"Estado del pedido actualizado a '{data.estado}'.",
        "pedido": serialize_pedido(pedido),
    }
