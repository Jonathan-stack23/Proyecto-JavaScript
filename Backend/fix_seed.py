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
    print("[FIX-SEED] INSERTANDO DATOS INICIALES FALTANTES")
    print("================================================================")
    print()

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4',
            autocommit=False
        )
        print("[OK] Conectado a:", DB_NAME)
        print()

        with conn.cursor() as cursor:
            print("1️⃣  Insertando ROLES...")
            cursor.execute("""
                INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
                (1, 'Administrador', 'Acceso total al sistema'),
                (2, 'Empleado',      'Gestión de productos y servicios'),
                (3, 'Cliente',       'Compra y consulta de productos');
            """)
            print(f"   Filas afectadas: {cursor.rowcount}")

            print()
            print("2️⃣  Insertando PERMISOS...")
            cursor.execute("""
                INSERT IGNORE INTO permisos (id, nombre, descripcion) VALUES
                (1,  'ver_usuarios',        'Ver listado de usuarios'),
                (2,  'crear_usuarios',      'Crear nuevos usuarios'),
                (3,  'editar_usuarios',     'Editar usuarios'),
                (4,  'eliminar_usuarios',   'Eliminar o desactivar usuarios'),
                (5,  'ver_productos',       'Ver productos'),
                (6,  'crear_productos',     'Crear productos'),
                (7,  'editar_productos',    'Editar productos'),
                (8,  'eliminar_productos',  'Eliminar productos'),
                (9,  'ver_servicios',       'Ver servicios'),
                (10, 'crear_servicios',     'Crear servicios'),
                (11, 'editar_servicios',    'Editar servicios'),
                (12, 'eliminar_servicios',  'Eliminar servicios'),
                (13, 'ver_panel_admin',     'Acceso al panel de admin'),
                (14, 'ver_panel_empleado',  'Acceso al panel de empleado'),
                (15, 'ver_panel_cliente',   'Acceso al panel de cliente');
            """)
            print(f"   Filas afectadas: {cursor.rowcount}")

            print()
            print("3️⃣  Asignando permisos al ROL ADMINISTRADOR (todos)...")
            cursor.execute("""
                INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
                SELECT 1, id FROM permisos;
            """)
            print(f"   Filas afectadas: {cursor.rowcount}")

            print()
            print("4️⃣  Asignando permisos al ROL EMPLEADO...")
            cursor.execute("""
                INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
                (2, 5), (2, 6), (2, 7), (2, 8),
                (2, 9), (2, 10), (2, 11), (2, 12), (2, 14);
            """)
            print(f"   Filas afectadas: {cursor.rowcount}")

            print()
            print("5️⃣  Asignando permisos al ROL CLIENTE...")
            cursor.execute("""
                INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
                (3, 5), (3, 9), (3, 15);
            """)
            print(f"   Filas afectadas: {cursor.rowcount}")

        conn.commit()
        print()

        print("✅  Datos iniciales insertados correctamente.")
        print()

        print("Verificación final:")
        with conn.cursor() as cursor:
            for tabla in ['roles', 'permisos', 'rol_permisos']:
                cursor.execute(f"SELECT COUNT(*) FROM {tabla}")
                cnt = cursor.fetchone()[0]
                print(f"   {tabla}: {cnt} registros")
        print()

        conn.close()
        print("[OK] FIX-SEED completado. Ahora puedes ejecutar python seed.py")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
