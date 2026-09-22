from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import TokenOut, UserCreate, UserLogin, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_user(db, data)


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    token = await auth_service.authenticate(db, data)
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current: User = Depends(get_current_user)):
    return current
