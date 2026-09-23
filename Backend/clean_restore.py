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

def split_sql_script(sql_script):
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
        if '*/' in stripped:
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

    return statements

def main():
    print("================================================================")
    print("[CLEAN RESTORE] BORRADO Y RECREACIÓN COMPLETA DE LA BD")
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
            autocommit=True
        )
        print("[OK] Conectado a MySQL")
        print()

        with conn.cursor() as cursor:
            print("1️⃣  Eliminando base de datos vieja (si existe)...")
            try:
                cursor.execute(f"DROP DATABASE IF EXISTS `{DB_NAME}`;")
                print(f"   [OK] Base de datos `{DB_NAME}` eliminada (o no existía)")
            except Exception as e:
                print(f"   [WARN] al borrar: {e}")

            print()
            print("2️⃣  Creando base de datos nueva...")
            cursor.execute(f"""
                CREATE DATABASE `{DB_NAME}`
                CHARACTER SET utf8mb4
                COLLATE utf8mb4_unicode_ci;
            """)
            print(f"   [OK] Base de datos `{DB_NAME}` creada")

            cursor.execute(f"USE `{DB_NAME}`;")
            print(f"   [OK] Seleccionada `{DB_NAME}`")

        print()
        print("3️⃣  Cargando y ejecutando schema.sql...")
        with open(SQL_SCHEMA_PATH, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        statements = split_sql_script(sql_script)

        conn.autocommit = False
        with conn.cursor() as cursor:
            ok_count = 0
            warn_count = 0
            for stmt in statements:
                try:
                    cursor.execute(stmt)
                    ok_count += 1
                    preview = stmt.replace('\n', ' ')[:65]
                    print(f"  [OK] {preview}...")
                except Exception as e:
                    warn_count += 1
                    preview = stmt.replace('\n', ' ')[:65]
                    print(f"  [WARN] {preview}")
                    print(f"         Razón: {e}")
        conn.commit()
        conn.autocommit = True
        print()
        print(f"   Estadísticas: {ok_count} OK, {warn_count} advertencias")

        print()
        print("4️⃣  Verificando tablas finales...")
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            for t in tables:
                cursor.execute(f"SELECT COUNT(*) FROM `{t[0]}`;")
                cnt = cursor.fetchone()[0]
                print(f"   ✅  {t[0]:<25} ({cnt} filas)")
                # Test engine access
                try:
                    cursor.execute(f"SELECT * FROM `{t[0]}` LIMIT 1;")
                except Exception as e:
                    print(f"       ❌ MOTOR ERROR: {e}")

        print()
        print("================================================================")
        print("[OK] BASE DE DATOS RECREADA Y VERIFICADA EXITOSAMENTE")
        print("================================================================")

        conn.close()
        print()
        print("Ahora ejecuta: python seed.py para poblar usuarios/productos/servicios")

    except Exception as e:
        print(f"\n[ERROR CRÍTICO] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
