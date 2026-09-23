"""
Script de sincronización y datos iniciales para el Quinto Avance
Crea las tablas en MySQL y añade datos de prueba si están vacías.
"""
import sys
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

# Asegurar path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import (
    Usuario, Producto, Servicio,
    Venta, DetalleVenta, Factura, DetalleFactura, PQR,
    ConversacionChatbot, MensajeChatbot
)

def run_migration():
    print("=" * 60)
    print("MIGRACIÓN QUINTO AVANCE - MITIENDA")
    print("Creando tablas en MySQL...")
    print("=" * 60)

    # 1. Crear tablas en MySQL
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas/verificadas exitosamente.")

    db = SessionLocal()
    try:
        # Verificar si ya existen ventas de prueba
        total_ventas = db.query(Venta).count()
        if total_ventas > 0:
            print(f"Ya existen {total_ventas} ventas en la base de datos.")
        else:
            print("Poblando datos de prueba para Ventas, Facturas y PQR...")
            # Obtener usuarios y productos existentes
            admin = db.query(Usuario).filter(Usuario.rol_id == 1).first()
            cliente = db.query(Usuario).filter(Usuario.rol_id == 3).first()
            prods = db.query(Producto).all()
            servs = db.query(Servicio).all()

            cliente_id = cliente.id if cliente else None
            cliente_nombre = f"{cliente.nombre} {cliente.apellido}" if cliente else "Carlos Gómez"
            cliente_email = cliente.email if cliente else "cliente@mitienda.com"
            cliente_tel = cliente.telefono if cliente else "3109876543"
            cliente_doc = cliente.numero_documento if cliente else "1020304050"

            now = datetime.now(timezone.utc)

            # Crear ventas históricas en los últimos 7 días
            ventas_mock = [
                {
                    "dias_atras": 6,
                    "num": "VTA-2026-0001",
                    "items": [
                        ("producto", prods[0].id if prods else 1, prods[0].nombre if prods else "Laptop Pro", Decimal("3500000"), 1),
                    ],
                    "metodo": "tarjeta_credito",
                },
                {
                    "dias_atras": 5,
                    "num": "VTA-2026-0002",
                    "items": [
                        ("producto", prods[1].id if len(prods) > 1 else 2, prods[1].nombre if len(prods) > 1 else "Mouse Inalámbrico", Decimal("85000"), 2),
                        ("servicio", servs[0].id if servs else 1, servs[0].nombre if servs else "Mantenimiento Preventivo", Decimal("120000"), 1),
                    ],
                    "metodo": "efectivo",
                },
                {
                    "dias_atras": 4,
                    "num": "VTA-2026-0003",
                    "items": [
                        ("producto", prods[2].id if len(prods) > 2 else 3, prods[2].nombre if len(prods) > 2 else "Teclado Mecánico RGB", Decimal("220000"), 1),
                    ],
                    "metodo": "nequi_daviplata",
                },
                {
                    "dias_atras": 3,
                    "num": "VTA-2026-0004",
                    "items": [
                        ("servicio", servs[1].id if len(servs) > 1 else 2, servs[1].nombre if len(servs) > 1 else "Instalación de Redes", Decimal("180000"), 1),
                    ],
                    "metodo": "transferencia",
                },
                {
                    "dias_atras": 2,
                    "num": "VTA-2026-0005",
                    "items": [
                        ("producto", prods[0].id if prods else 1, prods[0].nombre if prods else "Laptop Pro", Decimal("3500000"), 1),
                        ("producto", prods[1].id if len(prods) > 1 else 2, prods[1].nombre if len(prods) > 1 else "Mouse Inalámbrico", Decimal("85000"), 1),
                    ],
                    "metodo": "tarjeta_debito",
                },
                {
                    "dias_atras": 1,
                    "num": "VTA-2026-0006",
                    "items": [
                        ("producto", prods[2].id if len(prods) > 2 else 3, prods[2].nombre if len(prods) > 2 else "Teclado Mecánico RGB", Decimal("220000"), 2),
                    ],
                    "metodo": "efectivo",
                },
                {
                    "dias_atras": 0,
                    "num": "VTA-2026-0007",
                    "items": [
                        ("producto", prods[0].id if prods else 1, prods[0].nombre if prods else "Laptop Pro", Decimal("3500000"), 1),
                        ("servicio", servs[0].id if servs else 1, servs[0].nombre if servs else "Mantenimiento Preventivo", Decimal("120000"), 1),
                    ],
                    "metodo": "tarjeta_credito",
                },
            ]

            contador_fac = 1
            for v_data in ventas_mock:
                fecha_v = now - timedelta(days=v_data["dias_atras"])
                subtotal = sum(item[3] * item[4] for item in v_data["items"])
                impuestos = (subtotal * Decimal("0.19")).quantize(Decimal("0.01"))
                total = subtotal + impuestos

                nueva_venta = Venta(
                    numero_venta=v_data["num"],
                    cliente_id=cliente_id,
                    usuario_id=admin.id if admin else None,
                    cliente_nombre=cliente_nombre,
                    cliente_documento=cliente_doc,
                    cliente_email=cliente_email,
                    cliente_telefono=cliente_tel,
                    direccion_entrega="Calle 100 # 15-20, Apto 402",
                    ciudad="Bogotá",
                    metodo_pago=v_data["metodo"],
                    subtotal=subtotal,
                    descuento=Decimal("0.00"),
                    impuestos=impuestos,
                    total=total,
                    estado="completada",
                    notas="Venta registrada en sistema",
                    fecha_venta=fecha_v,
                    created_at=fecha_v,
                    updated_at=fecha_v,
                )
                db.add(nueva_venta)
                db.flush()

                # Crear detalles de la venta
                for it in v_data["items"]:
                    tipo, prod_id, nombre_it, prec, cant = it
                    det = DetalleVenta(
                        venta_id=nueva_venta.id,
                        tipo_item=tipo,
                        producto_id=prod_id if tipo == "producto" else None,
                        servicio_id=prod_id if tipo == "servicio" else None,
                        nombre_item=nombre_it,
                        precio_unitario=prec,
                        cantidad=cant,
                        descuento=Decimal("0.00"),
                        subtotal=prec * cant,
                    )
                    db.add(det)

                # Generar Factura correspondiente
                num_fac = f"FAC-2026-{contador_fac:04d}"
                contador_fac += 1

                factura = Factura(
                    numero_factura=num_fac,
                    venta_id=nueva_venta.id,
                    cliente_id=cliente_id,
                    cliente_nombre=cliente_nombre,
                    cliente_documento=cliente_doc,
                    cliente_email=cliente_email,
                    cliente_telefono=cliente_tel,
                    cliente_direccion="Calle 100 # 15-20, Apto 402",
                    ciudad="Bogotá",
                    subtotal=subtotal,
                    impuestos=impuestos,
                    descuento=Decimal("0.00"),
                    total=total,
                    metodo_pago=v_data["metodo"],
                    estado="pagada",
                    fecha_emision=fecha_v,
                    created_at=fecha_v,
                    updated_at=fecha_v,
                )
                db.add(factura)
                db.flush()

                for it in v_data["items"]:
                    tipo, _, nombre_it, prec, cant = it
                    det_fac = DetalleFactura(
                        factura_id=factura.id,
                        tipo_item=tipo,
                        nombre_item=nombre_it,
                        precio_unitario=prec,
                        cantidad=cant,
                        subtotal=prec * cant,
                    )
                    db.add(det_fac)

            print(f"-> Creadas {len(ventas_mock)} ventas con sus facturas asociadas.")

            # Crear PQRs de prueba
            pqrs_mock = [
                {
                    "num": "PQR-2026-0001",
                    "tipo": "peticion",
                    "asunto": "Solicitud de catálogo corporativo",
                    "desc": "Buenas tardes, requiero cotización por mayor de 15 laptops para mi empresa.",
                    "estado": "respondida",
                    "resp": "Cordial saludo. Enviamos la cotización y lista de precios al correo registrado.",
                },
                {
                    "num": "PQR-2026-0002",
                    "tipo": "queja",
                    "asunto": "Retraso en entrega de pedido",
                    "desc": "El pedido fue solicitado hace dos días y aún no llega a mi domicilio.",
                    "estado": "en proceso",
                    "resp": "Estamos coordinando con la transportadora local para agilizar la entrega hoy mismo.",
                },
                {
                    "num": "PQR-2026-0003",
                    "tipo": "reclamo",
                    "asunto": "Producto con empaque golpeado",
                    "desc": "Recibí la caja del teclado con un golpe en la esquina, aunque el teclado funciona bien.",
                    "estado": "pendiente",
                    "resp": None,
                },
                {
                    "num": "PQR-2026-0004",
                    "tipo": "sugerencia",
                    "asunto": "Incluir más métodos de pago digitales",
                    "desc": "Sería excelente poder pagar con Apple Pay o Google Pay en el checkout.",
                    "estado": "cerrada",
                    "resp": "Muchas gracias por tu sugerencia, la tendremos en cuenta para la próxima versión.",
                },
            ]

            for p_mock in pqrs_mock:
                pqr_obj = PQR(
                    numero_radicado=p_mock["num"],
                    usuario_id=cliente_id,
                    cliente_nombre=cliente_nombre,
                    cliente_email=cliente_email,
                    cliente_telefono=cliente_tel,
                    tipo=p_mock["tipo"],
                    asunto=p_mock["asunto"],
                    descripcion=p_mock["desc"],
                    estado=p_mock["estado"],
                    prioridad="media",
                    respuesta=p_mock["resp"],
                    respondido_por_id=admin.id if (admin and p_mock["resp"]) else None,
                    fecha_radicado=now - timedelta(days=2),
                    fecha_respuesta=now if p_mock["resp"] else None,
                )
                db.add(pqr_obj)

            print(f"-> Creadas {len(pqrs_mock)} PQRs de prueba con diferentes estados.")

            db.commit()
            print("Datos de prueba guardados exitosamente.")

    except Exception as err:
        db.rollback()
        print(f"Error en la migración: {err}")
        raise err
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
