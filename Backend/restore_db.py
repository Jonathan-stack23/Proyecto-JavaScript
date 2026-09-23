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

SQL_SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'basedatos', 'schema.sql')

def execute_sql_from_file(conn, filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        sql_script = f.read()

    statements = []
    current = []
    in_comment = False

    for line in sql_script.splitlines():
        stripped = line.strip()
        if stripped.startswith('--') or stripped.startswith('#'):
            continue
        if stripped.startswith('/*'):
            in_comment = True
            continue
        if stripped.endswith('*/'):
            in_comment = False
            continue
        if in_comment:
            continue
        if stripped:
            current.append(line)
            if stripped.endswith(';'):
                stmt = '\n'.join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []

    with conn.cursor() as cursor:
        for stmt in statements:
            try:
                cursor.execute(stmt)
                print(f"  [OK] {stmt[:60]}...")
            except Exception as e:
                stmt_preview = stmt[:80]
                print(f"  [WARN] {stmt_preview} -> {e}")
    conn.commit()

def main():
    print("================================================================")
    print("[RESTORE] RECREANDO BASE DE DATOS MITIENDA_DB")
    print("================================================================")
    print(f"Host: {DB_HOST}:{DB_PORT}")
    print(f"Usuario: {DB_USER}")
    print(f"Base de datos: {DB_NAME}")
    print()

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4',
            autocommit=False
        )
        print("[OK] Conexión a MySQL exitosa (sin base de datos)")
        print()

        print("1️⃣  Ejecutando schema.sql (crea BD y tablas)...")
        execute_sql_from_file(conn, SQL_SCHEMA_PATH)
        print()

        conn.select_db(DB_NAME)
        print("[OK] Base de datos seleccionada:", DB_NAME)
        print()

        print("2️⃣  Verificando tablas creadas...")
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            for t in tables:
                print(f"   ✅  {t[0]}")
        print()

        conn.close()
        print("[OK] RESTAURACIÓN DE ESQUEMA COMPLETADA EXITOSAMENTE.")
        print()
        print("Ahora ejecuta: python seed.py para poblar los datos iniciales.")

    except Exception as e:
        print(f"\n[ERROR] Falla en restauración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
