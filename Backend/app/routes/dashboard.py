"""
Rutas de Dashboard y Analítica de Datos - Quinto Avance
Endpoints para alimentar Cards de KPIs y gráficos analíticos de barras y líneas
con filtros en tiempo real y soporte por roles (Administrador, Empleado y Cliente).
"""
from typing import Optional, List, Any
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, cast, Date, and_

from app.database import get_db
from app.models import Usuario, Producto, Servicio, Venta, DetalleVenta, Factura, PQR
from app.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def obtener_estadisticas_dashboard(
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna métricas consolidadas (KPIs) en tiempo real.
    Si el usuario es Cliente, retorna sus estadísticas personales (sus compras, facturas y PQR).
    Si es Administrador o Empleado, retorna métricas globales del sistema.
    """
    rol = current_user.rol.nombre if (current_user and current_user.rol) else "Invitado"

    if rol == "Cliente":
        # Métricas específicas del cliente
        total_ventas_cliente = (
            db.query(func.count(Venta.id))
            .filter(Venta.cliente_id == current_user.id)
            .scalar() or 0
        )
        total_gastado_cliente = (
            db.query(func.sum(Venta.total))
            .filter(Venta.cliente_id == current_user.id, Venta.estado != "anulada")
            .scalar() or Decimal("0.00")
        )
        pqr_cliente = (
            db.query(func.count(PQR.id))
            .filter(PQR.usuario_id == current_user.id)
            .scalar() or 0
        )
        pqr_pendientes_cliente = (
            db.query(func.count(PQR.id))
            .filter(PQR.usuario_id == current_user.id, PQR.estado == "pendiente")
            .scalar() or 0
        )

        return {
            "ok": True,
            "rol": rol,
            "stats": {
                "total_compras": total_ventas_cliente,
                "total_gastado": float(total_gastado_cliente),
                "pqr_radicadas": pqr_cliente,
                "pqr_pendientes": pqr_pendientes_cliente,
                "servicios_disponibles": db.query(func.count(Servicio.id)).filter(Servicio.estado == "activo").scalar() or 0,
                "productos_disponibles": db.query(func.count(Producto.id)).filter(Producto.estado == "activo").scalar() or 0,
            }
        }

    # Métricas globales para Administrador y Empleado
    hoy = date.today()

    total_usuarios = db.query(func.count(Usuario.id)).scalar() or 0
    total_productos = db.query(func.count(Producto.id)).scalar() or 0
    total_servicios = db.query(func.count(Servicio.id)).scalar() or 0
    total_ventas = db.query(func.count(Venta.id)).scalar() or 0
    
    facturacion_total = (
        db.query(func.sum(Venta.total))
        .filter(Venta.estado != "anulada")
        .scalar() or Decimal("0.00")
    )
    
    pqr_totales = db.query(func.count(PQR.id)).scalar() or 0
    pqr_pendientes = (
        db.query(func.count(PQR.id))
        .filter(PQR.estado == "pendiente")
        .scalar() or 0
    )

    # Ventas de hoy
    ventas_hoy = (
        db.query(func.count(Venta.id))
        .filter(cast(Venta.fecha_venta, Date) == hoy)
        .scalar() or 0
    )
    facturacion_hoy = (
        db.query(func.sum(Venta.total))
        .filter(cast(Venta.fecha_venta, Date) == hoy, Venta.estado != "anulada")
        .scalar() or Decimal("0.00")
    )

    return {
        "ok": True,
        "rol": rol,
        "stats": {
            "total_usuarios": total_usuarios,
            "total_productos": total_productos,
            "total_servicios": total_servicios,
            "total_ventas": total_ventas,
            "facturacion_total": float(facturacion_total),
            "pqr_totales": pqr_totales,
            "pqr_pendientes": pqr_pendientes,
            "ventas_hoy": ventas_hoy,
            "facturacion_hoy": float(facturacion_hoy),
        }
    }


@router.get("/charts")
def obtener_graficos_dashboard(
    fecha_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="YYYY-MM-DD"),
    dias: Optional[int] = Query(14, description="Número de días para la serie temporal"),
    db: Session = Depends(get_db),
):
    """
    Retorna series de datos para gráficos interactivos:
    1. Gráfico de Barras: Ventas e ingresos agrupados por fecha.
    2. Gráfico de Líneas: Tendencia financiera y recaudación acumulada.
    3. Distribución: Top productos más vendidos y servicios más contratados.
    Soporta filtros dinámicos por rango de fechas.
    """
    # 1. Filtros de fecha
    if fecha_inicio:
        try:
            dt_inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d")
        except ValueError:
            dt_inicio = datetime.now() - timedelta(days=dias or 14)
    else:
        dt_inicio = datetime.now() - timedelta(days=dias or 14)

    if fecha_fin:
        try:
            dt_fin = datetime.strptime(fecha_fin, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except ValueError:
            dt_fin = datetime.now()
    else:
        dt_fin = datetime.now()

    # Query ventas agrupadas por día. DATE() evita el error de conversión de
    # SQLite al procesar CAST(... AS DATE) con SQLAlchemy.
    fecha_agrupada = func.date(Venta.fecha_venta)
    query_agrupada = (
        db.query(
            fecha_agrupada.label("fecha"),
            func.count(Venta.id).label("total_ventas"),
            func.sum(Venta.total).label("ingresos"),
        )
        .filter(
            Venta.fecha_venta >= dt_inicio,
            Venta.fecha_venta <= dt_fin,
            Venta.estado != "anulada",
        )
        .group_by(fecha_agrupada)
        .order_by(fecha_agrupada.asc())
        .all()
    )

    # Preparar series continuas de días para gráficos fluidos
    mapa_dias = {}
    for row in query_agrupada:
        if hasattr(row.fecha, "strftime"):
            f_str = row.fecha.strftime("%Y-%m-%d")
        else:
            f_str = str(row.fecha or "").strip().split(" ")[0].split("T")[0]
        mapa_dias[f_str] = {
            "ventas": int(row.total_ventas or 0),
            "ingresos": float(row.ingresos or 0.0),
        }

    # Generar todos los días en el rango
    delta_days = (dt_fin.date() - dt_inicio.date()).days
    if delta_days < 0:
        delta_days = 14
    if delta_days > 60:
        delta_days = 60  # límite razonable para legibilidad visual

    ventas_por_periodo = []
    ingresos_por_periodo = []
    ingresos_acumulados = []
    acumulado = 0.0

    for i in range(delta_days + 1):
        cur_date = dt_inicio.date() + timedelta(days=i)
        cur_str = cur_date.strftime("%Y-%m-%d")
        dia_nombre = cur_date.strftime("%d/%m")

        datos_dia = mapa_dias.get(cur_str, {"ventas": 0, "ingresos": 0.0})
        ventas_cnt = datos_dia["ventas"]
        ingresos_val = datos_dia["ingresos"]
        acumulado += ingresos_val

        ventas_por_periodo.append({
            "label": dia_nombre,
            "fecha": cur_str,
            "valor": float(ventas_cnt),
            "cantidad": ventas_cnt,
        })
        ingresos_por_periodo.append({
            "label": dia_nombre,
            "fecha": cur_str,
            "valor": round(ingresos_val, 2),
        })
        ingresos_acumulados.append({
            "label": dia_nombre,
            "fecha": cur_str,
            "valor": round(acumulado, 2),
        })

    # 2. Top Productos más vendidos
    top_productos_query = (
        db.query(
            DetalleVenta.nombre_item.label("nombre"),
            func.sum(DetalleVenta.cantidad).label("total_cantidad"),
            func.sum(DetalleVenta.subtotal).label("total_ingresos"),
        )
        .join(Venta, Venta.id == DetalleVenta.venta_id)
        .filter(
            DetalleVenta.tipo_item == "producto",
            Venta.fecha_venta >= dt_inicio,
            Venta.fecha_venta <= dt_fin,
            Venta.estado != "anulada",
        )
        .group_by(DetalleVenta.nombre_item)
        .order_by(desc("total_cantidad"))
        .limit(5)
        .all()
    )

    top_productos = [
        {
            "label": p.nombre,
            "valor": float(p.total_ingresos or 0.0),
            "cantidad": int(p.total_cantidad or 0),
        }
        for p in top_productos_query
    ]

    # 3. Top Servicios más solicitados
    top_servicios_query = (
        db.query(
            DetalleVenta.nombre_item.label("nombre"),
            func.sum(DetalleVenta.cantidad).label("total_cantidad"),
            func.sum(DetalleVenta.subtotal).label("total_ingresos"),
        )
        .join(Venta, Venta.id == DetalleVenta.venta_id)
        .filter(
            DetalleVenta.tipo_item == "servicio",
            Venta.fecha_venta >= dt_inicio,
            Venta.fecha_venta <= dt_fin,
            Venta.estado != "anulada",
        )
        .group_by(DetalleVenta.nombre_item)
        .order_by(desc("total_cantidad"))
        .limit(5)
        .all()
    )

    top_servicios = [
        {
            "label": s.nombre,
            "valor": float(s.total_ingresos or 0.0),
            "cantidad": int(s.total_cantidad or 0),
        }
        for s in top_servicios_query
    ]

    # 4. Distribución por Estado de Venta
    estados_query = (
        db.query(
            Venta.estado,
            func.count(Venta.id).label("total"),
        )
        .filter(
            Venta.fecha_venta >= dt_inicio,
            Venta.fecha_venta <= dt_fin,
        )
        .group_by(Venta.estado)
        .all()
    )
    distribucion_estados = [
        {"label": str(e.estado).capitalize(), "valor": int(e.total or 0)}
        for e in estados_query
    ]

    return {
        "ok": True,
        "rango": {
            "fecha_inicio": dt_inicio.strftime("%Y-%m-%d"),
            "fecha_fin": dt_fin.strftime("%Y-%m-%d"),
            "dias_totales": delta_days + 1,
        },
        "ventas_por_periodo": ventas_por_periodo,
        "ingresos_por_periodo": ingresos_por_periodo,
        "ingresos_acumulados": ingresos_acumulados,
        "top_productos": top_productos,
        "top_servicios": top_servicios,
        "distribucion_estados": distribucion_estados,
    }
