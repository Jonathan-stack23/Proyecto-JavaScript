# -*- coding: utf-8 -*-
"""
Rutas de Facturación - Quinto Avance
Generación, consulta, creación manual, cambio de estado y descarga de facturas en PDF comercial estructurado.
"""
import io
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.database import get_db
from app.models import Usuario, Venta, DetalleFactura, Factura, Pedido, DetalleVenta, Servicio
from app.schemas import FacturaCreate
from app.dependencies import get_current_user, get_optional_current_user
from app.security import decode_access_token

router = APIRouter(prefix="/facturas", tags=["Facturas"])


# =============================================================================
# Schema local para PATCH /estado — evita el problema de body: dict en FastAPI
# =============================================================================

class EstadoFacturaUpdate(BaseModel):
    estado: str = Field(..., description="'emitida', 'pagada' o 'anulada'")


# Conjunto de estados válidos para facturas (constante)
ESTADOS_VALIDOS_FACTURA = {"emitida", "pagada", "anulada"}


def _empleado_tiene_acceso_factura(factura: Factura, user_id: int) -> bool:
    """Verifica si la factura está relacionada con algún servicio asignado al empleado."""
    if not factura or not factura.venta or not factura.venta.detalles:
        return False
    return any(
        d.servicio and d.servicio.usuario_id == user_id
        for d in factura.venta.detalles
    )


def _es_comprador_factura(factura: Factura, user: Optional[Usuario]) -> bool:
    """Verifica si el usuario es la persona que realizó la compra de la factura."""
    if not user or not factura:
        return False
    # Comparar por ID de cliente
    if factura.cliente_id is not None and factura.cliente_id == user.id:
        return True
    # Comparar por email de cliente
    if factura.cliente_email and user.email and factura.cliente_email.strip().lower() == user.email.strip().lower():
        return True
    # Comparar por pedido vinculado
    if factura.pedido and factura.pedido.usuario_id == user.id:
        return True
    # Comparar por venta vinculada
    if factura.venta:
        if factura.venta.cliente_id is not None and factura.venta.cliente_id == user.id:
            return True
        if factura.venta.cliente_email and user.email and factura.venta.cliente_email.strip().lower() == user.email.strip().lower():
            return True
    return False


def _verificar_acceso_factura(factura: Factura, user: Optional[Usuario]) -> None:
    """
    Valida permisos de lectura/descarga de factura:
    1. Quien compró la factura SIEMPRE tiene acceso a descargarla y verla.
    2. Los administradores tienen acceso a todas las facturas.
    3. Los empleados tienen acceso a sus compras y a las facturas con sus servicios asignados.
    4. Los clientes solo tienen acceso a sus propias compras.
    """
    if not user:
        return
    # 1. El comprador siempre puede acceder a su factura
    if _es_comprador_factura(factura, user):
        return
    # 2. Administrador tiene acceso total
    if getattr(user, "rol_id", None) == 1 or (user.rol and user.rol.nombre == "Administrador"):
        return
    # 3. Empleado: solo si tiene asignado algún servicio en la factura
    if getattr(user, "rol_id", None) == 2 or (user.rol and user.rol.nombre == "Empleado"):
        if _empleado_tiene_acceso_factura(factura, user.id):
            return
        raise HTTPException(status_code=403, detail="No tienes autorización para acceder a esta factura.")
    # 4. Otros usuarios (por ejemplo, cliente intentando ver factura ajena)
    raise HTTPException(status_code=403, detail="No tienes autorización para acceder a esta factura.")


def serialize_factura(f: Factura) -> dict:
    """Serializa un objeto Factura a dict seguro para JSON."""
    return {
        "id": f.id,
        "numero_factura": f.numero_factura,
        "venta_id": f.venta_id,
        "cliente_id": f.cliente_id,
        "cliente_nombre": f.cliente_nombre,
        "cliente_documento": f.cliente_documento,
        "cliente_email": f.cliente_email,
        "cliente_telefono": f.cliente_telefono,
        "cliente_direccion": f.cliente_direccion,
        "ciudad": f.ciudad,
        # Usar 'is not None' — Decimal("0.00") es falsy, pero debe serializar como 0.0
        "subtotal": float(f.subtotal) if f.subtotal is not None else 0.0,
        "impuestos": float(f.impuestos) if f.impuestos is not None else 0.0,
        "descuento": float(f.descuento) if f.descuento is not None else 0.0,
        "total": float(f.total) if f.total is not None else 0.0,
        "metodo_pago": f.metodo_pago,
        "estado": f.estado,
        "fecha_emision": f.fecha_emision.isoformat() if f.fecha_emision else None,
        "detalles": [
            {
                "id": d.id,
                "tipo_item": d.tipo_item,
                "nombre_item": d.nombre_item,
                "precio_unitario": float(d.precio_unitario) if d.precio_unitario is not None else 0.0,
                "cantidad": d.cantidad,
                "subtotal": float(d.subtotal) if d.subtotal is not None else 0.0,
            }
            for d in (f.detalles or [])
        ],
    }


