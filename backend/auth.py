# backend/auth.py
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt

# Công cụ băm mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Chìa khóa bí mật để tạo JWT (Lấy từ .env, không có thì xài tạm chuỗi mặc định)
SECRET_KEY = os.getenv("JWT_SECRET", "hoang_tu_baka_secret_key_123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # Token sống được 1 ngày

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt