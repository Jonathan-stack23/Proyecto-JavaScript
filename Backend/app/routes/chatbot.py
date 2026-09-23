"""
Rutas de Chatbot con Inteligencia Artificial y Fallback Contextual - Quinto Avance
Asistente virtual inteligente para MiTienda con soporte para OpenAI (ChatGPT) y Google Gemini,
y motor de inferencia local contextualizado con el catálogo real, servicios, garantías y estado de PQR.
"""
import os
import re
import json
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Usuario, Producto, Servicio, PQR, ConversacionChatbot, MensajeChatbot
from app.schemas import ChatbotMessageRequest, ChatbotMessageResponse
from app.dependencies import get_optional_current_user

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


def get_store_context(db: Session) -> Dict[str, Any]:
    """Recopila información en tiempo real de la base de datos para alimentar el contexto del bot."""
    productos = db.query(Producto).filter(Producto.estado == "activo").limit(8).all()
    servicios = db.query(Servicio).filter(Servicio.estado == "activo").limit(6).all()

    prods_info = [
        f"• {p.nombre} (Precio: ${float(p.precio):,.0f} COP, Stock: {p.stock})"
        for p in productos
    ]
    servs_info = [
        f"• {s.nombre} (Precio: ${float(s.precio):,.0f} COP, Duración aprox: {s.duracion or '1 hora'})"
        for s in servicios
    ]

    return {
        "productos_resumen": "\n".join(prods_info),
        "servicios_resumen": "\n".join(servs_info),
    }


def call_openai(prompt: str, context_str: str, api_key: str) -> Optional[str]:
    """Llama a la API de OpenAI GPT con fallback seguro."""
    try:
        url = "https://api.openai.com/v1/chat/completions"
        system_instruction = (
            "Eres 'TiendaBot', el asistente virtual inteligente y cordial de 'MiTienda' "
            "(comercio electrónico de productos y servicios tecnológicos en Colombia). "
            "Responde de forma clara, profesional, amable y con formato markdown (negritas, listas, emojis).\n"
            f"Contexto actual de la tienda:\n{context_str}\n"
            "Si te preguntan por PQR, indícales que pueden ingresar su número de radicado (PQR-2026-XXXX) "
            "o radicar una nueva desde la sección de PQR."
        )
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 400,
            "temperature": 0.7,
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[Chatbot] Error invocando OpenAI: {e}")
        return None


