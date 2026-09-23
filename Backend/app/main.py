import sys
import os
from datetime import datetime, timezone
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# Cargar variables del archivo .env (incluidas las de SMTP para recuperación de contraseña)
# Se carga desde la carpeta Backend/ (padre de app/)
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(_env_path)

# Asegurar compatibilidad si se ejecuta directamente: python app/main.py o python main.py
if __package__ is None or __package__ == "":
    app_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(app_dir)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)

try:
    from .database import engine, Base
    from .routes.auth import router as auth_router
    from .routes.usuarios import router as usuarios_router
    from .routes.productos import router as productos_router
    from .routes.servicios import router as servicios_router
    from .routes.pedidos import router as pedidos_router
    from .routes.citas import router as citas_router
    from .routes.ventas import router as ventas_router
    from .routes.facturas import router as facturas_router
    from .routes.reportes import router as reportes_router
    from .routes.pqr import router as pqr_router
    from .routes.dashboard import router as dashboard_router
    from .routes.chatbot import router as chatbot_router
except (ImportError, ValueError):
    from app.database import engine, Base
    from app.routes.auth import router as auth_router
    from app.routes.usuarios import router as usuarios_router
    from app.routes.productos import router as productos_router
    from app.routes.servicios import router as servicios_router
    from app.routes.pedidos import router as pedidos_router
    from app.routes.citas import router as citas_router
    from app.routes.ventas import router as ventas_router
    from app.routes.facturas import router as facturas_router
    from app.routes.reportes import router as reportes_router
    from app.routes.pqr import router as pqr_router
    from app.routes.dashboard import router as dashboard_router
    from app.routes.chatbot import router as chatbot_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mitienda-api")

# Crear tablas en base de datos si no existen
try:
    Base.metadata.create_all(bind=engine)
    logger.info("[DB] Tablas inicializadas / verificadas en la base de datos.")

    # Migración segura: Asegurar que la columna pedido_id exista en ventas y facturas
    from sqlalchemy import text
    with engine.connect() as conn:
        for tabla in ["ventas", "facturas"]:
            try:
                conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN pedido_id INTEGER"))
                conn.commit()
                logger.info(f"[DB] Columna pedido_id agregada a {tabla}.")
            except Exception:
                # Ya existe la columna
                pass

    from app.database import SessionLocal
    from app.models import Usuario, Venta, Factura, PQR, Pedido, PedidoItem, DetalleVenta, DetalleFactura
    from sqlalchemy import func
    from decimal import Decimal

    def sincronizar_compras_facturas(db):
        """
        Garantiza que todas las compras realizadas correspondan exactamente con las facturas y ventas.
        Sincroniza registros existentes en ambas direcciones.
        """
        now_dt = datetime.now(timezone.utc)

        # 1. Ventas sin Pedido -> Generar Pedido y PedidoItem correspondiente
        ventas_sin_pedido = db.query(Venta).filter(Venta.pedido_id == None).all()
        for v in ventas_sin_pedido:
            ped = Pedido(
                usuario_id=v.cliente_id,
                cliente_nombre=v.cliente_nombre,
                cliente_email=v.cliente_email,
                cliente_telefono=v.cliente_telefono,
                direccion_envio=v.direccion_entrega or "Calle 100 # 15-20, Bogotá",
                ciudad=v.ciudad or "Bogotá",
                metodo_pago=v.metodo_pago or "efectivo",
                notas=v.notas,
                subtotal=float(v.subtotal or 0.0),
                envio=0.0,
                total=float(v.total or 0.0),
                estado="hecho" if v.estado == "completada" else "en revision",
                created_at=v.fecha_venta or now_dt,
            )
            db.add(ped)
            db.flush()
            v.pedido_id = ped.id
            if v.factura:
                v.factura.pedido_id = ped.id

            for d in v.detalles:
                p_item = PedidoItem(
                    pedido_id=ped.id,
                    producto_id=d.producto_id,
                    nombre_producto=d.nombre_item,
                    precio_unitario=float(d.precio_unitario or 0.0),
                    cantidad=d.cantidad,
                    subtotal=float(d.subtotal or 0.0),
                    imagen_url=None,
                )
                db.add(p_item)

        # 2. Pedidos sin Venta -> Generar Venta y Factura correspondiente
        pedidos_sin_venta = db.query(Pedido).filter(Pedido.venta == None).all()
        for p in pedidos_sin_venta:
            max_v_id = db.query(func.max(Venta.id)).scalar() or 0
            num_v = f"VTA-{now_dt.year}-{(max_v_id + 1):04d}"
            sub_dec = Decimal(str(round(float(p.subtotal or 0.0), 2)))
            imp_dec = (sub_dec * Decimal("0.19")).quantize(Decimal("0.01"))
            tot_dec = Decimal(str(round(float(p.total or 0.0), 2)))

            nueva_v = Venta(
                numero_venta=num_v,
                pedido_id=p.id,
                cliente_id=p.usuario_id,
                usuario_id=p.usuario_id,
                cliente_nombre=p.cliente_nombre,
                cliente_documento="222222222222",
                cliente_email=p.cliente_email,
                cliente_telefono=p.cliente_telefono,
                direccion_entrega=p.direccion_envio,
                ciudad=p.ciudad,
                metodo_pago=p.metodo_pago,
                subtotal=sub_dec,
                descuento=Decimal("0.00"),
                impuestos=imp_dec,
                total=tot_dec,
                estado="completada" if p.estado == "hecho" else "en revision",
                notas=p.notas,
                fecha_venta=p.created_at or now_dt,
            )
            db.add(nueva_v)
            db.flush()

            for it in p.items:
                det_v = DetalleVenta(
                    venta_id=nueva_v.id,
                    tipo_item="producto",
                    producto_id=it.producto_id,
                    nombre_item=it.nombre_producto,
                    precio_unitario=Decimal(str(it.precio_unitario)),
                    cantidad=it.cantidad,
                    descuento=Decimal("0.00"),
                    subtotal=Decimal(str(it.subtotal)),
                )
                db.add(det_v)

            max_f_id = db.query(func.max(Factura.id)).scalar() or 0
            num_f = f"FAC-{now_dt.year}-{(max_f_id + 1):04d}"

            nueva_f = Factura(
                numero_factura=num_f,
                venta_id=nueva_v.id,
                pedido_id=p.id,
                cliente_id=p.usuario_id,
                cliente_nombre=p.cliente_nombre,
                cliente_documento="222222222222",
                cliente_email=p.cliente_email,
                cliente_telefono=p.cliente_telefono,
                cliente_direccion=p.direccion_envio,
                ciudad=p.ciudad,
                subtotal=sub_dec,
                impuestos=imp_dec,
                descuento=Decimal("0.00"),
                total=tot_dec,
                metodo_pago=p.metodo_pago,
                estado="pagada" if p.estado == "hecho" else "emitida",
                fecha_emision=p.created_at or now_dt,
            )
            db.add(nueva_f)
            db.flush()

            for it in p.items:
                det_f = DetalleFactura(
                    factura_id=nueva_f.id,
                    tipo_item="producto",
                    nombre_item=it.nombre_producto,
                    precio_unitario=Decimal(str(it.precio_unitario)),
                    cantidad=it.cantidad,
                    subtotal=Decimal(str(it.subtotal)),
                )
                db.add(det_f)

        db.commit()

    db_session = SessionLocal()
    try:
        if db_session.query(Usuario).count() == 0:
            from seed import run_seed
            logger.info("[DB] Semilla inicial de usuarios, roles y catálogo no encontrada. Poblando datos base.")
            run_seed()
        if db_session.query(Venta).count() == 0 and db_session.query(Factura).count() == 0:
            from migrate_quinto_avance import run_migration
            logger.info("[DB] No se encontraron ventas/facturas. Poblando datos del quinto avance.")
            run_migration()
        if db_session.query(PQR).count() == 0:
            from migrate_quinto_avance import run_migration
            logger.info("[DB] No se encontraron PQRs. Poblando registros de soporte.")
            run_migration()
        # Sincronizar compras y facturas
        sincronizar_compras_facturas(db_session)
        logger.info("[DB] Sincronización de Compras y Facturas completada con éxito.")
    finally:
        db_session.close()
