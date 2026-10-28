"""
📚 Livraria API — CRUD de Livros e Autores
FastAPI REST backend com SQLite.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional

from database import get_db, init_db
from models import (
    AutorCreate, AutorUpdate, AutorResponse,
    LivroCreate, LivroUpdate, LivroResponse,
)

# ── Inicialização ────────────────────────────────────────────────────────
app = FastAPI(
    title="📚 Livraria API",
    description="API RESTful para gerenciamento de livros e autores.",
    version="1.0.0",
)

STATIC_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
def startup():
    init_db()


# ── Frontend ─────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(STATIC_DIR / "index.html")


# ═══════════════════════════════════════════════════════════════════════════
#  AUTORES
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/autores", response_model=list[AutorResponse], tags=["Autores"])
def listar_autores():
    """Retorna todos os autores cadastrados."""
    with get_db() as conn:
        rows = conn.execute("SELECT id, nome, nacionalidade FROM autores ORDER BY nome").fetchall()
    return [dict(r) for r in rows]


@app.get("/api/autores/{autor_id}", response_model=AutorResponse, tags=["Autores"])
def buscar_autor(autor_id: int):
    """Busca um autor pelo ID."""
    with get_db() as conn:
        row = conn.execute("SELECT id, nome, nacionalidade FROM autores WHERE id = ?", (autor_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Autor não encontrado.")
    return dict(row)


@app.post("/api/autores", response_model=AutorResponse, status_code=201, tags=["Autores"])
def criar_autor(autor: AutorCreate):
    """Cadastra um novo autor."""
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO autores (nome, nacionalidade) VALUES (?, ?)",
            (autor.nome, autor.nacionalidade),
        )
        return {**autor.model_dump(), "id": cur.lastrowid}


@app.put("/api/autores/{autor_id}", response_model=AutorResponse, tags=["Autores"])
def atualizar_autor(autor_id: int, autor: AutorUpdate):
    """Atualiza os dados de um autor."""
    campos = {k: v for k, v in autor.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    sets = ", ".join(f"{k} = ?" for k in campos)
    values = list(campos.values()) + [autor_id]

    with get_db() as conn:
        cur = conn.execute(f"UPDATE autores SET {sets} WHERE id = ?", values)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Autor não encontrado.")
        row = conn.execute("SELECT id, nome, nacionalidade FROM autores WHERE id = ?", (autor_id,)).fetchone()
    return dict(row)


@app.delete("/api/autores/{autor_id}", status_code=204, tags=["Autores"])
def deletar_autor(autor_id: int):
    """Remove um autor (somente se não possuir livros vinculados)."""
    with get_db() as conn:
        livros = conn.execute("SELECT COUNT(*) FROM livros WHERE autor_id = ?", (autor_id,)).fetchone()[0]
        if livros:
            raise HTTPException(status_code=409, detail="Autor possui livros vinculados. Remova os livros primeiro.")
        cur = conn.execute("DELETE FROM autores WHERE id = ?", (autor_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Autor não encontrado.")


# ═══════════════════════════════════════════════════════════════════════════
#  LIVROS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/livros", response_model=list[LivroResponse], tags=["Livros"])
def listar_livros(
    busca: Optional[str] = Query(None, description="Filtra por título ou autor"),
    ordenar: Optional[str] = Query("titulo", description="Campo de ordenação"),
):
    """Lista todos os livros com nome do autor. Suporta busca e ordenação."""
    query = """
        SELECT l.id, l.titulo, l.autor_id, a.nome AS autor_nome,
               l.ano_publicacao, l.preco, l.estoque
        FROM livros l
        JOIN autores a ON a.id = l.autor_id
    """
    params: list = []
    if busca:
        query += " WHERE l.titulo LIKE ? OR a.nome LIKE ?"
        params += [f"%{busca}%", f"%{busca}%"]

    order_map = {
        "titulo": "l.titulo",
        "autor": "a.nome",
        "preco": "l.preco",
        "ano": "l.ano_publicacao",
        "estoque": "l.estoque",
    }
    order_col = order_map.get(ordenar, "l.titulo")
    query += f" ORDER BY {order_col}"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/livros/{livro_id}", response_model=LivroResponse, tags=["Livros"])
def buscar_livro(livro_id: int):
    """Busca um livro pelo ID."""
    with get_db() as conn:
        row = conn.execute("""
            SELECT l.id, l.titulo, l.autor_id, a.nome AS autor_nome,
                   l.ano_publicacao, l.preco, l.estoque
            FROM livros l
            JOIN autores a ON a.id = l.autor_id
            WHERE l.id = ?
        """, (livro_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Livro não encontrado.")
    return dict(row)


@app.post("/api/livros", response_model=LivroResponse, status_code=201, tags=["Livros"])
def criar_livro(livro: LivroCreate):
    """Cadastra um novo livro."""
    with get_db() as conn:
        # Verifica se o autor existe
        autor = conn.execute("SELECT nome FROM autores WHERE id = ?", (livro.autor_id,)).fetchone()
        if not autor:
            raise HTTPException(status_code=404, detail="Autor não encontrado.")
        cur = conn.execute(
            "INSERT INTO livros (titulo, autor_id, ano_publicacao, preco, estoque) VALUES (?, ?, ?, ?, ?)",
            (livro.titulo, livro.autor_id, livro.ano_publicacao, livro.preco, livro.estoque),
        )
        return {**livro.model_dump(), "id": cur.lastrowid, "autor_nome": autor["nome"]}


@app.put("/api/livros/{livro_id}", response_model=LivroResponse, tags=["Livros"])
def atualizar_livro(livro_id: int, livro: LivroUpdate):
    """Atualiza os dados de um livro."""
    campos = {k: v for k, v in livro.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    if "autor_id" in campos:
        with get_db() as conn:
            autor = conn.execute("SELECT id FROM autores WHERE id = ?", (campos["autor_id"],)).fetchone()
        if not autor:
            raise HTTPException(status_code=404, detail="Autor não encontrado.")

    sets = ", ".join(f"{k} = ?" for k in campos)
    values = list(campos.values()) + [livro_id]

    with get_db() as conn:
        cur = conn.execute(f"UPDATE livros SET {sets} WHERE id = ?", values)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Livro não encontrado.")
        row = conn.execute("""
            SELECT l.id, l.titulo, l.autor_id, a.nome AS autor_nome,
                   l.ano_publicacao, l.preco, l.estoque
            FROM livros l JOIN autores a ON a.id = l.autor_id
            WHERE l.id = ?
        """, (livro_id,)).fetchone()
    return dict(row)


@app.delete("/api/livros/{livro_id}", status_code=204, tags=["Livros"])
def deletar_livro(livro_id: int):
    """Remove um livro pelo ID."""
    with get_db() as conn:
        cur = conn.execute("DELETE FROM livros WHERE id = ?", (livro_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Livro não encontrado.")


# ═══════════════════════════════════════════════════════════════════════════
#  ESTATÍSTICAS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/stats", tags=["Dashboard"])
def estatisticas():
    """Retorna estatísticas gerais da livraria."""
    with get_db() as conn:
        total_livros = conn.execute("SELECT COUNT(*) FROM livros").fetchone()[0]
        total_autores = conn.execute("SELECT COUNT(*) FROM autores").fetchone()[0]
        valor_total = conn.execute("SELECT COALESCE(SUM(preco * estoque), 0) FROM livros").fetchone()[0]
        total_estoque = conn.execute("SELECT COALESCE(SUM(estoque), 0) FROM livros").fetchone()[0]
    return {
        "total_livros": total_livros,
        "total_autores": total_autores,
        "valor_total_estoque": round(valor_total, 2),
        "total_unidades": total_estoque,
    }