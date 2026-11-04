import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User, Customer, ServiceProvider, Service, Address, Booking,
    BookingAssignment, BookingImage, Payment, Invoice, Coupon,
    Notification, BookingStatus, PaymentStatus, UserRole
)
from backend.app.auth import get_current_user, require_role
from backend.app.schemas import (
    BookingCreate, BookingStatusUpdate, AssignTechnicianRequest
)

router = APIRouter(prefix="/bookings", tags=["Booking & Appointment Management"])

@router.post("", status_code=201)
def create_booking(booking_in: BookingCreate, current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=400, detail="Customer profile required to book")
        
    # 1. Verify Service & Provider
    service = db.query(Service).filter(Service.id == booking_in.service_id).first()
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Service not found or inactive")
        
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == booking_in.provider_id).first()
    if not provider or not provider.is_verified:
        raise HTTPException(status_code=400, detail="Selected service provider is not verified or available")
        
    # 2. Verify Address belongs to customer
    address = db.query(Address).filter(Address.id == booking_in.address_id, Address.customer_id == cust.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Selected delivery address not found")
        
    # 3. Double Booking Prevention Guard:
    # Check if this provider already has an active booking on the exact date and slot
    conflict = db.query(Booking).filter(
        Booking.provider_id == provider.id,
        Booking.booking_date == booking_in.booking_date,
        Booking.time_slot == booking_in.time_slot,
        Booking.status.notin_([BookingStatus.CANCELLED, BookingStatus.REJECTED])
    ).first()
    
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Time slot '{booking_in.time_slot}' on {booking_in.booking_date} is already reserved for this provider. Please pick another slot."
        )
        
    # 4. Pricing calculation
    subtotal = service.base_price
    # Check if provider has custom price
    for ps in provider.provider_services:
        if ps.service_id == service.id and ps.custom_price:
            subtotal = ps.custom_price
            break
            
    discount = 0.0
    if booking_in.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == booking_in.coupon_code.upper(), Coupon.is_active == True).first()
        if coupon and subtotal >= coupon.min_order_value:
            if coupon.discount_type == "PERCENTAGE":
                calc = (subtotal * coupon.discount_value) / 100.0
                discount = min(calc, coupon.max_discount)
            else:
                discount = min(coupon.discount_value, coupon.max_discount)
            coupon.usage_count += 1
            
    platform_fee = 29.0
    total_amount = max(0.0, round(subtotal - discount + platform_fee, 2))
    
    # 5. Generate Unique Booking Code
    year = datetime.utcnow().year
    random_suffix = random.randint(1000, 9999)
    code = f"HS-{year}-{random_suffix}"
    while db.query(Booking).filter(Booking.booking_code == code).first():
        code = f"HS-{year}-{random.randint(1000, 9999)}"
        
    new_booking = Booking(
        booking_code=code,
        customer_id=cust.id,
        provider_id=provider.id,
        service_id=service.id,
        address_id=address.id,
        booking_date=booking_in.booking_date,
        time_slot=booking_in.time_slot,
        status=BookingStatus.PENDING,
        subtotal=subtotal,
        discount=round(discount, 2),
        platform_fee=platform_fee,
        total_amount=total_amount,
        special_instructions=booking_in.special_instructions
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    # Create initial Payment record (Pending)
    pay = Payment(
        booking_id=new_booking.id,
        payment_method="RAZORPAY_TEST",
        gateway_order_id=f"order_{code.replace('-', '')}",
        amount=total_amount,
        status=PaymentStatus.PENDING
    )
    db.add(pay)
    
    # Send Notifications
    db.add(Notification(
        user_id=provider.user_id,
        title="New Booking Request!",
        message=f"New booking {code} for {service.name} on {booking_in.booking_date} ({booking_in.time_slot}).",
        notification_type="BOOKING_NEW"
    ))
    db.add(Notification(
        user_id=current_user.id,
        title="Booking Placed Successfully",
        message=f"Your booking {code} has been created and sent to {provider.company_name} for confirmation.",
        notification_type="BOOKING_CREATED"
    ))
    db.commit()
    
    return {
        "id": new_booking.id,
        "booking_code": new_booking.booking_code,
        "status": new_booking.status.value,
        "total_amount": new_booking.total_amount,
        "booking_date": new_booking.booking_date,
        "time_slot": new_booking.time_slot,
        "payment_order_id": pay.gateway_order_id,
        "message": "Booking created successfully!"
    }

@router.get("/{booking_id}")
def get_booking_detail(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Access control: only customer, provider, assigned technician, or Admin can view
    is_admin = current_user.role == UserRole.ADMIN
    is_owner_cust = current_user.customer_profile and booking.customer_id == current_user.customer_profile.id
    is_owner_prov = current_user.provider_profile and booking.provider_id == current_user.provider_profile.id
    is_assigned_tech = (
        current_user.technician_profile and
        booking.assignment and
        booking.assignment.technician_id == current_user.technician_profile.id
    )
    
    if not (is_admin or is_owner_cust or is_owner_prov or is_assigned_tech):
        raise HTTPException(status_code=403, detail="Unauthorized to view this booking")
        
    # Build timeline stages
    status_order = [
        ("PENDING", "Booking Received", "Customer created booking request"),
        ("CONFIRMED", "Provider Confirmed", "Provider accepted the appointment"),
        ("PROVIDER_ASSIGNED", "Technician Assigned", "Field specialist assigned"),
        ("IN_PROGRESS", "Work In Progress", "Technician on site"),
        ("COMPLETED", "Completed & Invoiced", "Work finished & verified")
    ]
    
    current_idx = 0
    val = booking.status.value
    if val == "PENDING": current_idx = 0
    elif val == "CONFIRMED": current_idx = 1
    elif val == "PROVIDER_ASSIGNED": current_idx = 2
    elif val == "IN_PROGRESS": current_idx = 3
    elif val == "COMPLETED": current_idx = 4
    elif val in ["CANCELLED", "REJECTED"]: current_idx = -1
    
    timeline = []
    for idx, (st, title, desc) in enumerate(status_order):
        timeline.append({
            "stage": st,
            "title": title,
            "description": desc,
            "is_completed": current_idx >= idx if current_idx >= 0 else False,
            "is_current": current_idx == idx if current_idx >= 0 else False
        })
        
    return {
        "id": booking.id,
        "booking_code": booking.booking_code,
        "status": booking.status.value,
        "booking_date": booking.booking_date,
        "time_slot": booking.time_slot,
        "special_instructions": booking.special_instructions,
        "created_at": booking.created_at,
        "pricing": {
            "subtotal": booking.subtotal,
            "discount": booking.discount,
            "platform_fee": booking.platform_fee,
            "total_amount": booking.total_amount
        },
        "service": {
            "id": booking.service.id,
            "name": booking.service.name,
            "duration": booking.service.duration_minutes,
            "image_url": booking.service.image_url,
            "category": booking.service.category.name if booking.service.category else ""
        },
        "provider": {
            "id": booking.provider.id,
            "company_name": booking.provider.company_name,
            "phone": booking.provider.user.phone if booking.provider.user else None,
            "avg_rating": booking.provider.avg_rating
        },
        "customer": {
            "id": booking.customer.id,
            "full_name": booking.customer.full_name,
            "phone": booking.customer.user.phone if booking.customer.user else None,
            "email": booking.customer.user.email if booking.customer.user else None
        },
        "address": {
            "title": booking.address.title,
            "street": booking.address.street_address,
            "city": booking.address.city,
            "state": booking.address.state,
            "postal_code": booking.address.postal_code,
            "landmark": booking.address.landmark
        } if booking.address else None,
        "technician": {
            "id": booking.assignment.technician.id,
            "name": booking.assignment.technician.full_name,
            "phone": booking.assignment.technician.user.phone if booking.assignment.technician.user else None,
            "status": booking.assignment.status,
            "arrival_at": booking.assignment.arrival_at,
            "completed_at": booking.assignment.completed_at,
            "remarks": booking.assignment.remarks
        } if booking.assignment and booking.assignment.technician else None,
        "payment": {
            "status": booking.payment.status.value,
            "method": booking.payment.payment_method,
            "order_id": booking.payment.gateway_order_id,
            "payment_id": booking.payment.gateway_payment_id,
            "paid_at": booking.payment.paid_at
        } if booking.payment else None,
        "invoice": {
            "invoice_number": booking.invoice.invoice_number,
            "total_amount": booking.invoice.total_amount,
            "issue_date": booking.invoice.issue_date,
            "pdf_url": booking.invoice.pdf_url
        } if booking.invoice else None,
        "images": [{"type": img.image_type, "url": img.image_url, "notes": img.notes} for img in booking.images],
        "timeline": timeline
    }

@router.post("/{booking_id}/status")
def update_booking_status(booking_id: int, status_in: BookingStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    old_status = booking.status
    booking.status = status_in.status
    
    # Notify Customer of status change
    db.add(Notification(
        user_id=booking.customer.user_id,
        title=f"Booking Status: {status_in.status.value}",
        message=f"Your booking {booking.booking_code} is now {status_in.status.value}." + (f" Note: {status_in.notes}" if status_in.notes else ""),
        notification_type="BOOKING_STATUS"
    ))
    db.commit()
    
    return {"message": f"Booking status updated from {old_status.value} to {status_in.status.value}"}

@router.post("/{booking_id}/assign")
def assign_technician(booking_id: int, assign_in: AssignTechnicianRequest, current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.provider_id == prov.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    tech = db.query(Technician).filter(Technician.id == assign_in.technician_id, Technician.provider_id == prov.id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found in your team")
        
    if booking.assignment:
        booking.assignment.technician_id = tech.id
        booking.assignment.remarks = assign_in.remarks
        booking.assignment.status = "ASSIGNED"
    else:
        assignment = BookingAssignment(
            booking_id=booking.id,
            technician_id=tech.id,
            status="ASSIGNED",
            remarks=assign_in.remarks
        )
        db.add(assignment)
        
    booking.status = BookingStatus.PROVIDER_ASSIGNED
    
    # Notifications
    db.add(Notification(
        user_id=tech.user_id,
        title="New Job Assigned",
        message=f"You have been assigned booking {booking.booking_code} on {booking.booking_date} ({booking.time_slot}).",
        notification_type="JOB_ASSIGNED"
    ))
    db.add(Notification(
        user_id=booking.customer.user_id,
        title="Technician Assigned",
        message=f"{tech.full_name} has been assigned to your booking {booking.booking_code}.",
        notification_type="TECHNICIAN_ASSIGNED"
    ))
    db.commit()
    
    return {"message": f"Technician {tech.full_name} successfully assigned to booking {booking.booking_code}"}

@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: int, reason: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a booking that is already {booking.status.value}")
        
    booking.status = BookingStatus.CANCELLED
    
    # Handle payment refund status if paid
    if booking.payment and booking.payment.status == PaymentStatus.PAID:
        booking.payment.status = PaymentStatus.REFUNDED
        booking.payment.failure_reason = "Customer cancelled booking. Refund initiated."
        
    db.add(Notification(
        user_id=booking.provider.user_id,
        title="Booking Cancelled",
        message=f"Booking {booking.booking_code} was cancelled by customer. Reason: {reason or 'Not specified'}.",
        notification_type="BOOKING_CANCELLED"
    ))
    db.commit()
    return {"message": f"Booking {booking.booking_code} cancelled successfully."}

@router.post("/{booking_id}/images")
def upload_booking_image(booking_id: int, image_type: str, image_url: str, notes: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    img = BookingImage(
        booking_id=booking.id,
        image_type=image_type.upper(),
        image_url=image_url,
        notes=notes
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return {"message": "Image saved successfully", "image_id": img.id}

