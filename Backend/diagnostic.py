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

def main():
    print("================================================================")
    print("[DIAGNÓSTICO] Estado del directorio de datos MySQL")
    print("================================================================")

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
            cursor.execute("SHOW VARIABLES LIKE 'datadir';")
            datadir = cursor.fetchone()
            print(f"📁 Directorio de datos (datadir): {datadir[1]}")
            print()

            cursor.execute("SHOW VARIABLES LIKE 'innodb_data_file_path';")
            ibd = cursor.fetchone()
            print(f"   innodb_data_file_path: {ibd[1]}")
            print()

            print("🔍  Estado de la base de datos problemática:")
            cursor.execute("SHOW DATABASES LIKE %s;", (DB_NAME,))
            dbs = cursor.fetchall()
            if dbs:
                print(f"   ✅  {DB_NAME} aparece en SHOW DATABASES")
            else:
                print(f"   ❌  {DB_NAME} NO aparece en SHOW DATABASES")

            print()
            print("📋  Tablas en el diccionario de información:")
            cursor.execute("""
                SELECT TABLE_NAME, ENGINE, TABLE_ROWS
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = %s
                ORDER BY TABLE_NAME;
            """, (DB_NAME,))
            tablas = cursor.fetchall()
            if not tablas:
                print("   (ninguna tabla registrada)")
            else:
                for t in tablas:
                    print(f"   - {t[0]:<25} Engine={t[1] or '?':<10} Filas~{t[2] or 0}")

            print()
            print("🧪  Prueba de acceso a cada tabla (prueba SELECT 1):")
            for t in tablas:
                tname = t[0]
                try:
                    cursor.execute(f"SELECT 1 FROM `{DB_NAME}`.`{tname}` LIMIT 0;")
                    print(f"   ✅  {tname}: accesible")
                except Exception as e:
                    err = str(e)[:80]
                    print(f"   ❌  {tname}: {err}")

        conn.close()

        print()
        print("================================================================")
        print("💡 SOLUCIÓN MANUAL REQUERIDA:")
        print("================================================================")
        print(f"1. DETÉN el servicio MySQL o XAMPP/WAMP")
        print(f"2. Ve a la carpeta: {datadir[1]}")
        print(f"3. ELIMINA la subcarpeta: {DB_NAME}")
        print(f"   (Si Windows no deja, cierra phpMyAdmin / Workbench primero)")
        print(f"4. INICIA de nuevo MySQL")
        print(f"5. Vuelve a ejecutar este script y luego el seed.")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
