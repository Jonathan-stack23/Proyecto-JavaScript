import sys
import os

# Asegurar que el directorio de la aplicación esté en el PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.database import engine, SessionLocal, Base
from app.models import Rol, Permiso, Usuario, Producto, Servicio
from app.security import hash_password

def run_seed():
    print("================================================================")
    print("[SEED] INICIALIZANDO Y POBLANDO BASE DE DATOS - FASTAPI MITIENDA")
    print("Autor: Jonathan Martinez - SENA Ficha 3406204")
    print("================================================================\n")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Crear Roles si no existen
        print("1️⃣ Verificando Roles...")
        roles_data = [
            (1, "Administrador", "Acceso total al sistema"),
            (2, "Empleado", "Gestión de productos y servicios"),
            (3, "Cliente", "Compra y consulta de productos"),
        ]
        for rid, nombre, desc in roles_data:
            rol = db.query(Rol).filter(Rol.id == rid).first()
            if not rol:
                rol = Rol(id=rid, nombre=nombre, descripcion=desc)
                db.add(rol)
                print(f"   [+] Rol creado: {nombre}")
            else:
                rol.nombre = nombre
                rol.descripcion = desc
        db.commit()

        # 2. Crear Permisos básicos
        print("\n2️⃣ Verificando Permisos...")
        permisos_data = [
            (1, "ver_usuarios", "Ver listado de usuarios"),
            (2, "crear_usuarios", "Crear nuevos usuarios"),
            (3, "editar_usuarios", "Editar usuarios"),
            (4, "eliminar_usuarios", "Eliminar o desactivar usuarios"),
            (5, "ver_productos", "Ver productos"),
            (6, "crear_productos", "Crear productos"),
            (7, "editar_productos", "Editar productos"),
            (8, "eliminar_productos", "Eliminar productos"),
            (9, "ver_servicios", "Ver servicios"),
            (10, "crear_servicios", "Crear servicios"),
            (11, "editar_servicios", "Editar servicios"),
            (12, "eliminar_servicios", "Eliminar servicios"),
            (13, "ver_panel_admin", "Acceso al panel de admin"),
            (14, "ver_panel_empleado", "Acceso al panel de empleado"),
            (15, "ver_panel_cliente", "Acceso al panel de cliente"),
        ]
        for pid, nombre, desc in permisos_data:
            perm = db.query(Permiso).filter(Permiso.id == pid).first()
            if not perm:
                perm = Permiso(id=pid, nombre=nombre, descripcion=desc)
                db.add(perm)
        db.commit()

        # 3. Crear Usuarios Base (Admin y Empleado Principal)
        print("\n3️⃣ Verificando Usuarios Iniciales...")
        admin = db.query(Usuario).filter(Usuario.email == "admin@mitienda.com").first()
        if not admin:
            admin = Usuario(
                nombre="Administrador",
                apellido="MiTienda",
                tipo_documento="CC",
                numero_documento="1000000001",
                direccion="Sede Principal",
                telefono="3000000001",
                email="admin@mitienda.com",
                password=hash_password("Admin1234"),
                rol_id=1,
                estado="activo",
            )
            db.add(admin)
            print("   [+] Administrador creado: admin@mitienda.com (Pass: Admin1234)")
        else:
            admin.password = hash_password("Admin1234")
            admin.estado = "activo"
            admin.rol_id = 1
            print("   [~] Administrador actualizado: admin@mitienda.com (Pass: Admin1234)")

        empleado = db.query(Usuario).filter(Usuario.email == "empleado@mitienda.com").first()
        if not empleado:
            empleado = Usuario(
                nombre="Empleado",
                apellido="MiTienda",
                tipo_documento="CC",
                numero_documento="1000000002",
                direccion="Sede Principal",
                telefono="3000000002",
                email="empleado@mitienda.com",
                password=hash_password("Empleado1234"),
                rol_id=2,
                estado="activo",
            )
            db.add(empleado)
            print("   [+] Empleado creado: empleado@mitienda.com (Pass: Empleado1234)")
        else:
            empleado.password = hash_password("Empleado1234")
            empleado.estado = "activo"
            empleado.rol_id = 2
            print("   [~] Empleado actualizado: empleado@mitienda.com (Pass: Empleado1234)")

        # 4. Empleados de Servicio
        empleados_servicios = [
            ("Carlos", "Gómez", "1000000010", "carlos.g@mitienda.com", "Calle 45 #12-34", "3001110001"),
            ("Laura", "Ramírez", "1000000020", "laura.r@mitienda.com", "Carrera 10 #20-40", "3001110002"),
            ("Andrés", "Torres", "1000000030", "andres.t@mitienda.com", "Avenida 5 #8-15", "3001110003"),
            ("Sofía", "Hernández", "1000000040", "sofia.h@mitienda.com", "Calle 20 #5-60", "3001110004"),
        ]
        emp_ids = []
        for nom, ape, doc, mail, dirr, tel in empleados_servicios:
            e_usr = db.query(Usuario).filter(Usuario.email == mail).first()
            if not e_usr:
                e_usr = Usuario(
                    nombre=nom,
                    apellido=ape,
                    tipo_documento="CC",
                    numero_documento=doc,
                    direccion=dirr,
                    telefono=tel,
                    email=mail,
                    password=hash_password("Empleado1234"),
                    rol_id=2,
                    estado="activo",
                )
                db.add(e_usr)
                db.commit()
                db.refresh(e_usr)
                print(f"   [+] Empleado especializado: {mail}")
            emp_ids.append(e_usr.id)
        db.commit()

        # 5. Productos Demo
        print("\n4️⃣ Verificando Productos Iniciales...")
        prods_data = [
            (1, "Laptop HP Pavilion", "Laptop HP Pavilion 15\" 8GB RAM 256GB SSD", 3599000.0, 15, "Computadores", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80"),
            (2, "Smartphone Samsung", "Samsung Galaxy A54 128GB 6GB RAM", 1899000.0, 25, "Celulares", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"),
            (3, "Auriculares Inalámbricos", "Auriculares Bluetooth Noise Cancelling", 299000.0, 50, "Accesorios", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"),
            (4, "Monitor LG 27\"", "Monitor LG 27 pulgadas Full HD IPS", 899000.0, 20, "Monitores", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"),
            (5, "Teclado Mecánico", "Teclado mecánico RGB gamer", 459000.0, 30, "Accesorios", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"),
            (6, "Mouse Gamer", "Mouse gamer RGB 16000 DPI", 249000.0, 40, "Accesorios", "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"),
        ]
        for pid, nom, desc, pre, stk, cat, img in prods_data:
            p = db.query(Producto).filter(Producto.id == pid).first()
            if not p:
                p = Producto(
                    id=pid,
                    nombre=nom,
                    descripcion=desc,
                    precio=pre,
                    stock=stk,
                    categoria=cat,
                    imagen_url=img,
                    estado="activo",
                    usuario_id=admin.id if admin else None,
                )
                db.add(p)
                print(f"   [+] Producto creado: {nom}")
        db.commit()

        # 6. Servicios Demo
        print("\n5️⃣ Verificando Servicios Iniciales...")
        servs_data = [
            (1, "Mantenimiento de PC", "Limpieza y optimización integral de computadores", 80000.0, "2 horas", "Mantenimiento", "https://images.unsplash.com/photo-1587202372722-05829e788842?auto=format&fit=crop&w=800&q=80", emp_ids[0] if len(emp_ids) > 0 else None),
            (2, "Instalación de Software", "Instalación y configuración de suites y sistemas operativos", 50000.0, "1 hora", "Soporte", "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&w=800&q=80", emp_ids[1] if len(emp_ids) > 1 else None),
            (3, "Reparación de Celulares", "Diagnóstico, cambio de repuestos y reparación técnica", 100000.0, "3 días", "Reparación", "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80", emp_ids[2] if len(emp_ids) > 2 else None),
            (4, "Asesoría Técnica", "Asesoría personalizada para optimización tecnológica", 60000.0, "1 hora", "Consultoría", "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80", emp_ids[3] if len(emp_ids) > 3 else None),
        ]
        for sid, nom, desc, pre, dur, cat, img, u_id in servs_data:
            s = db.query(Servicio).filter(Servicio.id == sid).first()
            if not s:
                s = Servicio(
                    id=sid,
                    nombre=nom,
                    descripcion=desc,
                    precio=pre,
                    duracion=dur,
                    categoria=cat,
                    imagen_url=img,
                    estado="activo",
                    usuario_id=u_id,
                )
                db.add(s)
                print(f"   [+] Servicio creado: {nom}")
        db.commit()

        print("\n[OK] Poblacion de datos finalizada exitosamente.")
        print("----------------------------------------------------------------")
        print("Credenciales para pruebas:")
        print("  - Administrador : admin@mitienda.com    / Admin1234")
        print("  - Empleado      : empleado@mitienda.com / Empleado1234")
        print("----------------------------------------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error durante el seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
