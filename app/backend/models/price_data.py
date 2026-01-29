from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Price_data(Base):
    __tablename__ = "price_data"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    anno = Column(Integer, nullable=False)
    classe_materiale = Column(String, nullable=False)
    prezzo_euro_m3 = Column(Float, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)