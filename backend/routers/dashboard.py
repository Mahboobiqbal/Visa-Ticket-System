from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import TicketBooking, VisaProcessing, Agent, CashOut
from schemas import DashboardStats
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    total_tickets = db.query(TicketBooking).count()
    total_visas = db.query(VisaProcessing).count()
    total_agents = db.query(Agent).count()

    total_revenue_ticket = db.query(func.sum(TicketBooking.selling_price)).scalar() or 0
    total_revenue_visa = db.query(func.sum(VisaProcessing.total_charges)).scalar() or 0
    total_revenue = total_revenue_ticket + total_revenue_visa

    total_commission_ticket = db.query(func.sum(TicketBooking.commission)).scalar() or 0
    total_commission_visa = db.query(func.sum(VisaProcessing.total_commission)).scalar() or 0
    total_commission = total_commission_ticket + total_commission_visa

    total_expenses = db.query(func.sum(VisaProcessing.total_expenses)).scalar() or 0

    pending_tickets = db.query(func.sum(TicketBooking.selling_price - TicketBooking.payment_received)).filter(
        TicketBooking.payment_status != "paid"
    ).scalar() or 0
    pending_visa = db.query(func.sum(VisaProcessing.total_charges - VisaProcessing.payment_received)).scalar() or 0
    pending_payments = pending_tickets + pending_visa

    recent_tickets_raw = db.query(TicketBooking).order_by(TicketBooking.created_at.desc()).limit(5).all()
    recent_tickets = []
    for t in recent_tickets_raw:
        agent = db.query(Agent).filter(Agent.id == t.agent_id).first()
        recent_tickets.append({
            "id": t.id,
            "passenger_name": t.passenger_name,
            "airline": t.airline,
            "flight_from": t.flight_from,
            "flight_to": t.flight_to,
            "departure_date": t.departure_date,
            "selling_price": t.selling_price,
            "payment_status": t.payment_status,
            "agent_name": agent.name if agent else "",
        })

    recent_visas_raw = db.query(VisaProcessing).order_by(VisaProcessing.created_at.desc()).limit(5).all()
    recent_visas = []
    for v in recent_visas_raw:
        agent = db.query(Agent).filter(Agent.id == v.agent_id).first()
        recent_visas.append({
            "id": v.id,
            "passenger_name": v.passenger_name,
            "visa_type": v.visa_type,
            "package": v.package,
            "total_charges": v.total_charges,
            "status": v.status,
            "agent_name": agent.name if agent else "",
        })

    return DashboardStats(
        total_tickets=total_tickets,
        total_visas=total_visas,
        total_agents=total_agents,
        total_revenue=total_revenue,
        total_commission=total_commission,
        total_expenses=total_expenses,
        pending_payments=pending_payments,
        recent_tickets=recent_tickets,
        recent_visas=recent_visas,
    )
