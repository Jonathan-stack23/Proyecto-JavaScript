"""
Rutas de Ventas - Quinto Avance
Gestión comercial de ventas de productos y servicios con almacenamiento persistente en SQL.
"""
from typing import Optional, List, Any
from datetime import datetime, timezone, date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.database import get_db
from app.models import Usuario, Producto, Servicio, Venta, DetalleVenta, Factura, DetalleFactura
from app.schemas import VentaCreate, VentaResponse, DetalleVentaResponse
from app.dependencies import get_current_user, require_role, get_optional_current_user

router = APIRouter(prefix="/ventas", tags=["Ventas"])

def serialize_venta(v: Venta) -> dict:
    return {
        "id": v.id,
        "numero_venta": v.numero_venta,
        "cliente_id": v.cliente_id,
        "usuario_id": v.usuario_id,
        "cliente_nombre": v.cliente_nombre,
        "cliente_documento": v.cliente_documento,
        "cliente_email": v.cliente_email,
        "cliente_telefono": v.cliente_telefono,
        "direccion_entrega": v.direccion_entrega,
        "ciudad": v.ciudad,
        "metodo_pago": v.metodo_pago,
        "subtotal": float(v.subtotal) if v.subtotal else 0.0,
        "descuento": float(v.descuento) if v.descuento else 0.0,
        "impuestos": float(v.impuestos) if v.impuestos else 0.0,
        "total": float(v.total) if v.total else 0.0,
        "estado": v.estado,
        "notas": v.notas,
        "fecha_venta": v.fecha_venta.isoformat() if v.fecha_venta else None,
        "factura_id": v.factura.id if v.factura else None,
        "numero_factura": v.factura.numero_factura if v.factura else None,
        "detalles": [
            {
                "id": d.id,
                "tipo_item": d.tipo_item,
                "producto_id": d.producto_id,
                "servicio_id": d.servicio_id,
                "nombre_item": d.nombre_item,
                "precio_unitario": float(d.precio_unitario) if d.precio_unitario else 0.0,
                "cantidad": d.cantidad,
                "descuento": float(d.descuento) if d.descuento else 0.0,
                "subtotal": float(d.subtotal) if d.subtotal else 0.0,
            }
            for d in (v.detalles or [])
        ],
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def registrar_venta(
    data: VentaCreate,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Registra una nueva venta comercial de productos y/o servicios en la base de datos SQL.
    Calcula subtotales, impuestos, descuenta stock de inventario y genera su factura correspondiente.
    """
    if not data.items or len(data.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta debe contener al menos un producto o servicio.",
        )

    # 1. Generar número de venta consecutivo
    total_prev = db.query(func.count(Venta.id)).scalar() or 0
    now_dt = datetime.now(timezone.utc)
    numero_venta = f"VTA-{now_dt.year}-{(total_prev + 1):04d}"

    # 2. Calcular valores de detalle
    subtotal_acum = Decimal("0.00")
    descuento_acum = Decimal(str(data.descuento or 0.0))
    detalles_para_crear = []

    for it in data.items:
        prec = Decimal(str(it.precio_unitario))
        cant = int(it.cantidad)
        desc = Decimal(str(it.descuento or 0.0))
        item_subtotal = (prec * cant) - desc
        subtotal_acum += item_subtotal

        # Si es producto, validar y descontar stock si existe
        if it.tipo_item == "producto" and it.producto_id:
            prod = db.query(Producto).filter(Producto.id == it.producto_id).first()
            if prod:
                prod.stock = max(0, prod.stock - cant)

        detalles_para_crear.append({
            "tipo_item": it.tipo_item,
            "producto_id": it.producto_id,
            "servicio_id": it.servicio_id,
            "nombre_item": it.nombre_item,
            "precio_unitario": prec,
            "cantidad": cant,
            "descuento": desc,
            "subtotal": item_subtotal,
        })

    # 3. Impuestos (IVA 19% por defecto)
    impuestos_calc = (subtotal_acum * Decimal("0.19")).quantize(Decimal("0.01"))
    total_final = subtotal_acum + impuestos_calc

    # 4. Asignar cliente y usuario que registra
    cliente_id = data.cliente_id
    if not cliente_id and current_user and getattr(current_user, 'rol_id', None) == 3:
        cliente_id = current_user.id

    usuario_registro_id = current_user.id if current_user else None

    # 5. Crear Venta
    nueva_venta = Venta(
        numero_venta=numero_venta,
        cliente_id=cliente_id,
        usuario_id=usuario_registro_id,
        cliente_nombre=data.cliente_nombre.strip(),
        cliente_documento=data.cliente_documento or "222222222222",
        cliente_email=data.cliente_email.strip().lower(),
        cliente_telefono=data.cliente_telefono.strip(),
        direccion_entrega=data.direccion_entrega.strip() if data.direccion_entrega else None,
        ciudad=data.ciudad.strip() if data.ciudad else "Bogotá",
        metodo_pago=data.metodo_pago,
        subtotal=subtotal_acum,
        descuento=descuento_acum,
        impuestos=impuestos_calc,
        total=total_final,
        estado="completada",
        notas=data.notas.strip() if data.notas else None,
        fecha_venta=now_dt,
    )
    db.add(nueva_venta)
    db.flush()

    # 6. Crear detalles de venta
    for d in detalles_para_crear:
        det = DetalleVenta(
            venta_id=nueva_venta.id,
            tipo_item=d["tipo_item"],
            producto_id=d["producto_id"],
            servicio_id=d["servicio_id"],
            nombre_item=d["nombre_item"],
            precio_unitario=d["precio_unitario"],
            cantidad=d["cantidad"],
            descuento=d["descuento"],
            subtotal=d["subtotal"],
        )
        db.add(det)

    # 7. Generar Factura de Venta automática
    total_fac_prev = db.query(func.count(Factura.id)).scalar() or 0
    numero_factura = f"FAC-{now_dt.year}-{(total_fac_prev + 1):04d}"

    nueva_factura = Factura(
        numero_factura=numero_factura,
        venta_id=nueva_venta.id,
        cliente_id=cliente_id,
        cliente_nombre=nueva_venta.cliente_nombre,
        cliente_documento=nueva_venta.cliente_documento or "222222222222",
        cliente_email=nueva_venta.cliente_email,
        cliente_telefono=nueva_venta.cliente_telefono,
        cliente_direccion=nueva_venta.direccion_entrega,
        ciudad=nueva_venta.ciudad,
        subtotal=subtotal_acum,
        impuestos=impuestos_calc,
        descuento=descuento_acum,
        total=total_final,
        metodo_pago=nueva_venta.metodo_pago,
        estado="pagada",
        fecha_emision=now_dt,
    )
    db.add(nueva_factura)
    db.flush()

    for d in detalles_para_crear:
        det_fac = DetalleFactura(
            factura_id=nueva_factura.id,
            tipo_item=d["tipo_item"],
            nombre_item=d["nombre_item"],
            precio_unitario=d["precio_unitario"],
            cantidad=d["cantidad"],
            subtotal=d["subtotal"],
        )
        db.add(det_fac)

    db.commit()
    db.refresh(nueva_venta)

    return {
        "ok": True,
        "message": "Venta y Factura registradas exitosamente.",
        "venta": serialize_venta(nueva_venta),
    }


@router.get("")
def consultar_historial_ventas(
    fecha_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="YYYY-MM-DD"),
    cliente: Optional[str] = Query(None, description="Nombre o email del cliente"),
    producto: Optional[str] = Query(None, description="Nombre del producto o servicio vendido"),
    estado: Optional[str] = Query(None, description="'completada', 'pendiente', 'cancelada'"),
    valor_min: Optional[float] = Query(None),
    valor_max: Optional[float] = Query(None),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Consulta el historial de ventas con múltiples criterios de filtrado:
    fecha, cliente, producto/servicio, estado y valor de la venta.
    """
    query = db.query(Venta)

    # Restringir a clientes para que solo vean sus compras
    if current_user and getattr(current_user, "rol_id", None) == 3:
        query = query.filter(
            or_(
                Venta.cliente_id == current_user.id,
                Venta.cliente_email == current_user.email,
            )
        )

    # Filtro por rango de fechas
    if fecha_inicio:
        try:
            f_ini = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(Venta.fecha_venta >= f_ini)
        except ValueError:
            pass

    if fecha_fin:
        try:
            f_fin = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Venta.fecha_venta <= f_fin)
        except ValueError:
            pass

    # Filtro por cliente
    if cliente:
        c_term = f"%{cliente.strip()}%"
        query = query.filter(
            or_(
                Venta.cliente_nombre.ilike(c_term),
                Venta.cliente_email.ilike(c_term),
                Venta.cliente_documento.ilike(c_term),
            )
        )

    # Filtro por estado
    if estado and estado.lower() != "todos":
        query = query.filter(Venta.estado == estado.strip().lower())

    # Filtro por valores
    if valor_min is not None:
        query = query.filter(Venta.total >= valor_min)
    if valor_max is not None:
        query = query.filter(Venta.total <= valor_max)

    # Filtro por producto o servicio en el detalle
    if producto:
        p_term = f"%{producto.strip()}%"
        query = query.join(Venta.detalles).filter(DetalleVenta.nombre_item.ilike(p_term))

    ventas = query.order_by(desc(Venta.fecha_venta)).all()

    return {
        "ok": True,
        "total": len(ventas),
        "ventas": [serialize_venta(v) for v in ventas],
    }


@router.get("/{id}")
def obtener_detalle_venta(
    id: int,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene el detalle completo de una venta por ID.
    """
    venta = db.query(Venta).filter(Venta.id == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")

    # Si es cliente, validar pertenencia
    if current_user and getattr(current_user, "rol_id", None) == 3:
        if venta.cliente_id != current_user.id and venta.cliente_email != current_user.email:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta venta.")

    return {
        "ok": True,
        "venta": serialize_venta(venta),
    }
