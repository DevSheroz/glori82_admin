from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.models.user import User


async def authenticate(db: AsyncSession, user_name: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.user_name == user_name, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
