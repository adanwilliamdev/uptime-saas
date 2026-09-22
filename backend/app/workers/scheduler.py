import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.models import Monitor
from app.workers.broker import broker
from app.workers.tasks import check_endpoint


async def schedule_loop(interval: int = 10) -> None:
    """Enfileira pings de todos os monitores ativos a cada X segundos."""
    while True:
        async with AsyncSessionLocal() as db:
            monitors = await db.scalars(select(Monitor).where(Monitor.is_active.is_(True)))
            for monitor in monitors:
                await check_endpoint.kiq(str(monitor.id))
        await asyncio.sleep(interval)


if __name__ == "__main__":
    asyncio.run(schedule_loop())
