from pydantic import BaseModel, Field
from typing import Optional


# ── Autor ────────────────────────────────────────────────────────────────
class AutorBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=120, examples=["Machado de Assis"])
    nacionalidade: Optional[str] = Field(None, max_length=60, examples=["Brasileiro"])


class AutorCreate(AutorBase):
    pass


class AutorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=120)
    nacionalidade: Optional[str] = Field(None, max_length=60)


class AutorResponse(AutorBase):
    id: int

    class Config:
        from_attributes = True


# ── Livro ────────────────────────────────────────────────────────────────
class LivroBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200, examples=["Dom Casmurro"])
    autor_id: int = Field(..., ge=1, examples=[1])
    ano_publicacao: Optional[int] = Field(None, ge=0, le=2100, examples=[1899])
    preco: float = Field(..., ge=0, examples=[39.90])
    estoque: int = Field(0, ge=0, examples=[10])


class LivroCreate(LivroBase):
    pass


class LivroUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    autor_id: Optional[int] = Field(None, ge=1)
    ano_publicacao: Optional[int] = Field(None, ge=0, le=2100)
    preco: Optional[float] = Field(None, ge=0)
    estoque: Optional[int] = Field(None, ge=0)


class LivroResponse(LivroBase):
    id: int
    autor_nome: Optional[str] = None

    class Config:
        from_attributes = True
