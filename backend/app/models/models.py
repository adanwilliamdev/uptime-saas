import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    monitors: Mapped[list["Monitor"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Monitor(Base):
    __tablename__ = "monitors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    interval_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    expected_status_code: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="monitors")
    ping_logs: Mapped[list["PingLog"]] = relationship(back_populates="monitor", cascade="all, delete-orphan")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="monitor", cascade="all, delete-orphan")


class PingLog(Base):
    __tablename__ = "ping_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    monitor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("monitors.id", ondelete="CASCADE"), index=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[float] = mapped_column(Float, default=0.0)
    is_up: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True, nullable=False)

    monitor: Mapped[Monitor] = relationship(back_populates="ping_logs")


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    monitor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("monitors.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cause: Mapped[str | None] = mapped_column(Text, nullable=True)

    monitor: Mapped[Monitor] = relationship(back_populates="incidents")
