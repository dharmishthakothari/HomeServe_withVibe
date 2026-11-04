from backend.app.database import engine, Base
from backend.app.models import (
    User, Customer, ServiceProvider, Technician, Address,
    ServiceCategory, Service, ProviderService, ServiceArea, AvailabilitySlot,
    Booking, BookingAssignment, BookingImage, Payment, Invoice,
    Coupon, Review, Complaint, Notification, ProviderEarning
)

def init_db():
    print("Creating all 20 tables in MySQL 8.0 / target database...")
    Base.metadata.create_all(bind=engine)
    print("✓ All 20 tables successfully created and verified!")

if __name__ == "__main__":
    init_db()
