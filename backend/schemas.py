from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


# User
class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


# Agent
class AgentCreate(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    commission_rate: float = 10.0
    status: str = "active"


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    commission_rate: Optional[float] = None
    status: Optional[str] = None


class AgentOut(BaseModel):
    id: int
    name: str
    phone: str
    email: str
    commission_rate: float
    status: str

    class Config:
        from_attributes = True


# Ticket Booking
class TicketCreate(BaseModel):
    agent_id: int
    passenger_name: str
    passport_number: str = ""
    passport_expiry: str = ""
    phone: str = ""
    airline: str = ""
    flight_from: str
    flight_to: str
    booking_ref: str = ""
    departure_date: str
    return_date: str = ""
    ticket_price: float = 0.0
    selling_price: float = 0.0
    commission: float = 0.0
    payment_received: float = 0.0
    payment_status: str = "pending"
    notes: str = ""


class TicketUpdate(BaseModel):
    agent_id: Optional[int] = None
    passenger_name: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[str] = None
    phone: Optional[str] = None
    airline: Optional[str] = None
    flight_from: Optional[str] = None
    flight_to: Optional[str] = None
    booking_ref: Optional[str] = None
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    ticket_price: Optional[float] = None
    selling_price: Optional[float] = None
    commission: Optional[float] = None
    payment_received: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class TicketOut(BaseModel):
    id: int
    agent_id: int
    passenger_name: str
    passport_number: str
    passport_expiry: str
    phone: str
    airline: str
    flight_from: str
    flight_to: str
    booking_ref: str
    departure_date: str
    return_date: str
    ticket_price: float
    selling_price: float
    commission: float
    payment_received: float
    payment_status: str
    notes: str
    created_at: datetime
    agent_name: str = ""

    class Config:
        from_attributes = True


# Visa Processing
class VisaCreate(BaseModel):
    agent_id: int
    passenger_name: str
    passport_number: str = ""
    phone: str = ""
    occupation: str = ""
    visa_type: str = "umrah"
    package: str = "basic"
    total_charges: float = 0.0
    package_price: float = 0.0
    total_commission: float = 0.0
    payment_received: float = 0.0
    payment_type: str = "cash"
    payment_cash: float = 0.0
    payment_bank: float = 0.0
    total_expenses: float = 0.0
    analysis: str = ""
    status: str = "pending"


class VisaUpdate(BaseModel):
    agent_id: Optional[int] = None
    passenger_name: Optional[str] = None
    passport_number: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    visa_type: Optional[str] = None
    package: Optional[str] = None
    total_charges: Optional[float] = None
    package_price: Optional[float] = None
    total_commission: Optional[float] = None
    payment_received: Optional[float] = None
    payment_type: Optional[str] = None
    payment_cash: Optional[float] = None
    payment_bank: Optional[float] = None
    total_expenses: Optional[float] = None
    analysis: Optional[str] = None
    status: Optional[str] = None


class VisaOut(BaseModel):
    id: int
    agent_id: int
    passenger_name: str
    passport_number: str
    phone: str
    occupation: str
    visa_type: str
    package: str
    total_charges: float
    package_price: float
    total_commission: float
    payment_received: float
    payment_type: str
    payment_cash: float
    payment_bank: float
    total_expenses: float
    analysis: str
    status: str
    created_at: datetime
    agent_name: str = ""

    class Config:
        from_attributes = True


# Cash Out
class CashOutCreate(BaseModel):
    agent_id: Optional[int] = None
    visa_id: Optional[int] = None
    ticket_id: Optional[int] = None
    name: str
    amount: float = 0.0
    date: str
    payment_method: str = "cash"
    comments: str = ""


class CashOutUpdate(BaseModel):
    agent_id: Optional[int] = None
    visa_id: Optional[int] = None
    ticket_id: Optional[int] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    payment_method: Optional[str] = None
    comments: Optional[str] = None


class CashOutOut(BaseModel):
    id: int
    agent_id: Optional[int]
    visa_id: Optional[int]
    ticket_id: Optional[int]
    name: str
    amount: float
    date: str
    payment_method: str
    comments: str
    created_at: datetime
    agent_name: str = ""

    class Config:
        from_attributes = True


# Settings
class SettingCreate(BaseModel):
    key: str
    value: str


class SettingOut(BaseModel):
    id: int
    key: str
    value: str

    class Config:
        from_attributes = True


# Dashboard
class DashboardStats(BaseModel):
    total_tickets: int
    total_visas: int
    total_agents: int
    total_revenue: float
    total_commission: float
    total_expenses: float
    pending_payments: float
    recent_tickets: list
    recent_visas: list
