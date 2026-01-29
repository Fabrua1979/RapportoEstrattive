from core.database import Base
from sqlalchemy import Column, Float, Integer, String


class Regional_revenue_data(Base):
    __tablename__ = "regional_revenue_data"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    anno = Column(Integer, nullable=False)
    importo_euro = Column(Float, nullable=False)