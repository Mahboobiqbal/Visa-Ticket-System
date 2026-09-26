from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import VisaProcessing, Agent
from schemas import VisaCreate, VisaUpdate, VisaOut
from auth import get_current_user
from routers.activity import log_activity
from typing import Optional
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/api/visas", tags=["visas"])


@router.get("/", response_model=list[VisaOut])
def list_visas(
    agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(VisaProcessing).options(joinedload(VisaProcessing.agent))
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
        visa_dict = VisaOut.model_validate(v)
        visa_dict.agent_name = v.agent.name if v.agent else ""
        result.append(visa_dict)
    return result


@router.post("/", response_model=VisaOut)
def create_visa(visa: VisaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    agent = db.query(Agent).filter(Agent.id == visa.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db_visa = VisaProcessing(**visa.model_dump())
    db.add(db_visa)
    db.flush()
    log_activity(db, user, "create", "visa", db_visa.id, f"Passenger: {db_visa.passenger_name}")
    db.commit()
    db.refresh(db_visa)
    result = VisaOut.model_validate(db_visa)
    result.agent_name = agent.name
    return result


@router.get("/{visa_id}", response_model=VisaOut)
def get_visa(visa_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    visa = db.query(VisaProcessing).options(joinedload(VisaProcessing.agent)).filter(VisaProcessing.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    result = VisaOut.model_validate(visa)
    result.agent_name = visa.agent.name if visa.agent else ""
    return result


@router.put("/{visa_id}", response_model=VisaOut)
def update_visa(visa_id: int, update: VisaUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    visa = db.query(VisaProcessing).options(joinedload(VisaProcessing.agent)).filter(VisaProcessing.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    update_data = update.model_dump(exclude_unset=True)
    agent_name = visa.agent.name if visa.agent else ""
    if "agent_id" in update_data:
        agent = db.query(Agent).filter(Agent.id == update_data["agent_id"]).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        agent_name = agent.name
    for key, value in update_data.items():
        setattr(visa, key, value)
    log_activity(db, user, "update", "visa", visa.id, f"Passenger: {visa.passenger_name}")
    db.commit()
    db.refresh(visa)
    result = VisaOut.model_validate(visa)
    result.agent_name = agent_name
    return result


@router.delete("/{visa_id}")
def delete_visa(visa_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    visa = db.query(VisaProcessing).filter(VisaProcessing.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    name = visa.passenger_name
    db.delete(visa)
    log_activity(db, user, "delete", "visa", visa_id, f"Passenger: {name}")
    db.commit()
    return {"detail": "Visa deleted"}
