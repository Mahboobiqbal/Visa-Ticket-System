from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import CashOut, Agent
from schemas import CashOutCreate, CashOutUpdate, CashOutOut
from auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/api/cashouts", tags=["cashouts"])


@router.get("/", response_model=list[CashOutOut])
def list_cashouts(
    agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(CashOut)
    if agent_id:
        query = query.filter(CashOut.agent_id == agent_id)
    if search:
        query = query.filter(CashOut.name.ilike(f"%{search}%"))
    cashouts = query.order_by(CashOut.created_at.desc()).all()
    result = []
    for c in cashouts:
        agent = db.query(Agent).filter(Agent.id == c.agent_id).first() if c.agent_id else None
        cashout_dict = CashOutOut.model_validate(c)
        cashout_dict.agent_name = agent.name if agent else ""
        result.append(cashout_dict)
    return result


@router.post("/", response_model=CashOutOut)
def create_cashout(cashout: CashOutCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_cashout = CashOut(**cashout.model_dump())
    db.add(db_cashout)
    db.commit()
    db.refresh(db_cashout)
    agent = db.query(Agent).filter(Agent.id == db_cashout.agent_id).first() if db_cashout.agent_id else None
    result = CashOutOut.model_validate(db_cashout)
    result.agent_name = agent.name if agent else ""
    return result


@router.get("/{cashout_id}", response_model=CashOutOut)
def get_cashout(cashout_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cashout = db.query(CashOut).filter(CashOut.id == cashout_id).first()
    if not cashout:
        raise HTTPException(status_code=404, detail="Cash out not found")
    agent = db.query(Agent).filter(Agent.id == cashout.agent_id).first() if cashout.agent_id else None
    result = CashOutOut.model_validate(cashout)
    result.agent_name = agent.name if agent else ""
    return result


@router.put("/{cashout_id}", response_model=CashOutOut)
def update_cashout(cashout_id: int, update: CashOutUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cashout = db.query(CashOut).filter(CashOut.id == cashout_id).first()
    if not cashout:
        raise HTTPException(status_code=404, detail="Cash out not found")
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(cashout, key, value)
    db.commit()
    db.refresh(cashout)
    agent = db.query(Agent).filter(Agent.id == cashout.agent_id).first() if cashout.agent_id else None
    result = CashOutOut.model_validate(cashout)
    result.agent_name = agent.name if agent else ""
    return result


@router.delete("/{cashout_id}")
def delete_cashout(cashout_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cashout = db.query(CashOut).filter(CashOut.id == cashout_id).first()
    if not cashout:
        raise HTTPException(status_code=404, detail="Cash out not found")
    db.delete(cashout)
    db.commit()
    return {"detail": "Cash out deleted"}
