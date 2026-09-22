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

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
