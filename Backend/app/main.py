import sys
import os
from datetime import datetime, timezone
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

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
except (ImportError, ValueError):
    from app.database import engine, Base
    from app.routes.auth import router as auth_router
    from app.routes.usuarios import router as usuarios_router
    from app.routes.productos import router as productos_router
    from app.routes.servicios import router as servicios_router
    from app.routes.pedidos import router as pedidos_router
    from app.routes.citas import router as citas_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mitienda-api")

# Crear tablas en base de datos si no existen
try:
    Base.metadata.create_all(bind=engine)
    logger.info("[DB] Tablas inicializadas / verificadas en la base de datos.")
except Exception as e:
    logger.warning(f"[DB] Nota al verificar tablas: {e}")

app = FastAPI(
    title="API MiTienda - FastAPI + React",
    description=(
        "Cuarto Avance – Integración Full Stack con React + Vite, FastAPI y Base de Datos SQL.\n\n"
        "**SENA - Ficha 3406204 | Instructor: Jhan Hader Muñoz | Autor: Jonathan Martinez**"
    ),
    version="1.0.0",
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

