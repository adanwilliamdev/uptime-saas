import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Monitors ----------
class MonitorBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    url: HttpUrl
    interval_seconds: int = Field(default=60, ge=30, le=3600)
    timeout_seconds: int = Field(default=5, ge=1, le=60)
    expected_status_code: int = Field(default=200, ge=100, le=599)
    is_active: bool = True


class MonitorCreate(MonitorBase):
    pass


class MonitorUpdate(BaseModel):
    name: str | None = None
    url: HttpUrl | None = None
    interval_seconds: int | None = Field(default=None, ge=30, le=3600)
    timeout_seconds: int | None = Field(default=None, ge=1, le=60)
    expected_status_code: int | None = Field(default=None, ge=100, le=599)
    is_active: bool | None = None


class MonitorOut(MonitorBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


# ---------- PingLogs ----------
class PingLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    monitor_id: uuid.UUID
    status_code: int | None
    response_time_ms: float
    is_up: bool
    error_message: str | None
    created_at: datetime


# ---------- Incidents ----------
class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    monitor_id: uuid.UUID
    started_at: datetime
    resolved_at: datetime | None
    cause: str | None
