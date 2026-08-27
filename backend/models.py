from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    full_name = Column(String, default="")
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, default="")
    email = Column(String, default="")
    commission_rate = Column(Float, default=10.0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("TicketBooking", back_populates="agent")
    visas = relationship("VisaProcessing", back_populates="agent")
    cashouts = relationship("CashOut", back_populates="agent")


class TicketBooking(Base):
    __tablename__ = "ticket_bookings"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    passenger_name = Column(String)
    passport_number = Column(String, default="")
    passport_expiry = Column(String, default="")
    phone = Column(String, default="")
    airline = Column(String, default="")
    flight_from = Column(String)
    flight_to = Column(String)
    booking_ref = Column(String, default="")
    departure_date = Column(String)
    return_date = Column(String, default="")
    ticket_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    commission = Column(Float, default=0.0)
    payment_received = Column(Float, default=0.0)
    payment_status = Column(String, default="pending")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="tickets")


class VisaProcessing(Base):
    __tablename__ = "visa_processings"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    passenger_name = Column(String)
    passport_number = Column(String, default="")
    phone = Column(String, default="")
    occupation = Column(String, default="")
    visa_type = Column(String, default="umrah")
    package = Column(String, default="basic")
    total_charges = Column(Float, default=0.0)
    package_price = Column(Float, default=0.0)
    total_commission = Column(Float, default=0.0)
    payment_received = Column(Float, default=0.0)
    payment_type = Column(String, default="cash")
    payment_cash = Column(Float, default=0.0)
    payment_bank = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    analysis = Column(Text, default="")
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="visas")


class CashOut(Base):
    __tablename__ = "cashouts"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    visa_id = Column(Integer, ForeignKey("visa_processings.id"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("ticket_bookings.id"), nullable=True)
    name = Column(String)
    amount = Column(Float, default=0.0)
    date = Column(String)
    payment_method = Column(String, default="cash")
    comments = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="cashouts")


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text, default="")
