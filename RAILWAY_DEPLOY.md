# 🚀 Guía de Despliegue en Railway — MiTienda

> Guía paso a paso para desplegar el backend (FastAPI) y frontend (React + Vite)
> en Railway con base de datos MySQL gestionada.

---

## Prerrequisitos

- Cuenta en [railway.app](https://railway.app)
- Repositorio en GitHub con este código
- Railway CLI instalado (opcional): `npm install -g @railway/cli`

---

## Paso 1 — Crear el Proyecto en Railway

1. Ir a [railway.app/new](https://railway.app/new)
2. Seleccionar **"Deploy from GitHub repo"**
3. Autorizar Railway y seleccionar el repositorio `ReactProyecto`
4. Railway detectará el `railway.json` raíz → creará el **Servicio Backend** automáticamente

---

## Paso 2 — Agregar el Plugin MySQL

1. En el dashboard del proyecto, clic en **"+ New"** → **"Database"** → **"Add MySQL"**
2. Railway provisiona MySQL automáticamente y expone `$MYSQL_URL` (o `$DATABASE_URL`)
3. Copiar la variable `DATABASE_URL` — se usará en el backend

> **IMPORTANTE**: Railway puede llamar a la variable `MYSQL_URL` o `DATABASE_URL` según la versión.
> Verifica en la sección **Variables** del servicio MySQL cuál es el nombre exacto.

---

## Paso 3 — Configurar Variables del Servicio Backend

En el panel de Railway → **Backend Service** → **Variables**, configurar:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` (referencia Railway) |
| `SECRET_KEY` | Genera: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
| `FRONTEND_URL` | *(Dejar vacío por ahora — se completa en Paso 5)* |
| `SMTP_USER` | *(Opcional)* Correo Gmail para recuperación de contraseña |
| `SMTP_PASS` | *(Opcional)* Contraseña de aplicación de Gmail |

---

## Paso 4 — Crear el Servicio Frontend

1. En el dashboard, clic en **"+ New"** → **"GitHub Repo"** → seleccionar el mismo repositorio
2. Ir a su configuración del nuevo servicio:
   - **Settings → Build → Root Directory**: `frontend`
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `frontend/Dockerfile`

### Variables del Servicio Frontend

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://<tu-backend>.up.railway.app/api` |

> **IMPORTANTE**: `VITE_API_URL` es una **Build Variable**. Se pasa como `--build-arg` al Dockerfile.
> El Dockerfile la declara como `ARG VITE_API_URL` para que Vite la incluya en el bundle.

---

## Paso 5 — Vincular URLs entre Servicios

Una vez que el backend esté desplegado y tenga una URL pública:

1. Copiar la URL del Backend (ej. `https://mitienda-backend-production.up.railway.app`)
2. En **Frontend Service → Variables** → actualizar:
   ```
   VITE_API_URL=https://mitienda-backend-production.up.railway.app/api
   ```
3. En **Backend Service → Variables** → agregar:
   ```
   FRONTEND_URL=https://mitienda-frontend-production.up.railway.app
   ```
4. Hacer **redeploy** de ambos servicios

---

## Paso 6 — Verificación

### Checklist de Verificación

- [ ] Backend Health: `GET https://<backend-url>/health` → `{"ok": true, ...}`
- [ ] Backend Docs: `GET https://<backend-url>/docs` → Swagger UI carga
- [ ] Frontend: La URL del frontend muestra la app React sin errores
- [ ] CORS OK: El frontend puede hacer requests al backend (DevTools → Network)
- [ ] Login Admin: `admin@mitienda.com` / `Admin1234!`
- [ ] MySQL conectada: Datos del seed se cargan en el primer arranque

---

## Estructura de Archivos de Configuración Railway

```
ReactProyecto/
├── railway.json              ← Config del servicio Backend (raíz)
├── Backend/
│   └── Dockerfile            ← Build del backend FastAPI
└── frontend/
    ├── Dockerfile            ← Build multi-stage: Node → Nginx
    ├── nginx.conf            ← Config Nginx SPA
    └── railway.json          ← Config del servicio Frontend
```

---

## Solución de Problemas Frecuentes

### ModuleNotFoundError: No module named 'seed'
El Dockerfile copia todo con `COPY . .` desde `/app/`, seed.py queda en `/app/seed.py`.
El `sys.path` en `main.py` ya apunta al directorio correcto. Si persiste, verificar que
el contexto de build de Docker sea `Backend/`.

### CORS policy: No 'Access-Control-Allow-Origin'
La variable `FRONTEND_URL` en el backend no coincide con el dominio del frontend.
Verificar que NO tenga `/` al final y que el protocolo sea `https://`.

### Frontend muestra pantalla en blanco
- `VITE_API_URL` no está configurada → configurar y hacer redeploy del frontend.
- Las rutas de React Router no funcionan → verificar que `nginx.conf` esté copiado.

### MySQL: Can't connect to MySQL server
Usar referencia dinámica de Railway: `${{MySQL.DATABASE_URL}}` en lugar de valor hardcodeado.

### Build falla: npm ci error
`package-lock.json` desincronizado. Ejecutar `npm install` localmente y subir el nuevo lock.

---

## Comandos Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Ver logs del servicio
railway logs --service backend

# Ver variables
railway variables --service backend
```

---

*Proyecto: MiTienda — SENA Ficha 3406204 | Autor: Jonathan Martinez*
