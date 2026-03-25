from contextlib import contextmanager
import psycopg
from app.core.config import get_settings

settings = get_settings()

@contextmanager
def get_db_connection():
    """
    psycopg3 데이터베이스 커넥션을 제공하는 컨텍스트 매니저
    FastAPI 서비스 내부에서 호출하여 사용
    """
    # config.py에서 읽어온 정보를 바탕으로 포스트그레스 DB에 접속
    conn = psycopg.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD
    )
    try:
        yield conn
    finally:
        conn.close()