def _generar_numero_factura(db: Session, year: int) -> str:
    """
    Genera número de factura consecutivo usando MAX(id)+1 en lugar de COUNT.
    Esto evita duplicados cuando hay brechas por eliminaciones o concurrencia.
    """
    max_id = db.query(func.max(Factura.id)).scalar() or 0
    return f"FAC-{year}-{(max_id + 1):04d}"


# =============================================================================
# GET /facturas — Consultar listado de facturas con filtros
# =============================================================================

@router.get("")
def consultar_facturas(
    numero: Optional[str] = Query(None, description="Número consecutivo de factura"),
    cliente: Optional[str] = Query(None, description="Nombre o documento del cliente"),
    fecha: Optional[str] = Query(None, description="YYYY-MM-DD"),
    estado: Optional[str] = Query(None, description="'emitida', 'pagada', 'anulada'"),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Consulta el listado de facturas con filtros por número de factura, cliente o fecha.
    - Admin/Empleado: ven todas las facturas.
    - Cliente: solo ve sus propias facturas.
    """
    query = db.query(Factura)

    # Si es cliente, solo ve sus facturas
    if current_user and getattr(current_user, "rol_id", None) == 3:
        query = query.filter(
            or_(
                Factura.cliente_id == current_user.id,
                Factura.cliente_email == current_user.email,
            )
        )
    # Si es empleado, ve las facturas asociadas a sus servicios asignados O aquellas donde fue el comprador
    elif current_user and (
        getattr(current_user, "rol_id", None) == 2
        or (current_user.rol and current_user.rol.nombre == "Empleado")
    ):
        query = (
            query.outerjoin(Factura.venta)
            .outerjoin(Venta.detalles)
            .outerjoin(DetalleVenta.servicio)
            .filter(
                or_(
                    Factura.cliente_id == current_user.id,
                    Factura.cliente_email == current_user.email,
                    Servicio.usuario_id == current_user.id,
                )
            )
            .distinct()
        )

    if numero and isinstance(numero, str) and numero.strip():
        query = query.filter(Factura.numero_factura.ilike(f"%{numero.strip()}%"))

    if cliente and isinstance(cliente, str) and cliente.strip():
        c_term = f"%{cliente.strip()}%"
        query = query.filter(
            or_(
                Factura.cliente_nombre.ilike(c_term),
                Factura.cliente_documento.ilike(c_term),
                Factura.cliente_email.ilike(c_term),
            )
        )

    if fecha and isinstance(fecha, str) and fecha.strip():
        try:
            fecha_clean = fecha.strip()
            f_ini = datetime.strptime(fecha_clean, "%Y-%m-%d")
            f_fin = datetime.strptime(f"{fecha_clean} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Factura.fecha_emision >= f_ini, Factura.fecha_emision <= f_fin)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de fecha inválido. Use YYYY-MM-DD (ej: 2026-09-15).",
            )

    # Normalizar estado ANTES de comparar con 'todos' para evitar falsos positivos
    if estado and isinstance(estado, str):
        estado_norm = estado.strip().lower()
        if estado_norm != "todos":
            query = query.filter(Factura.estado == estado_norm)

    facturas = query.order_by(desc(Factura.fecha_emision)).all()

    return {
        "ok": True,
        "total": len(facturas),
        "facturas": [serialize_factura(f) for f in facturas],
    }


# =============================================================================
# POST /facturas — Crear factura manualmente a partir de una venta existente
# =============================================================================

@router.post("", status_code=status.HTTP_201_CREATED)
def crear_factura_manual(
    data: FacturaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crea una factura manualmente a partir de una venta existente.
    Solo administradores y empleados pueden crear facturas manualmente.
    Útil cuando la generación automática falló o se necesita re-facturar.
    """
    # Validación de rol: solo admin (1) o empleado (2)
    if getattr(current_user, "rol_id", None) not in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores y empleados pueden crear facturas manualmente.",
        )

    # Verificar que la venta exista
    venta = db.query(Venta).filter(Venta.id == data.venta_id).first()
    if not venta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la venta con ID {data.venta_id}.",
        )

    # Verificar que no exista ya una factura para esa venta
    existente = db.query(Factura).filter(Factura.venta_id == data.venta_id).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe la factura {existente.numero_factura} para la venta #{data.venta_id}.",
        )

    now_dt = datetime.now(timezone.utc)

    # Generar número de factura consecutivo de forma segura (MAX id, no COUNT)
    numero_factura = _generar_numero_factura(db, now_dt.year)

    # Limpiar ciudad: descartar strings que sean solo espacios
    ciudad_final = (data.ciudad or "").strip() or (venta.ciudad or "").strip() or "Bogotá"

    nueva_factura = Factura(
        numero_factura=numero_factura,
        venta_id=venta.id,
        cliente_id=venta.cliente_id,
        cliente_nombre=venta.cliente_nombre,
        cliente_documento=(data.cliente_documento or "").strip() or venta.cliente_documento or "222222222222",
        cliente_email=venta.cliente_email,
        cliente_telefono=venta.cliente_telefono,
        cliente_direccion=(data.cliente_direccion or "").strip() or venta.direccion_entrega,
        ciudad=ciudad_final,
        subtotal=venta.subtotal,
        impuestos=venta.impuestos,
        descuento=venta.descuento,
        total=venta.total,
        metodo_pago=venta.metodo_pago,
        estado="emitida",
        fecha_emision=now_dt,
    )
    db.add(nueva_factura)
    db.flush()

    # Copiar detalles de la venta a la factura
    for det in venta.detalles:
        det_fac = DetalleFactura(
            factura_id=nueva_factura.id,
            tipo_item=det.tipo_item,
            nombre_item=det.nombre_item,
            precio_unitario=det.precio_unitario,
            cantidad=det.cantidad,
            subtotal=det.subtotal,
        )
        db.add(det_fac)

    db.commit()
    db.refresh(nueva_factura)

    return {
        "ok": True,
        "message": f"Factura {numero_factura} creada exitosamente para la venta #{data.venta_id}.",
        "factura": serialize_factura(nueva_factura),
    }


