from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.app.models import UserRole, UserStatus, BookingStatus, PaymentStatus, KYCStatus, ComplaintStatus

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserRegister(BaseModel):
    email: str
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    full_name: str
    company_name: Optional[str] = None # For providers
    experience_years: Optional[int] = 1 # For providers
    skill_specialization: Optional[str] = None # For technicians

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str]
    role: str
    status: str
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Customer Schemas
class CustomerAddressCreate(BaseModel):
    title: str = "Home"
    street_address: str
    city: str
    state: str
    postal_code: str
    landmark: Optional[str] = None
    is_default: bool = False

class CustomerAddressResponse(BaseModel):
    id: int
    title: str
    street_address: str
    city: str
    state: str
    postal_code: str
    landmark: Optional[str]
    is_default: bool

    class Config:
        from_attributes = True

# Service & Category Schemas
class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: str = "Wrench"
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    description: Optional[str]
    is_active: bool
    display_order: int

    class Config:
        from_attributes = True

class ServiceCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    base_price: float
    image_url: Optional[str] = None
    is_active: bool = True

class ServiceResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    base_price: float
    image_url: Optional[str]
    is_active: bool
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# Booking Schemas
class BookingCreate(BaseModel):
    provider_id: int
    service_id: int
    address_id: int
    booking_date: str # YYYY-MM-DD
    time_slot: str # "10:00 AM - 12:00 PM"
    special_instructions: Optional[str] = None
    coupon_code: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    notes: Optional[str] = None

class AssignTechnicianRequest(BaseModel):
    technician_id: int
    remarks: Optional[str] = None

class TechnicianStatusUpdate(BaseModel):
    status: str # ARRIVED, IN_PROGRESS, COMPLETED
    remarks: Optional[str] = None
    image_url: Optional[str] = None # completion photo

# Payment & Checkout Schemas
class PaymentInitiateRequest(BaseModel):
    booking_id: int
    payment_method: str = "RAZORPAY_TEST"

class PaymentVerifyRequest(BaseModel):
    booking_id: int
    gateway_payment_id: str
    gateway_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

# Review & Complaint Schemas
class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: Optional[str] = None

class ReviewReply(BaseModel):
    provider_reply: str

class ComplaintCreate(BaseModel):
    booking_id: int
    subject: str
    description: str
    priority: str = "MEDIUM"

class ComplaintResolve(BaseModel):
    status: ComplaintStatus
    resolution_notes: str

# Coupon Schemas
class CouponValidate(BaseModel):
    code: str
    order_amount: float
