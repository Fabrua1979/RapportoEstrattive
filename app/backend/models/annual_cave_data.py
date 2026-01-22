from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Annual_cave_data(Base):
    __tablename__ = "annual_cave_data"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    anno = Column(Integer, nullable=False)
    numero_cave = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)