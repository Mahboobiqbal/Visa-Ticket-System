from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import User, Settings
from schemas import LoginRequest, TokenResponse, UserOut, SettingCreate
from auth import hash_password, verify_password, create_access_token, get_current_user
from routers import agents, tickets, visas, cashouts, settings, dashboard, backup

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
            password=hash_password("admin123"),
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


@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return TokenResponse(access_token=token)


@app.get("/api/auth/me", response_model=UserOut)
def get_me(user=Depends(get_current_user)):
    return user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