except Exception as e:
    logger.warning(f"[DB] Nota al verificar tablas: {e}")

app = FastAPI(
    title="API MiTienda - Quinto Avance FastAPI + React",
    description=(
        "Quinto Avance – Evolución integral con Módulo de Ventas, Facturación Electrónica en PDF, "
        "Reportes Diarios en PDF y Excel, Dashboards Analíticos por Rol con Gráficos, "
        "Módulo de PQR completo y Chatbot con Inteligencia Artificial.\n\n"
        "**SENA - Ficha 3406204 | Instructor: Jhan Hader Muñoz | Autor: Jonathan Martinez**"
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS para permitir comunicación fluida con React Vite
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen en desarrollo local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.exceptions import HTTPException as StarletteHTTPException

# Manejador personalizado para errores HTTP (incluyendo 404 y HTTPException)
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        msg = "Ruta no encontrada o recurso inexistente."
        if isinstance(exc.detail, str) and exc.detail not in ("Not Found", ""):
            msg = exc.detail
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"ok": False, "message": msg},
            headers=getattr(exc, "headers", None),
        )

    if isinstance(exc.detail, dict):
        content = {"ok": False, **exc.detail}
    else:
        content = {"ok": False, "message": exc.detail if exc.detail is not None else "Error del servidor"}

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=getattr(exc, "headers", None),
    )

# Manejador personalizado para errores de validación de esquemas Pydantic
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_dict = {}
    for err in exc.errors():
        field_name = ".".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        error_dict[field_name or "campo"] = err.get("msg", "Valor inválido")

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "ok": False,
            "message": "Error de validación en los datos enviados.",
            "errors": error_dict,
        },
    )

# Endpoints de estado / Health Check
@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "ok": True,
        "message": "API MiTienda funcionando correctamente.",
        "author": "Jonathan Martinez",
        "framework": "FastAPI (Python)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/", tags=["Health"])
def root():
    return {
        "ok": True,
        "message": "Bienvenido a la API de MiTienda - Cuarto Avance React + FastAPI",
        "author": "Jonathan Martinez",
        "docs": "/docs",
        "redoc": "/redoc",
    }

# Registro de routers con prefijo /api
app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(productos_router, prefix="/api")
app.include_router(servicios_router, prefix="/api")
app.include_router(pedidos_router, prefix="/api")
app.include_router(citas_router, prefix="/api")
app.include_router(ventas_router, prefix="/api")
app.include_router(facturas_router, prefix="/api")
app.include_router(reportes_router, prefix="/api")
app.include_router(pqr_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(chatbot_router, prefix="/api")

# Compatibilidad para rutas de descarga de facturas y reportes solicitadas en la raíz
app.include_router(facturas_router)
app.include_router(reportes_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

