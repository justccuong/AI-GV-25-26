# backend/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base # Nhớ import Base từ file database.py nhé

class RoleEnum(enum.Enum):
    admin = "admin"
    user = "user"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False) # Dùng email đăng nhập cho chuyên nghiệp
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.user)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Mối quan hệ: 1 User có nhiều Mindmaps (One-to-Many)
    mindmaps = relationship("MindMap", back_populates="owner")

class MindMap(Base):
    __tablename__ = "mindmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Sơ đồ tư duy mới", nullable=False)
    data = Column(Text, nullable=False) # Chứa chuỗi JSON của nodes & edges
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Mối quan hệ: Mindmap này thuộc về ai?
    owner = relationship("User", back_populates="mindmaps")