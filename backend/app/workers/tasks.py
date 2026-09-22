import json
import time
from datetime import datetime, timezone

import httpx
import redis.asyncio as aioredis
from sqlalchemy import desc, select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.models import Incident, Monitor, PingLog
from app.workers.broker import broker


async def _publish_incident(payload: dict) -> None:
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.publish("incidents", json.dumps(payload, default=str))
    await r.close()


@broker.task
async def check_endpoint(monitor_id: str) -> None:
    async with AsyncSessionLocal() as db:
        monitor = await db.get(Monitor, monitor_id)
        if not monitor or not monitor.is_active:
            return

        start = time.perf_counter()
        status_code: int | None = None
        error_msg: str | None = None

        try:
            async with httpx.AsyncClient(timeout=monitor.timeout_seconds, follow_redirects=True) as client:
                resp = await client.get(str(monitor.url))
                status_code = resp.status_code
                latency = (time.perf_counter() - start) * 1000
                is_up = status_code == monitor.expected_status_code
        except httpx.RequestError as exc:
            latency = 0.0
            is_up = False
            error_msg = f"{type(exc).__name__}: {exc}"

        log = PingLog(
            monitor_id=monitor.id,
            status_code=status_code,
            response_time_ms=latency,
            is_up=is_up,
            error_message=error_msg,
        )
        db.add(log)

        # Gerenciamento de incidentes
        open_incident = await db.scalar(
            select(Incident)
            .where(Incident.monitor_id == monitor.id, Incident.resolved_at.is_(None))
            .order_by(desc(Incident.started_at))
        )

        if not is_up and not open_incident:
            incident = Incident(
                monitor_id=monitor.id,
                cause=error_msg or f"HTTP {status_code}",
            )
            db.add(incident)
            await db.commit()
            await _publish_incident({
                "monitor_id": str(monitor.id),
                "monitor_name": monitor.name,
                "status": "down",
                "cause": incident.cause,
            })
        elif is_up and open_incident:
            open_incident.resolved_at = datetime.now(timezone.utc)
            await db.commit()
            await _publish_incident({
                "monitor_id": str(monitor.id),
                "monitor_name": monitor.name,
                "status": "up",
            })
        else:
            await db.commit()