def call_gemini(prompt: str, context_str: str, api_key: str) -> Optional[str]:
    """Llama a la API de Google Gemini con fallback seguro."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        system_instruction = (
            "Eres TiendaBot, asistente virtual de MiTienda. Responde de forma cordial, concisa y usando emojis.\n"
            f"Información de la tienda:\n{context_str}"
        )
        full_text = f"{system_instruction}\n\nPregunta del cliente: {prompt}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": full_text}]
                }
            ]
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"[Chatbot] Error invocando Gemini: {e}")
        return None


def generate_local_knowledge_reply(message: str, db: Session) -> tuple[str, List[str]]:
    """
    Motor local de respuestas inteligentes y contextualizadas.
    Garantiza funcionamiento del chatbot al 100% de manera autónoma.
    """
    msg_lower = message.lower().strip()

    # 1. Detección de consulta de PQR por radicado
    match_radicado = re.search(r"pqr-\d{4}-\d{4}", msg_lower, re.IGNORECASE)
    if match_radicado:
        rad_code = match_radicado.group(0).upper()
        pqr = db.query(PQR).filter(PQR.numero_radicado == rad_code).first()
        if pqr:
            estado_emoji = "⏳" if pqr.estado == "pendiente" else ("⚙️" if pqr.estado == "en proceso" else "✅")
            resp_txt = (
                f"📋 **Estado de tu solicitud:** `{pqr.numero_radicado}`\n\n"
                f"• **Tipo:** {pqr.tipo.capitalize()}\n"
                f"• **Asunto:** {pqr.asunto}\n"
                f"• **Estado:** {estado_emoji} **{pqr.estado.upper()}**\n"
                f"• **Fecha Radicación:** {pqr.fecha_radicado.strftime('%Y-%m-%d %H:%M') if pqr.fecha_radicado else 'N/A'}\n"
            )
            if pqr.respuesta:
                resp_txt += f"\n💬 **Respuesta de nuestro equipo:**\n> {pqr.respuesta}\n"
            else:
                resp_txt += "\nTu solicitud se encuentra actualmente en revisión por nuestro equipo técnico y de atención."

            return resp_txt, ["Consultar otra PQR", "Ver productos", "Hablar con asesor"]
        else:
            return (
                f"🔍 No encontré ninguna solicitud con el radicado **{rad_code}**. "
                "Por favor verifica que el código esté escrito correctamente (ej: `PQR-2026-0001`).",
                ["Radicar una PQR", "Ver mis compras", "Menú principal"]
            )

    # 2. Intenciones de Productos / Catálogo
    if any(k in msg_lower for k in ["producto", "catalogo", "catálogo", "comprar", "precio", "computador", "teclado", "mouse", "auricular", "laptop", "oferta"]):
        productos = db.query(Producto).filter(Producto.estado == "activo").limit(5).all()
        if productos:
            lista = "\n".join([
                f"• **{p.nombre}** — `${float(p.precio):,.0f} COP` (Disponibles: {p.stock})"
                for p in productos
            ])
            return (
                f"🛒 **Productos Destacados en MiTienda:**\n\n{lista}\n\n"
                "Puedes agregarlos directamente a tu carrito de compras desde el catálogo principal.",
                ["Ver catálogo completo", "Servicios técnicos", "Medios de pago", "Radicar PQR"]
            )

    # 3. Intenciones de Servicios Técnicos / Mantenimiento
    if any(k in msg_lower for k in ["servicio", "mantenimiento", "reparacion", "reparación", "instalacion", "instalación", "soporte", "tecnico", "técnico"]):
        servicios = db.query(Servicio).filter(Servicio.estado == "activo").limit(5).all()
        if servicios:
            lista = "\n".join([
                f"• **{s.nombre}** — `${float(s.precio):,.0f} COP` (Aprox. {s.duracion or '1 hora'})"
                for s in servicios
            ])
            return (
                f"🛠️ **Servicios Especializados Disponibles:**\n\n{lista}\n\n"
                "Nuestros expertos garantizan calidad y respaldo en cada procedimiento.",
                ["Solicitar servicio", "Ver productos", "Garantías y soporte", "Menú principal"]
            )

    # 4. Intenciones de PQR (Petición, Queja, Reclamo, Sugerencia)
    if any(k in msg_lower for k in ["pqr", "queja", "reclamo", "peticion", "petición", "sugerencia", "radicar"]):
        return (
            "📝 **Módulo de Atención y PQR:**\n\n"
            "En MiTienda estamos comprometidos con tu satisfacción. Puedes:\n"
            "1. **Radicar una nueva PQR:** Ve a la sección *Atención PQR* en el menú o tu panel de cliente.\n"
            "2. **Consultar estado:** Escríbeme tu número de radicado directamente (ej: `PQR-2026-0001`).\n\n"
            "Todas las solicitudes reciben respuesta formal en un plazo máximo de 24 a 48 horas hábiles.",
            ["Radicar PQR", "Consultar PQR-2026-0001", "Ver servicios", "Contacto directo"]
        )

    # 5. Métodos de Pago y Facturación
    if any(k in msg_lower for k in ["pago", "pagar", "factura", "tarjeta", "efectivo", "transferencia", "nequi", "daviplata", "iva"]):
        return (
            "💳 **Medios de Pago y Facturación:**\n\n"
            "Aceptamos las siguientes opciones seguras de pago:\n"
            "• **Tarjetas de Crédito / Débito:** Visa, Mastercard, American Express.\n"
            "• **Transferencias Digitales:** Nequi, Daviplata y PSE.\n"
            "• **Pago contra entrega / Efectivo en punto físico.**\n\n"
            "🧾 **Facturación:** Todas tus compras generan automáticamente factura legal con IVA desglosado y consecutivo `FAC-2026-XXXX`, descargable en PDF desde tu panel de cliente.",
            ["Ver mis facturas", "Ver productos", "Horarios de atención"]
        )

    # 6. Envíos, Despachos y Cobertura
    if any(k in msg_lower for k in ["envio", "envío", "despacho", "domicilio", "entrega", "ciudad", "ciudades"]):
        return (
            "🚚 **Envíos y Despachos:**\n\n"
            "• **Cobertura:** Despachos a nivel nacional en toda Colombia (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, etc.).\n"
            "• **Tiempos de entrega:** De 1 a 3 días hábiles en ciudades principales.\n"
            "• **Seguimiento:** Recibirás una notificación y el número de guía tras confirmar tu compra.",
            ["Comprar productos", "Medios de pago", "Horario de atención"]
        )

    # 7. Saludos y Bienvenida
    if any(k in msg_lower for k in ["hola", "buenos dias", "buenas tardes", "buenas noches", "saludos", "hi", "hey", "inicio"]):
        return (
            "👋 ¡Hola! Bienvenido a **MiTienda**.\n\n"
            "Soy **TiendaBot**, tu asistente virtual impulsado con IA. ¿En qué te puedo colaborar hoy?\n\n"
            "• Consultar nuestro catálogo de productos y precios\n"
            "• Conocer nuestros servicios técnicos\n"
            "• Radicar o consultar una PQR\n"
            "• Información de pagos, envíos y facturación",
            ["Ver productos", "Servicios técnicos", "Consultar PQR", "Medios de pago"]
        )

    # 8. Horarios y Contacto
    if any(k in msg_lower for k in ["contacto", "telefono", "teléfono", "horario", "ubicacion", "ubicación", "donde estan", "dónde están", "direccion", "dirección"]):
        return (
            "🏢 **Información de Contacto y Horarios:**\n\n"
            "• **Horario de Atención:** Lunes a Sábado de 8:00 AM a 6:00 PM\n"
            "• **Línea Telefónica / WhatsApp:** +57 (300) 123-4567\n"
            "• **Correo Institucional:** soporte@mitienda.com\n"
            "• **Sede:** Bogotá D.C., Colombia",
            ["Ver catálogo", "Radicar PQR", "Servicios disponibles"]
        )

    # 9. Respuesta por defecto con orientación
    return (
        f"Entendido. He registrado tu consulta sobre *\"{message[:50]}\"*.\n\n"
        "Puedo ayudarte con información sobre nuestro catálogo de productos, cotización de servicios técnicos, "
        "seguimiento a radicados de PQR (`PQR-2026-XXXX`) o detalles de envíos y facturación.\n\n"
        "¿Cuál de estos temas te gustaría revisar?",
        ["Ver productos", "Servicios técnicos", "Consultar PQR", "Métodos de pago"]
    )


@router.post("/message", response_model=ChatbotMessageResponse)
def procesar_mensaje_chatbot(
    payload: ChatbotMessageRequest,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Procesa un mensaje enviado al Chatbot.
    Conecta con OpenAI o Google Gemini si las API Keys están configuradas en el entorno;
    de lo contrario, recurre al motor contextual local de alta fidelidad.
    Guarda el historial de la conversación si se provee session_id.
    """
    user_msg = payload.message.strip()
    session_id = payload.session_id or f"sess_{int(datetime.now().timestamp())}"
    source = "local_knowledge"
    reply_text = ""
    suggestions = []

    # Obtener contexto dinámico de la tienda
    context_data = get_store_context(db)
    context_str = f"Productos disponibles:\n{context_data['productos_resumen']}\n\nServicios:\n{context_data['servicios_resumen']}"

    # 1. Intentar proveedor IA si existe clave en variables de entorno
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if openai_key and openai_key.startswith("sk-"):
        ai_reply = call_openai(user_msg, context_str, openai_key)
        if ai_reply:
            reply_text = ai_reply
            source = "ai_openai"
            suggestions = ["Ver productos", "Servicios técnicos", "Radicar PQR"]

    elif gemini_key and len(gemini_key) > 10:
        ai_reply = call_gemini(user_msg, context_str, gemini_key)
        if ai_reply:
            reply_text = ai_reply
            source = "ai_gemini"
            suggestions = ["Ver productos", "Servicios técnicos", "Radicar PQR"]

    # 2. Si no hay IA externa o falló, usar el motor de conocimiento local
    if not reply_text:
        reply_text, suggestions = generate_local_knowledge_reply(user_msg, db)
        source = "local_knowledge"

    # 3. Almacenar conversación y mensaje en base de datos si la tabla está disponible
    try:
        conversacion = db.query(ConversacionChatbot).filter(ConversacionChatbot.session_id == session_id).first()
        if not conversacion:
            usuario_id = current_user.id if current_user else None
            conversacion = ConversacionChatbot(session_id=session_id, usuario_id=usuario_id)
            db.add(conversacion)
            db.flush()

        # Guardar mensaje de usuario y respuesta del bot usando los campos reales del modelo
        msg_user = MensajeChatbot(
            conversacion_id=conversacion.id,
            rol="usuario",
            contenido=user_msg,
        )
        msg_bot = MensajeChatbot(
            conversacion_id=conversacion.id,
            rol="asistente",
            contenido=reply_text,
        )
        db.add_all([msg_user, msg_bot])
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Chatbot] Nota: No se pudo registrar sesión de chat ({e})")

    return ChatbotMessageResponse(
        ok=True,
        session_id=session_id,
        reply=reply_text,
        source=source,
        suggestions=suggestions,
    )
