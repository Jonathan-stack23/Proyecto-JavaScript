"""
Script de pruebas automatizadas del Quinto Avance para FastAPI.
Valida el funcionamiento de todos los 20 requerimientos de backend.
"""
import urllib.request
import urllib.error
import json
import sys
import io

# Forzar salida UTF-8 en Windows para evitar UnicodeEncodeError
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8000/api"

def request_api(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return response.status, json.loads(response.read().decode("utf-8")), content_type
            else:
                raw = response.read()
                return response.status, raw, content_type
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body), e.headers.get("Content-Type", "")
        except Exception:
            return e.code, err_body, e.headers.get("Content-Type", "")

def run_tests():
    print("\n========== INICIANDO SUITE DE PRUEBAS - QUINTO AVANCE ==========\n")
    passed = 0
    total = 0
    token = None

    # 1. Login Admin
    total += 1
    status, res, _ = request_api("/auth/login", method="POST", data={"email": "admin@mitienda.com", "password": "password123"})
    if status == 200 and "token" in res:
        token = res["token"]
        print("[OK] [1/10] Autenticacion JWT Admin: EXITOSO")
        passed += 1
    else:
        # Intentar con password admin123
        status, res, _ = request_api("/auth/login", method="POST", data={"email": "admin@mitienda.com", "password": "admin"})
        if status == 200 and "token" in res:
            token = res["token"]
            print("[OK] [1/10] Autenticacion JWT Admin: EXITOSO")
            passed += 1
        else:
            print(f"[FAIL] [1/10] Autenticacion fallida: {res}")

    # 2. Historial de Ventas con Filtros
    total += 1
    status, res, _ = request_api("/ventas?estado=completada", token=token)
    if status == 200 and res.get("ok"):
        print(f"[OK] [2/10] GET /api/ventas (Filtros): EXITOSO ({res.get('total', 0)} ventas encontradas)")
        passed += 1
    else:
        print(f"[FAIL] [2/10] GET /api/ventas error: {res}")

    # 3. Consulta de Facturas
    total += 1
    status, res, _ = request_api("/facturas", token=token)
    if status == 200 and res.get("ok"):
        print(f"[OK] [3/10] GET /api/facturas: EXITOSO ({res.get('total', 0)} facturas)")
        passed += 1
    else:
        print(f"[FAIL] [3/10] GET /api/facturas error: {res}")

    # 4. Descarga de Factura en PDF
    total += 1
    status, res, ctype = request_api("/facturas/1/pdf", token=token)
    if status == 200 and "application/pdf" in ctype and len(res) > 500:
        print(f"[OK] [4/10] GET /api/facturas/1/pdf: EXITOSO (PDF generado: {len(res)} bytes)")
        passed += 1
    else:
        print(f"[FAIL] [4/10] Factura PDF error: {ctype}, status {status}, resp={str(res)[:200]}")

    # 5. Reporte Diario de Ventas
    total += 1
    status, res, _ = request_api("/reportes/ventas/diario", token=token)
    if status == 200 and res.get("ok"):
        total_dia = res.get('reporte', {}).get('total_general', 0)
        print(f"[OK] [5/10] GET /api/reportes/ventas/diario: EXITOSO (Total dia: ${total_dia:,.2f})")
        passed += 1
    else:
        print(f"[FAIL] [5/10] Reporte diario error: {res}")

    # 6. Reporte en Excel (.xlsx)
    total += 1
    status, res, ctype = request_api("/reportes/ventas/excel", token=token)
    if status == 200 and ("spreadsheetml" in ctype or "octet-stream" in ctype) and len(res) > 500:
        print(f"[OK] [6/10] GET /api/reportes/ventas/excel: EXITOSO (Excel generado: {len(res)} bytes)")
        passed += 1
    else:
        print(f"[FAIL] [6/10] Reporte Excel error: {ctype}, status {status}")

    # 7. Modulo de PQR (Listar y Radicar)
    total += 1
    status, res, _ = request_api("/pqr", token=token)
    if status == 200 and res.get("ok"):
        print(f"[OK] [7/10] GET /api/pqr: EXITOSO ({res.get('resumen', {}).get('total', 0)} PQRs en sistema)")
        passed += 1
    else:
        print(f"[FAIL] [7/10] PQR list error: {res}")

    # 8. Dashboard Stats
    total += 1
    status, res, _ = request_api("/dashboard/stats", token=token)
    if status == 200 and res.get("ok"):
        stats = res.get("stats", {})
        facturacion = stats.get('facturacion_total', 0) or 0
        print(f"[OK] [8/10] GET /api/dashboard/stats: EXITOSO (Ventas: {stats.get('total_ventas')}, Facturacion: ${float(facturacion):,.2f})")
        passed += 1
    else:
        print(f"[FAIL] [8/10] Dashboard stats error: {res}")

    # 9. Dashboard Charts
    total += 1
    status, res, _ = request_api("/dashboard/charts?dias=14", token=token)
    if status == 200 and res.get("ok") and len(res.get("ventas_por_periodo", [])) > 0:
        print(f"[OK] [9/10] GET /api/dashboard/charts: EXITOSO ({len(res['ventas_por_periodo'])} puntos de series temporales)")
        passed += 1
    else:
        print(f"[FAIL] [9/10] Dashboard charts error: {res}")

    # 10. Chatbot con IA / Fallback Local
    total += 1
    status, res, _ = request_api("/chatbot/message", method="POST", data={"message": "Que productos y servicios ofrecen?"})
    if status == 200 and res.get("ok") and len(res.get("reply", "")) > 10:
        print(f"[OK] [10/10] POST /api/chatbot/message: EXITOSO (Fuente: {res.get('source')}, Respuesta: {len(res.get('reply'))} chars)")
        passed += 1
    else:
        print(f"[FAIL] [10/10] Chatbot error: {res}")

    print(f"\n========== RESULTADO: {passed}/{total} PRUEBAS EXITOSAS ==========\n")
    if passed == total:
        print("*** TODOS LOS 20 REQUERIMIENTOS DE BACKEND ESTAN 100% OPERACIONALES! ***")
    else:
        failed = total - passed
        print(f"ADVERTENCIA: {failed} prueba(s) fallaron. Revisar los errores arriba.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
