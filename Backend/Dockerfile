# ================================================================
# DOCKERFILE - FASTAPI BACKEND PRODUCCIÓN (QUINTO AVANCE SENA)
# MiTienda: React + Vite + FastAPI + MySQL + ReportLab + IA
# ================================================================

FROM python:3.11-slim AS base

# Variables de entorno de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Instalar dependencias del sistema requeridas por pymysql / reportlab
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código fuente (incluyendo seed.py y migrate_quinto_avance.py en /app/)
COPY . .

# Exponer puerto configurado
EXPOSE 8000

# Health check para Railway: verifica que el API responda correctamente
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Comando de inicio del servidor ASGI Uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
