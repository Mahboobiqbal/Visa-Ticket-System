from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


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
    commission_rate: float = Field(default=10.0, ge=0, le=100)
    status: Literal["active", "inactive"] = "active"


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    commission_rate: Optional[float] = Field(default=None, ge=0, le=100)
    status: Optional[Literal["active", "inactive"]] = None


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
    agent_id: int = Field(gt=0)
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
    ticket_price: float = Field(default=0.0, ge=0)
    selling_price: float = Field(default=0.0, ge=0)
    commission: float = Field(default=0.0, ge=0)
    payment_received: float = Field(default=0.0, ge=0)
    payment_status: Literal["pending", "paid", "partial"] = "pending"
    notes: str = ""


class TicketUpdate(BaseModel):
    agent_id: Optional[int] = Field(default=None, gt=0)
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
    ticket_price: Optional[float] = Field(default=None, ge=0)
    selling_price: Optional[float] = Field(default=None, ge=0)
    commission: Optional[float] = Field(default=None, ge=0)
    payment_received: Optional[float] = Field(default=None, ge=0)
    payment_status: Optional[Literal["pending", "paid", "partial"]] = None
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
    agent_id: int = Field(gt=0)
    passenger_name: str
    passport_number: str = ""
    phone: str = ""
    occupation: str = ""
    visa_type: str = "umrah"
    package: str = "basic"
    total_charges: float = Field(default=0.0, ge=0)
    package_price: float = Field(default=0.0, ge=0)
    total_commission: float = Field(default=0.0, ge=0)
    payment_received: float = Field(default=0.0, ge=0)
    payment_type: Literal["cash", "online_bank"] = "cash"
    payment_cash: float = Field(default=0.0, ge=0)
    payment_bank: float = Field(default=0.0, ge=0)
    total_expenses: float = Field(default=0.0, ge=0)
    analysis: str = ""
    status: Literal["pending", "approved", "rejected"] = "pending"


class VisaUpdate(BaseModel):
    agent_id: Optional[int] = Field(default=None, gt=0)
    passenger_name: Optional[str] = None
    passport_number: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    visa_type: Optional[str] = None
    package: Optional[str] = None
    total_charges: Optional[float] = Field(default=None, ge=0)
    package_price: Optional[float] = Field(default=None, ge=0)
    total_commission: Optional[float] = Field(default=None, ge=0)
    payment_received: Optional[float] = Field(default=None, ge=0)
    payment_type: Optional[Literal["cash", "online_bank"]] = None
    payment_cash: Optional[float] = Field(default=None, ge=0)
    payment_bank: Optional[float] = Field(default=None, ge=0)
    total_expenses: Optional[float] = Field(default=None, ge=0)
    analysis: Optional[str] = None
    status: Optional[Literal["pending", "approved", "rejected"]] = None


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
    agent_id: Optional[int] = Field(default=None, gt=0)
    visa_id: Optional[int] = Field(default=None, gt=0)
    ticket_id: Optional[int] = Field(default=None, gt=0)
    name: str
    amount: float = Field(default=0.0, ge=0)
    date: str
    payment_method: Literal["cash", "online_bank"] = "cash"
    comments: str = ""


class CashOutUpdate(BaseModel):
    agent_id: Optional[int] = Field(default=None, gt=0)
    visa_id: Optional[int] = Field(default=None, gt=0)
    ticket_id: Optional[int] = Field(default=None, gt=0)
    name: Optional[str] = None
    amount: Optional[float] = Field(default=None, ge=0)
    date: Optional[str] = None
    payment_method: Optional[Literal["cash", "online_bank"]] = None
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
