# backend/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load biến môi trường từ .env
load_dotenv()

# Lấy chuỗi kết nối
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# ĐÂY! CÁI DÒNG MÀ NÓ BÁO THIẾU CHÍNH LÀ DÒNG NÀY ĐÂY!
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()