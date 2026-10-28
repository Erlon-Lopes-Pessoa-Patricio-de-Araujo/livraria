CREATE TABLE IF NOT EXISTS autores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    nacionalidade TEXT
);

CREATE TABLE IF NOT EXISTS livros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    autor_id INTEGER NOT NULL,
    ano_publicacao INTEGER,
    preco REAL CHECK (preco >= 0),
    estoque INTEGER DEFAULT 0 CHECK (estoque >= 0),
    FOREIGN KEY (autor_id) REFERENCES autores(id)
);