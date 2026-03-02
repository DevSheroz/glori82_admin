from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    user_name: str
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    user_id: int
    name: str
    user_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse


class UserCreate(BaseModel):
    name: str
    user_name: str
    password: str
    role: str = "moderator"


class UserUpdate(BaseModel):
    name: str | None = None
    user_name: str | None = None
    password: str | None = None
    is_active: bool | None = None
