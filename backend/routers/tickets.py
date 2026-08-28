from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import TicketBooking, Agent
from schemas import TicketCreate, TicketUpdate, TicketOut
from auth import get_current_user
from routers.activity import log_activity
from typing import Optional

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.get("/", response_model=list[TicketOut])
def list_tickets(
    agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(TicketBooking)
    if agent_id:
        query = query.filter(TicketBooking.agent_id == agent_id)
    if search:
        query = query.filter(
            TicketBooking.passenger_name.ilike(f"%{search}%")
            | TicketBooking.booking_ref.ilike(f"%{search}%")
            | TicketBooking.passport_number.ilike(f"%{search}%")
        )
    tickets = query.order_by(TicketBooking.created_at.desc()).all()
    result = []
    for t in tickets:
        agent = db.query(Agent).filter(Agent.id == t.agent_id).first()
        ticket_dict = TicketOut.model_validate(t)
        ticket_dict.agent_name = agent.name if agent else ""
        result.append(ticket_dict)
    return result


@router.post("/", response_model=TicketOut)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_ticket = TicketBooking(**ticket.model_dump())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    agent = db.query(Agent).filter(Agent.id == db_ticket.agent_id).first()
    log_activity(db, user, "create", "ticket", db_ticket.id, f"Passenger: {db_ticket.passenger_name}")
    result = TicketOut.model_validate(db_ticket)
    result.agent_name = agent.name if agent else ""
    return result


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(TicketBooking).filter(TicketBooking.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    agent = db.query(Agent).filter(Agent.id == ticket.agent_id).first()
    result = TicketOut.model_validate(ticket)
    result.agent_name = agent.name if agent else ""
    return result


@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, update: TicketUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(TicketBooking).filter(TicketBooking.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
    db.commit()
    db.refresh(ticket)
    agent = db.query(Agent).filter(Agent.id == ticket.agent_id).first()
    log_activity(db, user, "update", "ticket", ticket.id, f"Passenger: {ticket.passenger_name}")
    result = TicketOut.model_validate(ticket)
    result.agent_name = agent.name if agent else ""
    return result


@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(TicketBooking).filter(TicketBooking.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    name = ticket.passenger_name
    db.delete(ticket)
    db.commit()
    log_activity(db, user, "delete", "ticket", ticket_id, f"Passenger: {name}")
    return {"detail": "Ticket deleted"}
