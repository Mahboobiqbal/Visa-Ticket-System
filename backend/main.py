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

import os
import shutil
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

Base.metadata.create_all(bind=engine)

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


def init_db():
    db = next(get_db())
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        db.add(User(
            username="admin",
            password=get_password_hash("admin123"),
            full_name="Administrator",
            role="admin",
        ))
        db.commit()

    default_settings = [
        ("visa_types", "umrah,work,tourist,business,student"),
        ("visa_packages", "basic,standard,premium"),
        ("payment_methods", "cash,online_bank"),
        ("airlines", "saudi airlines,emirates,qatar airways,flynas,air arabia"),
        ("ticket_statuses", "pending,confirmed,cancelled"),
        ("visa_statuses", "pending,approved,rejected"),
    ]
    for key, value in default_settings:
        existing = db.query(Settings).filter(Settings.key == key).first()
        if not existing:
            db.add(Settings(key=key, value=value))
    db.commit()
    db.close()


init_db()


# Automated backup scheduler
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

def automated_backup():
    try:
        from database import DATABASE_URL
        if "sqlite" in DATABASE_URL:
            db_path = DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
            if os.path.exists(db_path):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_file = os.path.join(BACKUP_DIR, f"backup_{timestamp}.db")
                shutil.copy2(db_path, backup_file)
                # Keep only last 30 backups
                backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.db')])
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
