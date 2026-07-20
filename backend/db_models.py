"""
INDRA Backend — Database Table Models
SQLAlchemy ORM models for Neon PostgreSQL storage.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base


class DSISnapshotRow(Base):
    """
    Historical snapshot of Disruption Signal Index (DSI) per corridor.
    Written every 30 minutes by APScheduler, and queryable by /api/history.
    """
    __tablename__ = "dsi_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    corridor_id = Column(String(32), index=True, nullable=False)
    dsi = Column(Float, nullable=False)
    threshold = Column(String(32), nullable=False)
    tanker_density = Column(Float, nullable=False)
    geopolitical = Column(Float, nullable=False)
    price_deviation = Column(Float, nullable=False)
    sanctions = Column(Float, nullable=False)
    vessel_count = Column(Integer, nullable=False)
    data_source = Column(String(32), nullable=False)
    computed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
