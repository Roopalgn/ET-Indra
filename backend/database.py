"""
INDRA Backend — Database
SQLAlchemy async engine for Neon PostgreSQL.
Phase 1: engine created but not actively used by routes.
Phase 2+: DSI history and tanker positions written here.

Cold-start mitigation:
  - pool_pre_ping=True    → validates connection before using from pool
  - pool_recycle=300      → recycles connections every 5 min (before Neon's idle disconnect)
  - SQLAlchemy handles one reconnect attempt transparently
  - NO background keep-alive: Neon suspends after 5 min idle (default).
    A 30-min polling cycle uses ~2.4 CU-hrs/day, well within the 100 CU-hrs/month free limit.
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings


class Base(DeclarativeBase):
    pass


def make_engine():
    """Create engine only if a DATABASE_URL is configured."""
    if not settings.DATABASE_URL:
        return None
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_pre_ping=True,     # validates conn before use — absorbs cold-start
        pool_recycle=300,       # recycle every 5 min — avoids stale Neon connections
        pool_size=5,
        max_overflow=10,
    )


engine = make_engine()

# Session factory — None if no DB configured
AsyncSessionLocal: async_sessionmaker | None = (
    async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    if engine else None
)


async def get_db():
    """FastAPI dependency — yields a DB session. No-ops if DB not configured."""
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