# =============================================================================
# GET /facturas/venta/{venta_id} — Obtener la factura de una venta específica
# =============================================================================

@router.get("/venta/{venta_id}")
def obtener_factura_por_venta(
    venta_id: int,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna la factura asociada a una venta específica por venta_id.
    """
    factura = db.query(Factura).filter(Factura.venta_id == venta_id).first()
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró factura para la venta #{venta_id}.",
        )

    _verificar_acceso_factura(factura, current_user)

    return {
        "ok": True,
        "factura": serialize_factura(factura),
    }


# =============================================================================
# GET /facturas/pedido/{pedido_id} — Obtener la factura de un pedido específico
# =============================================================================

@router.get("/pedido/{pedido_id}")
def obtener_factura_por_pedido(
    pedido_id: int,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna la factura asociada a un pedido específico por pedido_id.
    """
    factura = db.query(Factura).filter(Factura.pedido_id == pedido_id).first()
    if not factura:
        # Intentar buscar por venta vinculada al pedido
        venta = db.query(Venta).filter(Venta.pedido_id == pedido_id).first()
        if venta and venta.factura:
            factura = venta.factura

    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró factura para el pedido #{pedido_id}.",
        )

    _verificar_acceso_factura(factura, current_user)

    return {
        "ok": True,
        "factura": serialize_factura(factura),
    }


# =============================================================================
# GET /facturas/{id} — Obtener detalle completo de una factura por ID
# =============================================================================

