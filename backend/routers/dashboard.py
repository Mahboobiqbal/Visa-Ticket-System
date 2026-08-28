from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from database import get_db
from models import TicketBooking, VisaProcessing, Agent, CashOut
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_date_filter(period):
    now = datetime.now()
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        return now - timedelta(days=7)
    elif period == "month":
        return now - timedelta(days=30)
    elif period == "year":
        return now - timedelta(days=365)
    return None


@router.get("/")
def get_dashboard(
    period: str = Query("all", regex="^(today|week|month|year|all)$"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    date_from = get_date_filter(period)

    def filter_query(query):
        if date_from:
            query = query.filter(TicketBooking.created_at >= date_from) if query.column_descriptions.get('primary_entity') == 'TicketBooking' else query.filter(VisaProcessing.created_at >= date_from)
        return query

    # Tickets
    ticket_query = db.query(TicketBooking)
    if date_from:
        ticket_query = ticket_query.filter(TicketBooking.created_at >= date_from)
    total_tickets = ticket_query.count()

    # Visas
    visa_query = db.query(VisaProcessing)
    if date_from:
        visa_query = visa_query.filter(VisaProcessing.created_at >= date_from)
    total_visas = visa_query.count()

    total_agents = db.query(Agent).count()

    # Revenue
    total_revenue_ticket = ticket_query.with_entities(func.sum(TicketBooking.selling_price)).scalar() or 0
    total_revenue_visa = visa_query.with_entities(func.sum(VisaProcessing.total_charges)).scalar() or 0
    total_revenue = total_revenue_ticket + total_revenue_visa

    # Commission
    total_commission_ticket = ticket_query.with_entities(func.sum(TicketBooking.commission)).scalar() or 0
    total_commission_visa = visa_query.with_entities(func.sum(VisaProcessing.total_commission)).scalar() or 0
    total_commission = total_commission_ticket + total_commission_visa

    # Expenses
    total_expenses = visa_query.with_entities(func.sum(VisaProcessing.total_expenses)).scalar() or 0

    # Pending payments
    pending_ticket_query = db.query(func.sum(TicketBooking.selling_price - TicketBooking.payment_received)).filter(
        TicketBooking.payment_status != "paid"
    )
    pending_visa_query = db.query(func.sum(VisaProcessing.total_charges - VisaProcessing.payment_received))
    if date_from:
        pending_ticket_query = pending_ticket_query.filter(TicketBooking.created_at >= date_from)
        pending_visa_query = pending_visa_query.filter(VisaProcessing.created_at >= date_from)
    pending_payments = (pending_ticket_query.scalar() or 0) + (pending_visa_query.scalar() or 0)

    # Recent tickets
    recent_tickets_raw = db.query(TicketBooking).order_by(TicketBooking.created_at.desc()).limit(5).all()
    agents_map = {a.id: a.name for a in db.query(Agent).all()}
    recent_tickets = [
        {
            "id": t.id,
            "passenger_name": t.passenger_name,
            "airline": t.airline,
            "flight_from": t.flight_from,
            "flight_to": t.flight_to,
            "departure_date": t.departure_date,
            "selling_price": t.selling_price,
            "payment_status": t.payment_status,
            "agent_name": agents_map.get(t.agent_id, ""),
        }
        for t in recent_tickets_raw
    ]

    # Recent visas
    recent_visas_raw = db.query(VisaProcessing).order_by(VisaProcessing.created_at.desc()).limit(5).all()
    recent_visas = [
        {
            "id": v.id,
            "passenger_name": v.passenger_name,
            "visa_type": v.visa_type,
            "package": v.package,
            "total_charges": v.total_charges,
            "status": v.status,
            "agent_name": agents_map.get(v.agent_id, ""),
        }
        for v in recent_visas_raw
    ]

    # Monthly revenue (last 6 months)
    monthly_revenue = []
    now = datetime.now()
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            next_month = (month_date + timedelta(days=32)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            next_month = now + timedelta(days=1)

        ticket_rev = db.query(func.sum(TicketBooking.selling_price)).filter(
            TicketBooking.created_at >= month_start,
            TicketBooking.created_at < next_month
        ).scalar() or 0

        visa_rev = db.query(func.sum(VisaProcessing.total_charges)).filter(
            VisaProcessing.created_at >= month_start,
            VisaProcessing.created_at < next_month
        ).scalar() or 0

        monthly_revenue.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": ticket_rev + visa_rev
        })

    # Top agents by revenue
    agent_revenues = []
    for agent in db.query(Agent).filter(Agent.status == "active").all():
        ticket_rev = db.query(func.sum(TicketBooking.selling_price)).filter(
            TicketBooking.agent_id == agent.id
        ).scalar() or 0
        visa_rev = db.query(func.sum(VisaProcessing.total_charges)).filter(
            VisaProcessing.agent_id == agent.id
        ).scalar() or 0
        ticket_comm = db.query(func.sum(TicketBooking.commission)).filter(
            TicketBooking.agent_id == agent.id
        ).scalar() or 0
        visa_comm = db.query(func.sum(VisaProcessing.total_commission)).filter(
            VisaProcessing.agent_id == agent.id
        ).scalar() or 0
        total = ticket_rev + visa_rev
        if total > 0:
            agent_revenues.append({
                "id": agent.id,
                "name": agent.name,
                "revenue": total,
                "commission": ticket_comm + visa_comm
            })
    agent_revenues.sort(key=lambda x: x["revenue"], reverse=True)
    top_agents = agent_revenues[:5]

    return {
        "total_tickets": total_tickets,
        "total_visas": total_visas,
        "total_agents": total_agents,
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "total_expenses": total_expenses,
        "pending_payments": pending_payments,
        "recent_tickets": recent_tickets,
        "recent_visas": recent_visas,
        "monthly_revenue": monthly_revenue,
        "top_agents": top_agents,
    }
