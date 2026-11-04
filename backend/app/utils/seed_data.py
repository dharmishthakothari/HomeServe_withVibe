import sys
import os
from datetime import datetime, timedelta

from backend.app.database import SessionLocal, engine, Base
from backend.app.auth import get_password_hash
from backend.app.models import (
    User, Customer, ServiceProvider, Technician, Address,
    ServiceCategory, Service, ProviderService, ServiceArea, AvailabilitySlot,
    Booking, BookingAssignment, BookingImage, Payment, Invoice,
    Coupon, Review, Complaint, Notification, ProviderEarning,
    UserRole, UserStatus, BookingStatus, PaymentStatus, KYCStatus, ComplaintStatus
)

def run_seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_admin = db.query(User).filter(User.email == "admin@homeserve.com").first()
        if existing_admin:
            print("Database already contains seed data. Refreshing seed...")
            # We can delete and re-seed cleanly
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        print("Seeding Users...")
        # 1. Super Admin
        admin_user = User(
            email="admin@homeserve.com",
            phone="9876543210",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        db.add(admin_user)
        
        # 2. Customer: Rahul Sharma
        cust_user = User(
            email="customer@homeserve.com",
            phone="9876543211",
            hashed_password=get_password_hash("cust123"),
            role=UserRole.CUSTOMER,
            status=UserStatus.ACTIVE
        )
        db.add(cust_user)
        
        # 3. Customer 2: Priya Patel
        cust2_user = User(
            email="priya@example.com",
            phone="9876543212",
            hashed_password=get_password_hash("cust123"),
            role=UserRole.CUSTOMER,
            status=UserStatus.ACTIVE
        )
        db.add(cust2_user)
        
        # 4. Service Provider: Apex Pro
        prov_user = User(
            email="provider@homeserve.com",
            phone="9876543213",
            hashed_password=get_password_hash("prov123"),
            role=UserRole.PROVIDER,
            status=UserStatus.ACTIVE
        )
        db.add(prov_user)

        # 5. Service Provider 2: AquaFlow
        prov2_user = User(
            email="plumb.expert@homeserve.com",
            phone="9876543214",
            hashed_password=get_password_hash("prov123"),
            role=UserRole.PROVIDER,
            status=UserStatus.ACTIVE
        )
        db.add(prov2_user)

        # 6. Service Provider 3: SparkleClean
        prov3_user = User(
            email="clean.elite@homeserve.com",
            phone="9876543215",
            hashed_password=get_password_hash("prov123"),
            role=UserRole.PROVIDER,
            status=UserStatus.ACTIVE
        )
        db.add(prov3_user)

        # 7. Technician: Vikram Singh (Apex Pro)
        tech_user = User(
            email="tech@homeserve.com",
            phone="9876543216",
            hashed_password=get_password_hash("tech123"),
            role=UserRole.TECHNICIAN,
            status=UserStatus.ACTIVE
        )
        db.add(tech_user)

        # 8. Technician 2: Amit Verma (AquaFlow)
        tech2_user = User(
            email="tech2@homeserve.com",
            phone="9876543217",
            hashed_password=get_password_hash("tech123"),
            role=UserRole.TECHNICIAN,
            status=UserStatus.ACTIVE
        )
        db.add(tech2_user)

        db.commit()

        # Seed Customer Profiles
        cust_profile = Customer(
            user_id=cust_user.id,
            full_name="Rahul Sharma",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
        )
        db.add(cust_profile)

        cust2_profile = Customer(
            user_id=cust2_user.id,
            full_name="Priya Patel",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
        )
        db.add(cust2_profile)
        db.commit()

        # Seed Customer Addresses
        addr1 = Address(
            customer_id=cust_profile.id,
            title="Apartment / Home",
            street_address="Flat 402, Sea Breeze Residency, Carter Road",
            city="Mumbai",
            state="Maharashtra",
            postal_code="400050",
            landmark="Near Joggers Park",
            is_default=True
        )
        addr2 = Address(
            customer_id=cust_profile.id,
            title="Office Studio",
            street_address="Unit 12B, Apex Tech Park, Andheri East",
            city="Mumbai",
            state="Maharashtra",
            postal_code="400069",
            landmark="Opposite Metro Station",
            is_default=False
        )
        addr3 = Address(
            customer_id=cust2_profile.id,
            title="Home",
            street_address="Villa 8, Orchid Greens, Baner",
            city="Pune",
            state="Maharashtra",
            postal_code="411045",
            landmark="Near High Street",
            is_default=True
        )
        db.add_all([addr1, addr2, addr3])
        db.commit()

        # Seed Service Providers
        prov1 = ServiceProvider(
            user_id=prov_user.id,
            company_name="Apex Pro Home & Electricals",
            business_reg_no="MH-MUM-2021-9921",
            experience_years=8,
            bio="Licensed master electricians and HVAC specialists providing fast, certified same-day home repairs with 30-day warranty.",
            kyc_status=KYCStatus.APPROVED,
            id_proof_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
            commission_rate=10.0,
            avg_rating=4.9,
            total_reviews=48,
            is_verified=True
        )
        prov2 = ServiceProvider(
            user_id=prov2_user.id,
            company_name="AquaFlow Plumbing Masters",
            business_reg_no="MH-PUN-2022-4412",
            experience_years=6,
            bio="Emergency pipe repair, tap leakages, sanitary fittings, and high-pressure jet unclogging experts.",
            kyc_status=KYCStatus.APPROVED,
            id_proof_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
            commission_rate=10.0,
            avg_rating=4.8,
            total_reviews=32,
            is_verified=True
        )
        prov3 = ServiceProvider(
            user_id=prov3_user.id,
            company_name="SparkleClean Facility Care",
            business_reg_no="MH-MUM-2023-8831",
            experience_years=4,
            bio="Eco-friendly residential deep cleaning, sofa sanitization, bathroom scrubbing, and kitchen chimney de-greasing.",
            kyc_status=KYCStatus.PENDING,
            id_proof_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
            commission_rate=12.0,
            avg_rating=4.7,
            total_reviews=19,
            is_verified=False
        )
        db.add_all([prov1, prov2, prov3])
        db.commit()

        # Seed Technicians
        tech1 = Technician(
            user_id=tech_user.id,
            provider_id=prov1.id,
            full_name="Vikram Singh",
            skill_specialization="Certified Electrician & Inverter HVAC Tech",
            is_available=True,
            jobs_completed=124
        )
        tech2 = Technician(
            user_id=tech2_user.id,
            provider_id=prov2.id,
            full_name="Amit Verma",
            skill_specialization="Senior Plumbing & Sanitary Specialist",
            is_available=True,
            jobs_completed=88
        )
        db.add_all([tech1, tech2])
        db.commit()

        # Seed Service Categories
        categories_data = [
            ("Electrical Services", "electrical-services", "Zap", "Fan, light, switchboard repairs, short circuit fixes and rewiring.", 1),
            ("Plumbing Services", "plumbing-services", "Droplets", "Tap leaks, pipe replacements, drain unclogging and sanitary fittings.", 2),
            ("AC Repair & Maintenance", "ac-repair-maintenance", "Wind", "AC jet pump servicing, gas charging, cooling issues and PCB diagnostics.", 3),
            ("Home Cleaning", "home-cleaning", "Sparkles", "Deep house cleaning, sofa/carpet shampooing and kitchen sanitization.", 4),
            ("Painting Services", "painting-services", "Paintbrush", "Interior/exterior wall painting, waterproof coating and texture designs.", 5),
            ("Carpentry Services", "carpentry-services", "Hammer", "Furniture assembly, door lock fixing, cabinet hinges and custom wood repairs.", 6),
            ("Appliance Repair", "appliance-repair", "Tv", "Washing machine, refrigerator, microwave and TV troubleshooting.", 7),
            ("Pest Control", "pest-control", "ShieldCheck", "Cockroach, bedbug, termite and mosquito herbal extermination.", 8),
        ]
        cat_objs = []
        for name, slug, icon, desc, order in categories_data:
            c = ServiceCategory(name=name, slug=slug, icon=icon, description=desc, display_order=order, is_active=True)
            db.add(c)
            cat_objs.append(c)
        db.commit()

        # Seed Services
        services_data = [
            (cat_objs[0].id, "Ceiling & Exhaust Fan Installation", "Installation or repair of high-speed ceiling fans and exhaust fans with regulator testing.", 45, 299.0, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[0].id, "Switchboard & MCB Fuse Replacement", "Repair of burnt switch sockets, MCB trip diagnostics and smart switch upgrades.", 60, 449.0, "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[1].id, "Tap & Flush Valve Leakage Repair", "Fixing dripping taps, sink mixer issues, angle valves and dual-flush tank repair.", 40, 349.0, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[1].id, "Complete Drain Unclogging & Jet Clean", "Motorized drain snake and chemical flushing for blocked bathroom/kitchen sinks.", 60, 599.0, "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[2].id, "AC Deep Jet Servicing (Indoor & Outdoor)", "High-pressure jet wash of cooling coils, filter sanitization and gas leak test.", 75, 799.0, "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[2].id, "AC Gas Charging & Refrigerant Refill", "R32 / R410 refrigerant recharge with vacuuming and pressure gauge check.", 90, 1499.0, "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[3].id, "2BHK / 3BHK Deep Home Cleaning", "Complete floor machine buffing, cobweb removal, kitchen de-greasing and bathroom scrub.", 180, 2499.0, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[3].id, "5-Seater Sofa & Carpet Shampooing", "Dry-wet steam extraction to eliminate dust mites, stains and odors.", 90, 899.0, "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[4].id, "Room Repainting & Touch-Up Service", "Waterproof primer, wall putty sanding, and 2 coats of premium emulsion paint.", 240, 3499.0, "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[5].id, "Modular Furniture Assembly & Repair", "Precision assembly of IKEA/bed/wardrobes, hinge realignment and drawer slides.", 90, 699.0, "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[6].id, "Washing Machine Drum & Motor Diagnostics", "Front-load & top-load spin errors, inlet valve repair and belt adjustments.", 60, 499.0, "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80"),
            (cat_objs[7].id, "Eco Herbal Pest & Cockroach Shield", "Odorless herbal gel baiting and spray with 90-day pest recurrence warranty.", 60, 1199.0, "https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=600&q=80"),
        ]
        service_objs = []
        for cat_id, name, desc, duration, price, img in services_data:
            s = Service(
                category_id=cat_id,
                name=name,
                description=desc,
                duration_minutes=duration,
                base_price=price,
                image_url=img,
                is_active=True
            )
            db.add(s)
            service_objs.append(s)
        db.commit()

        # Seed Provider Services
        # Apex Pro offers Electrical & AC services
        ps1 = ProviderService(provider_id=prov1.id, service_id=service_objs[0].id, custom_price=279.0, is_available=True)
        ps2 = ProviderService(provider_id=prov1.id, service_id=service_objs[1].id, custom_price=429.0, is_available=True)
        ps3 = ProviderService(provider_id=prov1.id, service_id=service_objs[4].id, custom_price=749.0, is_available=True)
        ps4 = ProviderService(provider_id=prov1.id, service_id=service_objs[5].id, custom_price=1399.0, is_available=True)
        # AquaFlow offers Plumbing
        ps5 = ProviderService(provider_id=prov2.id, service_id=service_objs[2].id, custom_price=329.0, is_available=True)
        ps6 = ProviderService(provider_id=prov2.id, service_id=service_objs[3].id, custom_price=549.0, is_available=True)
        # SparkleClean offers Cleaning
        ps7 = ProviderService(provider_id=prov3.id, service_id=service_objs[6].id, custom_price=2299.0, is_available=True)
        ps8 = ProviderService(provider_id=prov3.id, service_id=service_objs[7].id, custom_price=849.0, is_available=True)
        db.add_all([ps1, ps2, ps3, ps4, ps5, ps6, ps7, ps8])
        db.commit()

        # Seed Service Areas
        area1 = ServiceArea(provider_id=prov1.id, city="Mumbai", postal_code="400050", radius_km=25.0)
        area2 = ServiceArea(provider_id=prov2.id, city="Mumbai", postal_code="400001", radius_km=20.0)
        area3 = ServiceArea(provider_id=prov3.id, city="Mumbai", postal_code="400070", radius_km=30.0)
        db.add_all([area1, area2, area3])

        # Seed Availability Slots (Monday to Sunday)
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for p in [prov1, prov2, prov3]:
            for d in days:
                db.add(AvailabilitySlot(
                    provider_id=p.id,
                    day_of_week=d,
                    start_time="09:00",
                    end_time="19:00",
                    max_concurrent_bookings=3
                ))
        db.commit()

        # Seed Coupons
        c1 = Coupon(
            code="WELCOME100",
            discount_type="FIXED",
            discount_value=100.0,
            min_order_value=299.0,
            max_discount=100.0,
            valid_until=datetime.utcnow() + timedelta(days=90),
            is_active=True
        )
        c2 = Coupon(
            code="HORIZON20",
            discount_type="PERCENTAGE",
            discount_value=20.0,
            min_order_value=500.0,
            max_discount=300.0,
            valid_until=datetime.utcnow() + timedelta(days=90),
            is_active=True
        )
        c3 = Coupon(
            code="FESTIVE50",
            discount_type="PERCENTAGE",
            discount_value=50.0,
            min_order_value=1000.0,
            max_discount=500.0,
            valid_until=datetime.utcnow() + timedelta(days=90),
            is_active=True
        )
        db.add_all([c1, c2, c3])
        db.commit()

        # Seed Bookings with Full Workflows
        today = datetime.utcnow().strftime("%Y-%m-%d")
        yesterday = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")
        tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

        # Booking 1: COMPLETED (AC Deep Jet Servicing)
        b1 = Booking(
            booking_code="HS-2026-101",
            customer_id=cust_profile.id,
            provider_id=prov1.id,
            service_id=service_objs[4].id,
            address_id=addr1.id,
            booking_date=yesterday,
            time_slot="10:00 AM - 12:00 PM",
            status=BookingStatus.COMPLETED,
            subtotal=749.0,
            discount=100.0,
            platform_fee=30.0,
            total_amount=679.0,
            special_instructions="Please check cooling coils in master bedroom split AC."
        )
        db.add(b1)
        db.commit()

        # Assignment for b1
        ba1 = BookingAssignment(
            booking_id=b1.id,
            technician_id=tech1.id,
            assigned_at=datetime.utcnow() - timedelta(days=2, hours=3),
            arrival_at=datetime.utcnow() - timedelta(days=2, hours=2),
            completed_at=datetime.utcnow() - timedelta(days=2, hours=1),
            status="COMPLETED",
            remarks="AC jet cleaned thoroughly. Replaced filter mesh and verified cooling temp at 18C."
        )
        db.add(ba1)

        # Before & After Images for b1
        bi1 = BookingImage(
            booking_id=b1.id,
            image_type="BEFORE",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
            notes="Dust clogged evaporator coil before jet wash."
        )
        bi2 = BookingImage(
            booking_id=b1.id,
            image_type="AFTER",
            image_url="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80",
            notes="Spotless sanitized coil with optimal airflow."
        )
        db.add_all([bi1, bi2])

        # Payment for b1
        pay1 = Payment(
            booking_id=b1.id,
            payment_method="RAZORPAY_TEST",
            gateway_order_id="order_Nq99a18HSB21",
            gateway_payment_id="pay_Nq99b99TEST01",
            amount=679.0,
            currency="INR",
            status=PaymentStatus.PAID,
            paid_at=datetime.utcnow() - timedelta(days=2, hours=1)
        )
        db.add(pay1)

        # Invoice for b1
        inv1 = Invoice(
            invoice_number="INV-2026-0001",
            booking_id=b1.id,
            issue_date=datetime.utcnow() - timedelta(days=2, hours=1),
            subtotal=749.0,
            discount=100.0,
            tax_amount=103.5,
            total_amount=679.0,
            pdf_url="/api/invoices/INV-2026-0001/download",
            status="PAID"
        )
        db.add(inv1)

        # Review for b1
        rev1 = Review(
            booking_id=b1.id,
            customer_id=cust_profile.id,
            provider_id=prov1.id,
            rating=5,
            comment="Vikram arrived precisely on time with clean shoe covers and proper jet tools. My AC is cooling like brand new!",
            provider_reply="Thank you so much Rahul! We look forward to keeping your home comfortable all summer."
        )
        db.add(rev1)

        # Provider Earning for b1
        earn1 = ProviderEarning(
            provider_id=prov1.id,
            booking_id=b1.id,
            gross_amount=679.0,
            commission_cut=67.9,
            net_payout=611.1,
            payout_status="SETTLED",
            settled_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(earn1)

        # Booking 2: IN_PROGRESS (Switchboard replacement)
        b2 = Booking(
            booking_code="HS-2026-102",
            customer_id=cust_profile.id,
            provider_id=prov1.id,
            service_id=service_objs[1].id,
            address_id=addr1.id,
            booking_date=today,
            time_slot="02:00 PM - 04:00 PM",
            status=BookingStatus.IN_PROGRESS,
            subtotal=429.0,
            discount=0.0,
            platform_fee=25.0,
            total_amount=454.0,
            special_instructions="Living room main switchboard sparks occasionally."
        )
        db.add(b2)
        db.commit()

        ba2 = BookingAssignment(
            booking_id=b2.id,
            technician_id=tech1.id,
            assigned_at=datetime.utcnow() - timedelta(hours=2),
            arrival_at=datetime.utcnow() - timedelta(minutes=25),
            status="ARRIVED",
            remarks="Arrived on site. Testing live voltage and ground wiring."
        )
        db.add(ba2)

        # Problem photo for b2
        bi3 = BookingImage(
            booking_id=b2.id,
            image_type="PROBLEM",
            image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
            notes="Sparks detected behind socket panel."
        )
        db.add(bi3)

        # Payment for b2 (pending or advance paid)
        pay2 = Payment(
            booking_id=b2.id,
            payment_method="RAZORPAY_TEST",
            gateway_order_id="order_Nq99a18HSB22",
            gateway_payment_id="pay_Nq99b99TEST02",
            amount=454.0,
            currency="INR",
            status=PaymentStatus.PAID,
            paid_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(pay2)

        # Booking 3: CONFIRMED (Tap & Flush Valve Leakage Repair)
        b3 = Booking(
            booking_code="HS-2026-103",
            customer_id=cust_profile.id,
            provider_id=prov2.id,
            service_id=service_objs[2].id,
            address_id=addr2.id,
            booking_date=tomorrow,
            time_slot="11:00 AM - 01:00 PM",
            status=BookingStatus.CONFIRMED,
            subtotal=329.0,
            discount=0.0,
            platform_fee=20.0,
            total_amount=349.0,
            special_instructions="Office washroom flush tank leaking continuously."
        )
        db.add(b3)
        db.commit()

        # Booking 4: PENDING (Deep Home Cleaning by Priya Patel)
        b4 = Booking(
            booking_code="HS-2026-104",
            customer_id=cust2_profile.id,
            provider_id=prov3.id,
            service_id=service_objs[6].id,
            address_id=addr3.id,
            booking_date=tomorrow,
            time_slot="09:00 AM - 12:00 PM",
            status=BookingStatus.PENDING,
            subtotal=2299.0,
            discount=300.0,
            platform_fee=50.0,
            total_amount=2049.0,
            special_instructions="Need heavy kitchen chimney and tile degreasing."
        )
        db.add(b4)
        db.commit()

        # Seed Sample Complaint
        comp1 = Complaint(
            booking_id=b1.id,
            customer_id=cust_profile.id,
            subject="Technician arrived 10 mins earlier than slot",
            description="Just a minor note: technician arrived at 9:50 AM instead of 10:00 AM. Excellent service overall though!",
            priority="LOW",
            status=ComplaintStatus.RESOLVED,
            resolution_notes="Contacted customer and technician. Customer was satisfied with early completion."
        )
        db.add(comp1)

        # Seed Notifications
        notifications = [
            Notification(
                user_id=cust_user.id,
                title="Technician Arrived!",
                message="Vikram Singh has arrived at your address for Switchboard Replacement (HS-2026-102).",
                notification_type="TECHNICIAN_ARRIVAL"
            ),
            Notification(
                user_id=cust_user.id,
                title="Service Completed & Invoice Ready",
                message="Your AC Deep Jet Servicing (HS-2026-101) is completed. Invoice INV-2026-0001 is ready for download.",
                notification_type="INVOICE_GENERATED"
            ),
            Notification(
                user_id=prov_user.id,
                title="New Booking Request Received",
                message="Booking HS-2026-102 has been confirmed by Rahul Sharma.",
                notification_type="BOOKING_NEW"
            ),
            Notification(
                user_id=tech_user.id,
                title="Job Assigned",
                message="You have been assigned job HS-2026-102 at Sea Breeze Residency, Carter Road.",
                notification_type="JOB_ASSIGNED"
            ),
            Notification(
                user_id=admin_user.id,
                title="New Provider KYC Awaiting Review",
                message="SparkleClean Facility Care submitted documents for verification.",
                notification_type="ADMIN_KYC"
            )
        ]
        db.add_all(notifications)
        db.commit()

        print("Database successfully seeded with realistic multi-role data!")
    except Exception as e:
        db.rollback()
        print("Error during seed:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
