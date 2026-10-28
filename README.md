# 📚 Livraria — Sistema de Gerenciamento de Acervo

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

> API RESTful para gerenciamento de livros e autores, com frontend moderno em dark mode, glassmorphism e micro-animações.

---

## ✨ Funcionalidades

- 📊 **Dashboard** com estatísticas em tempo real (total de livros, autores, valor em estoque)
- 📖 **CRUD completo** de Livros (criar, listar, editar, remover)
- ✍️ **CRUD completo** de Autores
- 🔍 **Busca** por título ou nome do autor
- 📱 **Design responsivo** — funciona em desktop e mobile
- 🌙 **Dark mode premium** com glassmorphism e animações suaves
- 📄 **Documentação automática** da API via Swagger UI (`/docs`)

---

## 🛠️ Tecnologias

| Camada     | Tecnologia |
|------------|------------|
| Backend    | Python 3.10+, FastAPI, Pydantic |
| Banco      | SQLite |
| Frontend   | HTML5, CSS3 (vanilla), JavaScript ES6+ |
| Servidor   | Uvicorn |

---

## 🚀 Como Rodar

### Pré-requisitos

- [Python 3.10+](https://www.python.org/downloads/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/livraria.git
cd livraria

# Crie um ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt
```

### Executando

```bash
cd app
uvicorn main:app --reload
```

Acesse **http://127.0.0.1:8000** no navegador.

A documentação interativa da API fica em **http://127.0.0.1:8000/docs** (Swagger UI).

---

## 📁 Estrutura do Projeto

```
livraria/
├── app/
│   ├── main.py          # FastAPI — rotas e lógica da API
│   ├── models.py         # Schemas Pydantic (validação)
│   └── database.py       # Conexão SQLite e inicialização
├── database/
│   ├── 01_schema.sql     # DDL — criação das tabelas
│   └── 02_data.sql       # Dados de exemplo (seed)
├── frontend/
│   ├── index.html        # Interface web
│   ├── style.css         # Design system (dark mode)
│   └── app.js            # Lógica do frontend
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 📡 Endpoints da API

### Livros

| Método   | Rota                 | Descrição               |
|----------|----------------------|-------------------------|
| `GET`    | `/api/livros`        | Lista todos os livros   |
| `GET`    | `/api/livros/{id}`   | Busca livro por ID      |
| `POST`   | `/api/livros`        | Cadastra novo livro     |
| `PUT`    | `/api/livros/{id}`   | Atualiza um livro       |
| `DELETE` | `/api/livros/{id}`   | Remove um livro         |

### Autores

| Método   | Rota                  | Descrição               |
|----------|-----------------------|-------------------------|
| `GET`    | `/api/autores`        | Lista todos os autores  |
| `GET`    | `/api/autores/{id}`   | Busca autor por ID      |
| `POST`   | `/api/autores`        | Cadastra novo autor     |
| `PUT`    | `/api/autores/{id}`   | Atualiza um autor       |
| `DELETE` | `/api/autores/{id}`   | Remove um autor         |

### Dashboard

| Método | Rota          | Descrição                       |
|--------|---------------|---------------------------------|
| `GET`  | `/api/stats`  | Estatísticas gerais da livraria |

---

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