@router.get("/{id}")
def obtener_factura_por_id(
    id: int,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna el detalle completo de una factura por ID.
    """
    factura = db.query(Factura).filter(Factura.id == id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    _verificar_acceso_factura(factura, current_user)

    return {
        "ok": True,
        "factura": serialize_factura(factura),
    }


# =============================================================================
# PATCH /facturas/{id}/estado — Cambiar estado de una factura
# =============================================================================

@router.patch("/{id}/estado")
def cambiar_estado_factura(
    id: int,
    body: EstadoFacturaUpdate,   # ← Schema Pydantic (corrige el fallo de body: dict en FastAPI)
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cambia el estado de una factura: 'emitida', 'pagada' o 'anulada'.
    Solo administradores (rol 1) y empleados (rol 2) pueden cambiar el estado.
    """
    # Validación de rol
    if getattr(current_user, "rol_id", None) not in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores y empleados pueden modificar el estado de facturas.",
        )

    nuevo_estado = body.estado.strip().lower()

    if nuevo_estado not in ESTADOS_VALIDOS_FACTURA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Estado '{body.estado}' inválido. "
                f"Los valores permitidos son: {', '.join(sorted(ESTADOS_VALIDOS_FACTURA))}."
            ),
        )

    factura = db.query(Factura).filter(Factura.id == id).first()
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada.",
        )

    # Si es empleado, solo puede modificar facturas con sus servicios asignados
    if getattr(current_user, "rol_id", None) == 2 or (
        current_user.rol and current_user.rol.nombre == "Empleado"
    ):
        if not _empleado_tiene_acceso_factura(factura, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes modificar facturas asociadas a tus servicios.",
            )

    estado_anterior = factura.estado
    factura.estado = nuevo_estado
    db.commit()
    db.refresh(factura)

    return {
        "ok": True,
        "message": (
            f"Estado de la factura {factura.numero_factura} "
            f"actualizado de '{estado_anterior}' a '{nuevo_estado}'."
        ),
        "factura": serialize_factura(factura),
    }


# =============================================================================
# GENERACIÓN DE FACTURA EN PDF Y RUTAS DE DESCARGA
# =============================================================================

def _resolver_usuario_actual(
    current_user: Optional[Usuario],
    token: Optional[str],
    db: Session,
) -> Optional[Usuario]:
    """Resuelve el usuario autenticado desde el header Bearer o desde query token."""
    if current_user:
        return current_user
    if token:
        try:
            payload = decode_access_token(token)
            email = payload.get("sub") or payload.get("email")
            if email:
                return db.query(Usuario).filter(Usuario.email.ilike(email)).first()
        except Exception:
            pass
    return None


