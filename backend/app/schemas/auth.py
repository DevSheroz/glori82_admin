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

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse
