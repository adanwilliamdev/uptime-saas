import asyncio
import os
import sys
from logging.config import fileConfig

import asyncpg.exceptions as pg_exceptions

# Garante que a raiz do backend/ esteja no sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# No Windows, o ProactorEventLoop padrão não é totalmente suportado pelo
# asyncpg (causa erros intermitentes de conexão). Ver app/db/session.py.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.db.base import Base
from app.models import models  # noqa: F401  (importa p/ registrar metadata)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    # No Windows, mesmo com o WindowsSelectorEventLoopPolicy acima, a primeira
    # conexão logo após o container do Postgres subir às vezes é derrubada
    # pelo Docker Desktop (vpnkit/WSL2) com ConnectionResetError/WinError 10054
    # ou ConnectionDoesNotExistError. Como essa migration roda uma única vez
    # (sem pool para reaproveitar conexão), fazemos algumas tentativas com
    # backoff antes de desistir.
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            async with connectable.connect() as connection:
                await connection.run_sync(do_run_migrations)
            last_error = None
            break
        except (OSError, ConnectionError, pg_exceptions.ConnectionDoesNotExistError, pg_exceptions.CannotConnectNowError) as exc:
            last_error = exc
            print(
                f"[alembic] Conexão com o Postgres falhou (tentativa {attempt}/5): "
                f"{exc!r}. Tentando novamente em {attempt * 2}s..."
            )
            await asyncio.sleep(attempt * 2)
    await connectable.dispose()
    if last_error is not None:
        raise last_error


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()