def generar_buffer_pdf_factura(factura: Factura) -> io.BytesIO:
    """
    Construye el documento PDF estructurado de la factura con diseño comercial y retorna el buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f0a1e"),
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "InvoiceSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#6b6375"),
    )
    label_style = ParagraphStyle(
        "LabelStyle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4b5563"),
        fontName="Helvetica-Bold",
    )
    val_style = ParagraphStyle(
        "ValStyle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#111827"),
    )

    elements = []

    # 1. Encabezado de la Factura (Dos columnas: Empresa | Factura #)
    fecha_emision_str = factura.fecha_emision.strftime('%d/%m/%Y %H:%M') if factura.fecha_emision else 'N/A'
    header_data = [
        [
            Paragraph("<b>MITIENDA S.A.S.</b><br/>NIT: 901.340.620-4<br/>Calle 100 # 15-20, Bogotá, Colombia<br/>Tel: (+57) 300 123 4567 | soporte@mitienda.com", subtitle_style),
            Paragraph(f"<font color='#6366f1'><b>FACTURA DE VENTA</b></font><br/><b>{factura.numero_factura}</b><br/>Fecha: {fecha_emision_str}<br/>Estado: <b>{factura.estado.upper()}</b>", title_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#e5e7eb"), spaceAfter=15))

    # 2. Información del Cliente y Método de Pago
    ref_venta = f"#{factura.venta_id}" if factura.venta_id else "N/A"
    ref_pedido = f" (Pedido #{factura.pedido_id})" if getattr(factura, "pedido_id", None) else ""
    info_data = [
        [
            Paragraph("<b>ADQUIRIENTE / CLIENTE</b>", label_style),
            Paragraph("<b>INFORMACIÓN DE PAGO</b>", label_style),
        ],
        [
            Paragraph(f"<b>Nombre:</b> {factura.cliente_nombre}<br/><b>Doc / NIT:</b> {factura.cliente_documento}<br/><b>Email:</b> {factura.cliente_email}<br/><b>Teléfono:</b> {factura.cliente_telefono or 'N/A'}<br/><b>Dirección:</b> {factura.cliente_direccion or 'Bogotá, Colombia'}<br/><b>Ciudad:</b> {factura.ciudad or 'Bogotá'}", val_style),
            Paragraph(f"<b>Método de pago:</b> {factura.metodo_pago.replace('_', ' ').title()}<br/><b>Moneda:</b> COP (Pesos Colombianos)<br/><b>Referencia:</b> Venta {ref_venta}{ref_pedido}<br/><b>Condición:</b> Contado", val_style),
        ]
    ]
    info_table = Table(info_data, colWidths=[3.5 * inch, 3.5 * inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # 3. Tabla de Productos y Servicios Facturados
    table_header = ["Tipo", "Descripción del Ítem", "Cant.", "Precio Unitario", "Subtotal"]
    items_rows = [table_header]

    for it in (factura.detalles or []):
        items_rows.append([
            it.tipo_item.capitalize(),
            it.nombre_item,
            str(it.cantidad),
            f"${float(it.precio_unitario):,.0f}" if it.precio_unitario is not None else "$0",
            f"${float(it.subtotal):,.0f}" if it.subtotal is not None else "$0",
        ])

    items_table = Table(items_rows, colWidths=[0.9 * inch, 3.1 * inch, 0.7 * inch, 1.2 * inch, 1.3 * inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#6366f1")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # 4. Totales
    sub = float(factura.subtotal) if factura.subtotal is not None else 0.0
    desc = float(factura.descuento) if factura.descuento is not None else 0.0
    imp = float(factura.impuestos) if factura.impuestos is not None else 0.0
    tot = float(factura.total) if factura.total is not None else 0.0

    totals_data = [
        ["Subtotal:", f"${sub:,.0f}"],
        ["Descuento:", f"-${desc:,.0f}"],
        ["IVA (19%):", f"${imp:,.0f}"],
        ["TOTAL FACTURADO:", f"${tot:,.0f}"],
    ]
    totals_table = Table(totals_data, colWidths=[2.2 * inch, 1.3 * inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 3), (-1, 3), 11),
        ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor("#4f46e5")),
        ('LINEABOVE', (0, 3), (-1, 3), 1, colors.HexColor("#6366f1")),
    ]))

    totals_wrapper = Table([["", totals_table]], colWidths=[3.7 * inch, 3.5 * inch])
    totals_wrapper.setStyle(TableStyle([('ALIGN', (1, 0), (1, 0), 'RIGHT')]))
    elements.append(totals_wrapper)
    elements.append(Spacer(1, 30))

    # 5. Pie de página institucional
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=10))
    footer_text = Paragraph(
        "<font size=8 color='#9ca3af'>"
        "Esta factura constituye título valor en los términos del Código de Comercio Colombiano.<br/>"
        "Resolución DIAN No. 18764000123 de 2026. Rango autorizado FAC-2026-0001 a FAC-2026-9999.<br/>"
        "Generado por Sistema de Facturación MiTienda — SENA Ficha 3406204 | Autor: Jonathan Martinez"
        "</font>",
        subtitle_style,
    )
    elements.append(footer_text)

    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/{id}/pdf")
def descargar_factura_pdf(
    id: int,
    token: Optional[str] = Query(None, description="Token JWT para autenticación vía query string"),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera y descarga la factura en formato PDF por su ID.
    """
    user = _resolver_usuario_actual(current_user, token, db)
    factura = db.query(Factura).filter(Factura.id == id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    _verificar_acceso_factura(factura, user)

    buffer = generar_buffer_pdf_factura(factura)
    filename = f"Factura_{factura.numero_factura}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )


@router.get("/pedido/{pedido_id}/pdf")
def descargar_factura_pedido_pdf(
    pedido_id: int,
    token: Optional[str] = Query(None, description="Token JWT para autenticación vía query string"),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera y descarga la factura en formato PDF a partir del ID de un pedido.
    """
    user = _resolver_usuario_actual(current_user, token, db)
    factura = db.query(Factura).filter(Factura.pedido_id == pedido_id).first()
    if not factura:
        venta = db.query(Venta).filter(Venta.pedido_id == pedido_id).first()
        if venta and venta.factura:
            factura = venta.factura

    if not factura:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró factura para el pedido #{pedido_id}.",
        )

    _verificar_acceso_factura(factura, user)

    buffer = generar_buffer_pdf_factura(factura)
    filename = f"Factura_{factura.numero_factura}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )


@router.get("/venta/{venta_id}/pdf")
def descargar_factura_venta_pdf(
    venta_id: int,
    token: Optional[str] = Query(None, description="Token JWT para autenticación vía query string"),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera y descarga la factura en formato PDF a partir del ID de una venta.
    """
    user = _resolver_usuario_actual(current_user, token, db)
    factura = db.query(Factura).filter(Factura.venta_id == venta_id).first()
    if not factura:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró factura para la venta #{venta_id}.",
        )

    _verificar_acceso_factura(factura, user)

    buffer = generar_buffer_pdf_factura(factura)
    filename = f"Factura_{factura.numero_factura}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )
