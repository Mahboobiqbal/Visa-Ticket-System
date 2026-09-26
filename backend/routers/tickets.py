from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import TicketBooking, Agent
from schemas import TicketCreate, TicketUpdate, TicketOut
from auth import get_current_user
from routers.activity import log_activity
from typing import Optional
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.get("/", response_model=list[TicketOut])
def list_tickets(
    agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(TicketBooking).options(joinedload(TicketBooking.agent))
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
        ticket_dict = TicketOut.model_validate(t)
        ticket_dict.agent_name = t.agent.name if t.agent else ""
        result.append(ticket_dict)
    return result


@router.post("/", response_model=TicketOut)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    agent = db.query(Agent).filter(Agent.id == ticket.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db_ticket = TicketBooking(**ticket.model_dump())
    db.add(db_ticket)
    db.flush()
    log_activity(db, user, "create", "ticket", db_ticket.id, f"Passenger: {db_ticket.passenger_name}")
    db.commit()
    db.refresh(db_ticket)
    result = TicketOut.model_validate(db_ticket)
    result.agent_name = agent.name
    return result


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(TicketBooking).options(joinedload(TicketBooking.agent)).filter(TicketBooking.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    result = TicketOut.model_validate(ticket)
    result.agent_name = ticket.agent.name if ticket.agent else ""
    return result


@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, update: TicketUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(TicketBooking).options(joinedload(TicketBooking.agent)).filter(TicketBooking.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update_data = update.model_dump(exclude_unset=True)
    agent_name = ticket.agent.name if ticket.agent else ""
    if "agent_id" in update_data:
        agent = db.query(Agent).filter(Agent.id == update_data["agent_id"]).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        agent_name = agent.name
    for key, value in update_data.items():
        setattr(ticket, key, value)
    log_activity(db, user, "update", "ticket", ticket.id, f"Passenger: {ticket.passenger_name}")
    db.commit()
    db.refresh(ticket)
    result = TicketOut.model_validate(ticket)
    result.agent_name = agent_name
    return result


@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(TicketBooking).filter(TicketBooking.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    name = ticket.passenger_name
    db.delete(ticket)
    log_activity(db, user, "delete", "ticket", ticket_id, f"Passenger: {name}")
    db.commit()
    return {"detail": "Ticket deleted"}
