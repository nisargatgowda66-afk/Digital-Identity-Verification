import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./identity_system.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class IdentityRecord(Base):
    __tablename__ = "identities"

    id = Column(Integer, primary_key=True, index=True)
    identity_id = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    document_type = Column(String(100), nullable=False)
    document_filename = Column(String(255), nullable=False)
    document_hash = Column(String(64), index=True, nullable=False)
    document_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    tx_hash = Column(String(120), nullable=False)
    block_number = Column(Integer, default=1)
    blockchain_mode = Column(String(50), default="SIMULATED")

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    identity_id = Column(String(100), index=True, nullable=False)
    provided_hash = Column(String(64), nullable=False)
    expected_hash = Column(String(64), nullable=True)
    is_valid = Column(Boolean, nullable=False)
    status_message = Column(String(255), nullable=False)
    tx_reference = Column(String(120), nullable=True)
    block_number = Column(Integer, default=0)
    blockchain_mode = Column(String(50), default="SIMULATED")
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
