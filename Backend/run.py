import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")

if __name__ == "__main__":
    print("================================================================")
    print("[SERVER] INICIANDO SERVIDOR BACKEND FASTAPI - MITIENDA")
    print("Autor: Jonathan Martinez - SENA Ficha 3406204")
    print(f"Servidor disponible en: http://{HOST}:{PORT}")
    print(f"Documentacion Swagger UI: http://{HOST}:{PORT}/docs")
    print(f"Documentacion ReDoc:      http://{HOST}:{PORT}/redoc")
    print("================================================================\n")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
