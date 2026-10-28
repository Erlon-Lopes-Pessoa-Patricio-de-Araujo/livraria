import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent / "livraria.db"
SQL_DIR = Path(__file__).parent.parent / "database"


def _connect() -> sqlite3.Connection:
    """Cria uma nova conexão com o SQLite e ativa foreign keys."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db():
    """Context-manager que garante commit/rollback e fechamento."""
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Cria as tabelas e insere dados de exemplo se o banco estiver vazio."""
    with get_db() as conn:
        with open(SQL_DIR / "01_schema.sql", encoding="utf-8") as f:
            conn.executescript(f.read())

        total = conn.execute("SELECT COUNT(*) FROM autores").fetchone()[0]
        if total == 0:
            with open(SQL_DIR / "02_data.sql", encoding="utf-8") as f:
                conn.executescript(f.read())