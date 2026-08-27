from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Settings
from schemas import SettingCreate, SettingOut
from auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/", response_model=list[SettingOut])
def list_settings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Settings).all()


@router.get("/{key}", response_model=SettingOut)
def get_setting(key: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.post("/", response_model=SettingOut)
def create_setting(setting: SettingCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(Settings).filter(Settings.key == setting.key).first()
    if existing:
        existing.value = setting.value
        db.commit()
        db.refresh(existing)
        return existing
    db_setting = Settings(**setting.model_dump())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


@router.delete("/{key}")
def delete_setting(key: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    db.delete(setting)
    db.commit()
    return {"detail": "Setting deleted"}
