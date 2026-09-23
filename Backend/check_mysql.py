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

print("Intentando conectar a MySQL...")
print(f"Host: {DB_HOST}:{DB_PORT}, User: {DB_USER}")
print()

try:
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        charset='utf8mb4',
        connect_timeout=5,
        autocommit=True
    )
    print("[OK] MySQL está corriendo y accesible!")
    print()

    with conn.cursor() as cursor:
        cursor.execute("SHOW DATABASES;")
        dbs = [d[0] for d in cursor.fetchall()]
        print(f"Bases de datos existentes: {', '.join(dbs)}")
        print()

        if DB_NAME in dbs:
            print(f"⚠️  La BD '{DB_NAME}' AÚN EXISTE - puede estar corrupta")
        else:
            print(f"✅  La BD '{DB_NAME}' NO existe (correcto, limpia)")

    conn.close()
    sys.exit(0)

except Exception as e:
    print(f"[NO CONECTA] {e}")
    print()
    print("Posibles causas:")
    print("  - MySQL no está iniciado")
    print("  - Abre XAMPP Control Panel y dale Start a MySQL")
    print("  - Revisa que el puerto sea 3306")
    sys.exit(1)
