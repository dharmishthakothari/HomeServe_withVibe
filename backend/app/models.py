import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime,
    ForeignKey, Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"
    PROVIDER = "PROVIDER"
    TECHNICIAN = "TECHNICIAN"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    SUSPENDED = "SUSPENDED"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROVIDER_ASSIGNED = "PROVIDER_ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

# 1. USERS
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(190), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer_profile = relationship("Customer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    provider_profile = relationship("ServiceProvider", back_populates="user", uselist=False, cascade="all, delete-orphan")
    technician_profile = relationship("Technician", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# 2. CUSTOMERS
class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    default_address_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="customer_profile")
    addresses = relationship("Address", back_populates="customer", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")
    complaints = relationship("Complaint", back_populates="customer")

# 3. SERVICE PROVIDERS
class ServiceProvider(Base):
    __tablename__ = "service_providers"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    business_reg_no = Column(String(100), nullable=True)
    experience_years = Column(Integer, default=1)
    bio = Column(Text, nullable=True)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING)
    id_proof_url = Column(String(500), nullable=True)
    commission_rate = Column(Float, default=10.0) # 10% platform commission
    avg_rating = Column(Float, default=5.0)
    total_reviews = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="provider_profile")
    technicians = relationship("Technician", back_populates="provider", cascade="all, delete-orphan")
    provider_services = relationship("ProviderService", back_populates="provider", cascade="all, delete-orphan")
    service_areas = relationship("ServiceArea", back_populates="provider", cascade="all, delete-orphan")
    availability_slots = relationship("AvailabilitySlot", back_populates="provider", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="provider")
    reviews = relationship("Review", back_populates="provider")
    earnings = relationship("ProviderEarning", back_populates="provider")

# 4. TECHNICIANS
class Technician(Base):
    __tablename__ = "technicians"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(150), nullable=False)
    skill_specialization = Column(String(150), nullable=True)
    is_available = Column(Boolean, default=True)
    jobs_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="technician_profile")
    provider = relationship("ServiceProvider", back_populates="technicians")
    assignments = relationship("BookingAssignment", back_populates="technician")

# 5. ADDRESSES
class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), default="Home") # Home, Office, etc.
    street_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    landmark = Column(String(150), nullable=True)
    is_default = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="addresses")

# 6. SERVICE CATEGORIES
class ServiceCategory(Base):
    __tablename__ = "service_categories"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), default="Wrench")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")

# 7. SERVICES
class Service(Base):
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=60)
    base_price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    category = relationship("ServiceCategory", back_populates="services")
    provider_services = relationship("ProviderService", back_populates="service", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service")

# 8. PROVIDER SERVICES
class ProviderService(Base):
    __tablename__ = "provider_services"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    custom_price = Column(Float, nullable=True)
    is_available = Column(Boolean, default=True)
    
    __table_args__ = (UniqueConstraint("provider_id", "service_id", name="uq_provider_service"),)
    
    provider = relationship("ServiceProvider", back_populates="provider_services")
    service = relationship("Service", back_populates="provider_services")

# 9. SERVICE AREAS
class ServiceArea(Base):
    __tablename__ = "service_areas"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=True)
    radius_km = Column(Float, default=15.0)
    
    provider = relationship("ServiceProvider", back_populates="service_areas")

# 10. AVAILABILITY SLOTS
class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday...
    start_time = Column(String(10), nullable=False) # "09:00"
    end_time = Column(String(10), nullable=False) # "18:00"
    max_concurrent_bookings = Column(Integer, default=2)
    
    provider = relationship("ServiceProvider", back_populates="availability_slots")

# 11. BOOKINGS
class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_code = Column(String(30), unique=True, index=True, nullable=False) # e.g. HS-2026-0001
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    booking_date = Column(String(20), nullable=False) # YYYY-MM-DD
    time_slot = Column(String(50), nullable=False) # "10:00 AM - 12:00 PM"
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    platform_fee = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    special_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="bookings")
    provider = relationship("ServiceProvider", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    address = relationship("Address")
    assignment = relationship("BookingAssignment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    images = relationship("BookingImage", back_populates="booking", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="booking", cascade="all, delete-orphan")
    earning = relationship("ProviderEarning", back_populates="booking", uselist=False, cascade="all, delete-orphan")

# 12. BOOKING ASSIGNMENTS (Technician assignment & arrival tracking)
class BookingAssignment(Base):
    __tablename__ = "booking_assignments"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id", ondelete="RESTRICT"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    arrival_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="ASSIGNED") # ASSIGNED, ARRIVED, IN_PROGRESS, COMPLETED
    remarks = Column(Text, nullable=True)
    
    booking = relationship("Booking", back_populates="assignment")
    technician = relationship("Technician", back_populates="assignments")

# 13. BOOKING IMAGES (Problem reference, before & after work photos)
class BookingImage(Base):
    __tablename__ = "booking_images"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(String(30), nullable=False) # PROBLEM, BEFORE, AFTER
    image_url = Column(String(500), nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    booking = relationship("Booking", back_populates="images")

# 14. PAYMENTS
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    payment_method = Column(String(50), default="RAZORPAY_TEST") # RAZORPAY_TEST, CARD, UPI, COD
    gateway_order_id = Column(String(100), nullable=True)
    gateway_payment_id = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    paid_at = Column(DateTime, nullable=True)
    failure_reason = Column(String(255), nullable=True)
    
    booking = relationship("Booking", back_populates="payment")

# 15. INVOICES
class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False) # INV-2026-0001
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0) # 18% GST / Tax
    total_amount = Column(Float, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    status = Column(String(30), default="PAID")
    
    booking = relationship("Booking", back_populates="invoice")

# 16. COUPONS
class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_type = Column(String(20), default="PERCENTAGE") # PERCENTAGE, FIXED
    discount_value = Column(Float, nullable=False) # e.g. 15 (%) or 200 (flat)
    min_order_value = Column(Float, default=0.0)
    max_discount = Column(Float, default=500.0)
    valid_until = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

# 17. REVIEWS
class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    comment = Column(Text, nullable=True)
    provider_reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    booking = relationship("Booking", back_populates="review")
    customer = relationship("Customer", back_populates="reviews")
    provider = relationship("ServiceProvider", back_populates="reviews")

# 18. COMPLAINTS & DISPUTES
class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    booking = relationship("Booking", back_populates="complaints")
    customer = relationship("Customer", back_populates="complaints")

# 19. NOTIFICATIONS
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="BOOKING_UPDATE")
    is_read = Column(Boolean, default=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")

# 20. PROVIDER EARNINGS
class ProviderEarning(Base):
    __tablename__ = "provider_earnings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    gross_amount = Column(Float, nullable=False)
    commission_cut = Column(Float, nullable=False) # e.g. 10%
    net_payout = Column(Float, nullable=False) # gross - commission
    payout_status = Column(String(30), default="PENDING") # PENDING, SETTLED, ON_HOLD
    settled_at = Column(DateTime, nullable=True)
    
    provider = relationship("ServiceProvider", back_populates="earnings")
    booking = relationship("Booking", back_populates="earning")
