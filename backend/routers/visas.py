from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import VisaProcessing, Agent
from schemas import VisaCreate, VisaUpdate, VisaOut
from auth import get_current_user
from routers.activity import log_activity
from typing import Optional

router = APIRouter(prefix="/api/visas", tags=["visas"])


@router.get("/", response_model=list[VisaOut])
def list_visas(
    agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(VisaProcessing)
    if agent_id:
        query = query.filter(VisaProcessing.agent_id == agent_id)
    if search:
        query = query.filter(
            VisaProcessing.passenger_name.ilike(f"%{search}%")
            | VisaProcessing.passport_number.ilike(f"%{search}%")
        )
    visas = query.order_by(VisaProcessing.created_at.desc()).all()
    result = []
    for v in visas:
        agent = db.query(Agent).filter(Agent.id == v.agent_id).first()
        visa_dict = VisaOut.model_validate(v)
        visa_dict.agent_name = agent.name if agent else ""
        result.append(visa_dict)
    return result


@router.post("/", response_model=VisaOut)
def create_visa(visa: VisaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_visa = VisaProcessing(**visa.model_dump())
    db.add(db_visa)
    db.commit()
    db.refresh(db_visa)
    agent = db.query(Agent).filter(Agent.id == db_visa.agent_id).first()
    log_activity(db, user, "create", "visa", db_visa.id, f"Passenger: {db_visa.passenger_name}")
    result = VisaOut.model_validate(db_visa)
    result.agent_name = agent.name if agent else ""
    return result


@router.get("/{visa_id}", response_model=VisaOut)
def get_visa(visa_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    visa = db.query(VisaProcessing).filter(VisaProcessing.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    agent = db.query(Agent).filter(Agent.id == visa.agent_id).first()
    result = VisaOut.model_validate(visa)
    result.agent_name = agent.name if agent else ""
    return result


@router.put("/{visa_id}", response_model=VisaOut)
def update_visa(visa_id: int, update: VisaUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    visa = db.query(VisaProcessing).filter(VisaProcessing.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(visa, key, value)
    db.commit()
    db.refresh(visa)
    agent = db.query(Agent).filter(Agent.id == visa.agent_id).first()
    log_activity(db, user, "update", "visa", visa.id, f"Passenger: {visa.passenger_name}")
    result = VisaOut.model_validate(visa)
    result.agent_name = agent.name if agent else ""
    return result


@router.delete("/{visa_id}")
def delete_visa(visa_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    visa = db.query(VisaProcessing).filter(VisaProcessing.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    name = visa.passenger_name
    db.delete(visa)
    db.commit()
    log_activity(db, user, "delete", "visa", visa_id, f"Passenger: {name}")
    return {"detail": "Visa deleted"}
