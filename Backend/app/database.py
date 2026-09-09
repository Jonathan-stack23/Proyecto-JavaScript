import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

logger = logging.getLogger("uvicorn.info")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "mitienda_db")

env_db_url = os.getenv("DATABASE_URL")
if env_db_url:
    default_mysql_url = env_db_url
else:
    password_part = f":{DB_PASSWORD}" if DB_PASSWORD else ""
    default_mysql_url = f"mysql+pymysql://{DB_USER}{password_part}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_working_engine():
    try:
        test_engine = create_engine(default_mysql_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"[DB] Conexion exitosa a MySQL: {DB_NAME} en {DB_HOST}:{DB_PORT}")
        return test_engine
    except Exception as ex:
        try:
            password_part = f":{DB_PASSWORD}" if DB_PASSWORD else ""
            server_url = f"mysql+pymysql://{DB_USER}{password_part}@{DB_HOST}:{DB_PORT}"
            server_engine = create_engine(server_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
            with server_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()
            created_engine = create_engine(default_mysql_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
            with created_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"[DB] Base de datos '{DB_NAME}' creada y conectada en MySQL")
            return created_engine
        except Exception:
            pass

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        bd_dir = os.path.join(base_dir, "basedatos")
        os.makedirs(bd_dir, exist_ok=True)
        sqlite_path = os.path.join(bd_dir, "mitienda.db")
        logger.warning(
            f"[DB] Servidor MySQL no disponible en {DB_HOST}:{DB_PORT}. "
            f"Conmutando a base de datos SQLite local: {sqlite_path}"
        )
        return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

engine = get_working_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
