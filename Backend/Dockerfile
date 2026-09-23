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

# Copiar código fuente
COPY . .

# Exponer puerto configurado
EXPOSE 8000

# Comando de inicio del servidor ASGI Uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
