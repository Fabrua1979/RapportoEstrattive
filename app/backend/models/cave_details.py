from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Cave_details(Base):
    __tablename__ = "cave_details"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    anno = Column(Integer, nullable=False)
    numero_fascicolo = Column(String, nullable=True)
    azienda = Column(String, nullable=True)
    localita = Column(String, nullable=True)
    comune = Column(String, nullable=True)
    provincia = Column(String, nullable=True)
    dati_catastali = Column(String, nullable=True)
    stato_cava = Column(String, nullable=True)
    aperta_fino_al = Column(Integer, nullable=True)
    materiale = Column(String, nullable=True)
    numero_decreto = Column(String, nullable=True)
    data_decreto = Column(String, nullable=True)
    scadenza_autorizzazione = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)