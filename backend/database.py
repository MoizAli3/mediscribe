from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# --- CHANGE IS HERE ---
# Agar Vercel par hai, to /tmp folder use karein (Temporary Storage)
if os.environ.get("VERCEL"):
    SQLALCHEMY_DATABASE_URL = "sqlite:////tmp/patients.db"
else:
    # Localhost ke liye wahi purana path
    SQLALCHEMY_DATABASE_URL = "sqlite:///./patients.db"
# ----------------------

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()