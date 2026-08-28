import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import TicketBooking, VisaProcessing, CashOut, Agent
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["export"])


def tickets_to_csv(tickets):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Agent', 'Passenger', 'Phone', 'Passport', 'Passport Expiry',
        'Airline', 'From', 'To', 'Booking Ref', 'Departure', 'Return',
        'Ticket Price', 'Selling Price', 'Commission', 'Payment Received',
        'Payment Status', 'Notes', 'Created At'
    ])
    for t in tickets:
        writer.writerow([
            t.id, t.agent_name, t.passenger_name, t.phone, t.passport_number,
            t.passport_expiry, t.airline, t.flight_from, t.flight_to,
            t.booking_ref, t.departure_date, t.return_date,
            t.ticket_price, t.selling_price, t.commission, t.payment_received,
            t.payment_status, t.notes, t.created_at.strftime('%Y-%m-%d %H:%M') if t.created_at else ''
        ])
    output.seek(0)
    return output


def visas_to_csv(visas):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Agent', 'Passenger', 'Phone', 'Passport', 'Occupation',
        'Visa Type', 'Package', 'Total Charges', 'Package Price', 'Commission',
        'Payment Received', 'Payment Type', 'Cash', 'Bank', 'Expenses',
        'Analysis', 'Status', 'Created At'
    ])
    for v in visas:
        writer.writerow([
            v.id, v.agent_name, v.passenger_name, v.phone, v.passport_number,
            v.occupation, v.visa_type, v.package, v.total_charges,
            v.package_price, v.total_commission, v.payment_received,
            v.payment_type, v.payment_cash, v.payment_bank, v.total_expenses,
            v.analysis, v.status, v.created_at.strftime('%Y-%m-%d %H:%M') if v.created_at else ''
        ])
    output.seek(0)
    return output


def cashouts_to_csv(cashouts):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Agent', 'Name', 'Amount', 'Date', 'Payment Method',
        'Comments', 'Created At'
    ])
    for c in cashouts:
        writer.writerow([
            c.id, c.agent_name, c.name, c.amount, c.date,
            c.payment_method, c.comments,
            c.created_at.strftime('%Y-%m-%d %H:%M') if c.created_at else ''
        ])
    output.seek(0)
    return output


def enrich_tickets(db, tickets):
    agents = {a.id: a.name for a in db.query(Agent).all()}
    for t in tickets:
        t.agent_name = agents.get(t.agent_id, '')
    return tickets


def enrich_visas(db, visas):
    agents = {a.id: a.name for a in db.query(Agent).all()}
    for v in visas:
        v.agent_name = agents.get(v.agent_id, '')
    return visas


def enrich_cashouts(db, cashouts):
    agents = {a.id: a.name for a in db.query(Agent).all()}
    for c in cashouts:
        c.agent_name = agents.get(c.agent_id, '')
    return cashouts


@router.get("/tickets/export")
def export_tickets(
    agent_id: int = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    query = db.query(TicketBooking)
    if agent_id:
        query = query.filter(TicketBooking.agent_id == agent_id)
    if search:
        query = query.filter(TicketBooking.passenger_name.ilike(f"%{search}%"))
    tickets = query.order_by(TicketBooking.created_at.desc()).all()
    tickets = enrich_tickets(db, tickets)
    csv_data = tickets_to_csv(tickets)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets_export.csv"}
    )


@router.get("/visas/export")
def export_visas(
    agent_id: int = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    query = db.query(VisaProcessing)
    if agent_id:
        query = query.filter(VisaProcessing.agent_id == agent_id)
    if search:
        query = query.filter(VisaProcessing.passenger_name.ilike(f"%{search}%"))
    visas = query.order_by(VisaProcessing.created_at.desc()).all()
    visas = enrich_visas(db, visas)
    csv_data = visas_to_csv(visas)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=visas_export.csv"}
    )


@router.get("/cashouts/export")
def export_cashouts(
    agent_id: int = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    query = db.query(CashOut)
    if agent_id:
        query = query.filter(CashOut.agent_id == agent_id)
    if search:
        query = query.filter(CashOut.name.ilike(f"%{search}%"))
    cashouts = query.order_by(CashOut.created_at.desc()).all()
    cashouts = enrich_cashouts(db, cashouts)
    csv_data = cashouts_to_csv(cashouts)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cashouts_export.csv"}
    )
