import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Monitor, PingLog, User
from app.schemas.schemas import MonitorCreate, MonitorOut, MonitorUpdate, PingLogOut

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.get("", response_model=list[MonitorOut])
async def list_monitors(
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = await db.scalars(
        select(Monitor).where(Monitor.user_id == current.id).order_by(Monitor.created_at.desc())
    )
    return list(rows)


@router.post("", response_model=MonitorOut, status_code=201)
async def create_monitor(
    data: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    payload = data.model_dump()
    payload["url"] = str(data.url)
    monitor = Monitor(user_id=current.id, **payload)
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.patch("/{monitor_id}", response_model=MonitorOut)
async def update_monitor(
    monitor_id: uuid.UUID,
    data: MonitorUpdate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    monitor = await db.get(Monitor, monitor_id)
    if not monitor or monitor.user_id != current.id:
        raise HTTPException(404, "Monitor não encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "url" and value is not None:
            value = str(data.url)
        setattr(monitor, field, value)

    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.delete("/{monitor_id}", status_code=204)
async def delete_monitor(
    monitor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    monitor = await db.get(Monitor, monitor_id)
    if not monitor or monitor.user_id != current.id:
        raise HTTPException(404, "Monitor não encontrado")
    await db.delete(monitor)
    await db.commit()


@router.get("/{monitor_id}/logs", response_model=list[PingLogOut])
async def get_logs(
    monitor_id: uuid.UUID,
    hours: int = 24,
    limit: int = 500,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    monitor = await db.get(Monitor, monitor_id)
    if not monitor or monitor.user_id != current.id:
        raise HTTPException(404, "Monitor não encontrado")

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = await db.scalars(
        select(PingLog)
        .where(PingLog.monitor_id == monitor_id, PingLog.created_at >= since)
        .order_by(desc(PingLog.created_at))
        .limit(limit)
    )
    return list(rows)


@router.get("/{monitor_id}/uptime")
async def get_uptime(
    monitor_id: uuid.UUID,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    monitor = await db.get(Monitor, monitor_id)
    if not monitor or monitor.user_id != current.id:
        raise HTTPException(404, "Monitor não encontrado")

    since = datetime.now(timezone.utc) - timedelta(days=days)
    total = await db.scalar(
        select(func.count()).where(PingLog.monitor_id == monitor_id, PingLog.created_at >= since)
    )
    up = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_id,
            PingLog.created_at >= since,
            PingLog.is_up.is_(True),
        )
    )
    avg_latency = await db.scalar(
        select(func.avg(PingLog.response_time_ms)).where(
            PingLog.monitor_id == monitor_id,
            PingLog.created_at >= since,
            PingLog.is_up.is_(True),
        )
    )

    uptime_pct = (up / total * 100) if total else 0.0
    return {
        "monitor_id": str(monitor_id),
        "window_days": days,
        "total_checks": total or 0,
        "successful_checks": up or 0,
        "uptime_percent": round(uptime_pct, 3),
        "avg_latency_ms": round(float(avg_latency or 0.0), 2),
    }
