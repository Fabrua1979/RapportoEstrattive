from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Economic_data(Base):
    __tablename__ = "economic_data"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    anno = Column(Integer, nullable=False)
    provincia = Column(String, nullable=False)
    materiale = Column(String, nullable=False)
    fatturato = Column(Float, nullable=False)
    costi = Column(Float, nullable=False)
    utile_lordo = Column(Float, nullable=False)
    utile_netto = Column(Float, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)