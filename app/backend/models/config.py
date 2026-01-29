from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class ConfigProvince(Base):
    """Configuration table for provinces"""
    __tablename__ = "config_provinces"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    code = Column(String, nullable=False, unique=True)  # BA, BT, BR, FG, LE, TA
    name = Column(String, nullable=False)  # Full name
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)


class ConfigMaterial(Base):
    """Configuration table for materials"""
    __tablename__ = "config_materials"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False, unique=True)  # Calcare, Calcarenite, etc.
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)


class ConfigPriceMaterial(Base):
    """Configuration table for price material classes (linked to general materials)"""
    __tablename__ = "config_price_materials"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False, unique=True)  # e.g., "Calcare 1a scelta"
    general_material = Column(String, nullable=False)  # Links to ConfigMaterial.name
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)


class ConfigForeignDestination(Base):
    """Configuration table for foreign export destinations"""
    __tablename__ = "config_foreign_destinations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    country = Column(String, nullable=False, unique=True)  # Germania, Francia, USA, etc.
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)