import os
import sys
import shutil
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# STARTUP CHECKS
# ============================================================

def print_header(text):
    print(f"\n{'='*50}")
    print(f"  {text}")
    print(f"{'='*50}")

def print_ok(text):
    print(f"  [OK] {text}")

def print_fail(text):
    print(f"  [FAIL] {text}")

def print_info(text):
    print(f"  [..] {text}")

def check_postgres():
    """Check if PostgreSQL is running and accessible."""
    import psycopg2
    from urllib.parse import urlparse

    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        print_fail("DATABASE_URL not found in .env file")
        return False

    parsed = urlparse(db_url)
    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            dbname="postgres"
        )
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print_fail(f"Cannot connect to PostgreSQL: {e}")
        print_info("Make sure PostgreSQL is running and credentials are correct")
        return False


def create_database_if_needed():
    """Create the database if it doesn't exist."""
    import psycopg2
    from urllib.parse import urlparse

    db_url = os.getenv("DATABASE_URL", "")
    parsed = urlparse(db_url)
    db_name = parsed.path.lstrip("/")

    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            dbname="postgres"
        )
        conn.autocommit = True
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()

        if not exists:
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print_ok(f"Database '{db_name}' created")
        else:
            print_ok(f"Database '{db_name}' exists")

        cur.close()
        conn.close()
        return True
    except Exception as e:
        print_fail(f"Error creating database: {e}")
        return False


def run_migrations():
    """Run Alembic migrations to create/update tables."""
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config("alembic.ini")
    try:
        command.upgrade(alembic_cfg, "head")
        print_ok("Database tables created/updated")
        return True
    except Exception as e:
        print_fail(f"Migration error: {e}")
        return False


def seed_data():
    """Seed admin user and default settings."""
    from database import SessionLocal
    from models import User, Settings
    from auth import get_password_hash

    db = SessionLocal()
    try:
        # Create admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            db.add(User(
                username="admin",
                password=get_password_hash("admin123"),
                full_name="Administrator",
                role="admin",
            ))
            db.commit()
            print_ok("Admin user created (admin / admin123)")
        else:
            print_ok("Admin user exists")

        # Create default settings
        defaults = [
            ("visa_types", "umrah,work,tourist,business,student"),
            ("visa_packages", "basic,standard,premium"),
            ("payment_methods", "cash,online_bank"),
            ("airlines", "saudi airlines,emirates,qatar airways,flynas,air arabia"),
            ("ticket_statuses", "pending,confirmed,cancelled"),
            ("visa_statuses", "pending,approved,rejected"),
        ]
        added = 0
        for key, value in defaults:
            existing = db.query(Settings).filter(Settings.key == key).first()
            if not existing:
                db.add(Settings(key=key, value=value))
                added += 1
        db.commit()

        if added > 0:
            print_ok(f"Default settings added ({added} new)")
        else:
            print_ok("Default settings exist")

        return True
    except Exception as e:
        print_fail(f"Seed error: {e}")
        return False
    finally:
        db.close()


def create_backup_dir():
    """Create backups directory."""
    backup_dir = os.path.join(os.path.dirname(__file__), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    print_ok("Backups directory ready")
    return True


def run_startup_checks():
    """Run all startup checks."""
    print_header("Visa & Ticket System - Starting Up")

    # Step 1: Check .env file
    print_info("Checking configuration...")
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print_ok(".env file created from .env.example")
            print_info("Please update .env with your database credentials")
        else:
            print_fail(".env file not found")
            return False
    else:
        print_ok(".env file exists")

    # Step 2: Check PostgreSQL connection
    print_info("Connecting to PostgreSQL...")
    if not check_postgres():
        return False
    print_ok("PostgreSQL connection successful")

    # Step 3: Create database if needed
    print_info("Checking database...")
    if not create_database_if_needed():
        return False

    # Step 4: Run migrations
    print_info("Running migrations...")
    if not run_migrations():
        return False

    # Step 5: Seed data
    print_info("Setting up initial data...")
    if not seed_data():
        return False

    # Step 6: Create backup directory
    print_info("Preparing backup storage...")
    create_backup_dir()

    print_header("All checks passed! Server starting...")
    return True


# ============================================================
# APP START
# ============================================================

if not run_startup_checks():
    print("\nStartup failed. Please fix the errors above and try again.\n")
    sys.exit(1)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import User, Settings
from schemas import LoginRequest, TokenResponse, UserOut, SettingCreate
from auth import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user, SECRET_KEY
)
from routers import agents, tickets, visas, cashouts, settings, dashboard, backup
from apscheduler.schedulers.background import BackgroundScheduler

app = FastAPI(title="Visa Ticket System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(tickets.router)
app.include_router(visas.router)
app.include_router(cashouts.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(backup.router)


# Automated backup scheduler
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

def automated_backup():
    try:
        from database import DATABASE_URL
        if "postgres" in DATABASE_URL:
            import subprocess
            from urllib.parse import urlparse
            parsed = urlparse(DATABASE_URL)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = os.path.join(BACKUP_DIR, f"backup_{timestamp}.sql")
            env = os.environ.copy()
            env["PGPASSWORD"] = parsed.password or ""
            subprocess.run([
                "pg_dump",
                "-h", parsed.hostname,
                "-p", str(parsed.port or 5432),
                "-U", parsed.username,
                "-d", parsed.path.lstrip("/"),
                "-f", backup_file
            ], env=env, check=True)
            # Keep only last 30 backups
            backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.sql')])
            for old in backups[:-30]:
                os.remove(os.path.join(BACKUP_DIR, old))
    except Exception as e:
        print(f"Backup error: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(automated_backup, 'interval', hours=6)
scheduler.start()


@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@app.post("/api/auth/refresh", response_model=TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh
    )


@app.get("/api/auth/me", response_model=UserOut)
def get_me(user=Depends(get_current_user)):
    return user


if __name__ == "__main__":
    import uvicorn
    print(f"\nServer running at: http://localhost:8000")
    print(f"Login: admin / admin123\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
