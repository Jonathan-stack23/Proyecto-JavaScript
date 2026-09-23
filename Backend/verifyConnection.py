import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from dotenv import load_dotenv
import pymysql

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'mitienda_db')

print("=" * 56)
print("🔌  PRUEBA DE CONEXIÓN: BACKEND FASTAPI + PYTHON")
print("=" * 56)
print()

try:
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER,
        password=DB_PASSWORD, database=DB_NAME,
        charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor
    )
    print("✅  Conexión exitosa a MySQL (pymysql)")
    print()

    with conn.cursor() as cur:
        cur.execute("SELECT NOW() AS fh;")
        print(f"🕒  Fecha/hora: {cur.fetchone()['fh']}")

        cur.execute("SELECT VERSION() AS v;")
        print(f"🗄️  Motor: {cur.fetchone()['v']}")
    print()

    print("📋  Verificación de tablas y datos:")
    checks = [
        'roles', 'permisos', 'rol_permisos', 'usuarios',
        'productos', 'servicios', 'codigos_recuperacion',
        'pedidos', 'pedido_items', 'citas_servicios'
    ]
    with conn.cursor() as cur:
        for t in checks:
            cur.execute(f"SELECT COUNT(*) AS c FROM {t};")
            cnt = cur.fetchone()['c']
            estado = "✅" if cnt > 0 or t in ('codigos_recuperacion', 'pedidos', 'pedido_items', 'citas_servicios') else "⚠️ "
            print(f"   {estado} {t.ljust(22)} {cnt} registros")
    print()

    print("🔐  Admin user:")
    with conn.cursor() as cur:
        cur.execute("SELECT id, email, rol_id, estado FROM usuarios WHERE email='admin@mitienda.com';")
        a = cur.fetchone()
        if a:
            print(f"   ✅  Encontrado -> id={a['id']} rol={a['rol_id']} estado={a['estado']}")
        else:
            print("   ❌  NO ENCONTRADO")
    print()

    print("🔗  Prueba JOIN (servicio -> empleado):")
    with conn.cursor() as cur:
        cur.execute("""
            SELECT s.nombre AS servicio,
                   CONCAT(u.nombre, ' ', u.apellido) AS empleado
            FROM servicios s
            JOIN usuarios u ON u.id = s.usuario_id
            ORDER BY s.id;
        """)
        for r in cur.fetchall():
            print(f"   - {r['servicio'].ljust(26)} -> {r['empleado']}")
    print()

    print("🎉  BACKEND FASTAPI: CONEXIÓN 100% FUNCIONAL")
    print("   (sqlalchemy requiere pip install -r requirements.txt)")
    print("   Puedes arrancar con: python run.py  (puerto 8000)")

    conn.close()

except Exception as e:
    print(f"❌  ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
