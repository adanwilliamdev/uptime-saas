from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin


async def register_user(db: AsyncSession, data: UserCreate) -> User:
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    user = User(email=data.email, hashed_password=hash_password(data.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, data: UserLogin) -> str:
    user = await db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    return create_access_token(subject=str(user.id))
