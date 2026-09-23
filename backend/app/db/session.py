import asyncio
import sys
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# No Windows, o event loop padrão (ProactorEventLoop) não é totalmente
# suportado pelo asyncpg e causa erros intermitentes de conexão como
# "ConnectionDoesNotExistError: connection was closed in the middle of
# operation" ou "WinError 64". O asyncpg recomenda o SelectorEventLoop.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    # pool_pre_ping testa a conexão (SELECT 1) antes de reutilizá-la do pool;
    # evita usar uma conexão que o Docker Desktop/WSL2 já derrubou em segundo
    # plano, o que no Windows aparece como ConnectionResetError/WinError 10054.
    pool_pre_ping=True,
    pool_recycle=280,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
