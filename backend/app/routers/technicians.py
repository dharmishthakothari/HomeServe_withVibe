from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User, Technician, BookingAssignment, Booking, BookingImage,
    BookingStatus, Invoice, ProviderEarning, Notification, UserRole
)
from backend.app.auth import require_role
from backend.app.schemas import TechnicianStatusUpdate

router = APIRouter(prefix="/technicians", tags=["Technician Management"])

@router.get("/jobs")
def get_technician_jobs(current_user: User = Depends(require_role(UserRole.TECHNICIAN)), db: Session = Depends(get_db)):
    tech = current_user.technician_profile
    if not tech:
        raise HTTPException(status_code=404, detail="Technician profile not found")
        
    assignments = db.query(BookingAssignment).filter(BookingAssignment.technician_id == tech.id).order_by(BookingAssignment.id.desc()).all()
    results = []
    for a in assignments:
        b = a.booking
        results.append({
            "assignment_id": a.id,
            "booking_id": b.id,
            "booking_code": b.booking_code,
            "service_name": b.service.name if b.service else "Service",
            "service_duration": b.service.duration_minutes if b.service else 60,
            "customer_name": b.customer.full_name if b.customer else "Customer",
            "customer_phone": b.customer.user.phone if b.customer and b.customer.user else None,
            "address": {
                "street": b.address.street_address,
                "city": b.address.city,
                "landmark": b.address.landmark,
                "postal_code": b.address.postal_code
            } if b.address else None,
            "booking_date": b.booking_date,
            "time_slot": b.time_slot,
            "special_instructions": b.special_instructions,
            "assignment_status": a.status,
            "booking_status": b.status.value,
            "assigned_at": a.assigned_at,
            "arrival_at": a.arrival_at,
            "completed_at": a.completed_at,
            "remarks": a.remarks,
            "images": [{"type": img.image_type, "url": img.image_url, "notes": img.notes} for img in b.images]
        })
    return results

@router.post("/jobs/{booking_id}/status")
def update_job_status(booking_id: int, status_update: TechnicianStatusUpdate, current_user: User = Depends(require_role(UserRole.TECHNICIAN)), db: Session = Depends(get_db)):
    tech = current_user.technician_profile
    if not tech:
        raise HTTPException(status_code=404, detail="Technician profile not found")
        
    assignment = db.query(BookingAssignment).filter(
        BookingAssignment.booking_id == booking_id,
        BookingAssignment.technician_id == tech.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Job assignment not found for this technician")
        
    booking = assignment.booking
    new_status = status_update.status.upper()
    now = datetime.utcnow()
    
    if new_status == "ARRIVED":
        assignment.status = "ARRIVED"
        assignment.arrival_at = now
        booking.status = BookingStatus.IN_PROGRESS
        # Send Notification to Customer
        db.add(Notification(
            user_id=booking.customer.user_id,
            title="Technician Arrived!",
            message=f"{tech.full_name} has arrived at your address for booking {booking.booking_code}.",
            notification_type="TECHNICIAN_ARRIVED"
        ))
        
    elif new_status == "IN_PROGRESS":
        assignment.status = "IN_PROGRESS"
        booking.status = BookingStatus.IN_PROGRESS
        
    elif new_status == "COMPLETED":
        assignment.status = "COMPLETED"
        assignment.completed_at = now
        assignment.remarks = status_update.remarks or "Service successfully completed."
        booking.status = BookingStatus.COMPLETED
        tech.jobs_completed = (tech.jobs_completed or 0) + 1
        
        # Save completion photo if provided
        if status_update.image_url:
            db.add(BookingImage(
                booking_id=booking.id,
                image_type="AFTER",
                image_url=status_update.image_url,
                notes=status_update.remarks or "Completed work proof photo"
            ))
            
        # Ensure Invoice exists
        if not booking.invoice:
            inv_num = f"INV-2026-{booking.id:04d}"
            tax = round(booking.total_amount * 0.18, 2)
            db.add(Invoice(
                invoice_number=inv_num,
                booking_id=booking.id,
                issue_date=now,
                subtotal=booking.subtotal,
                discount=booking.discount,
                tax_amount=tax,
                total_amount=booking.total_amount,
                pdf_url=f"/api/invoices/{inv_num}/html",
                status="PAID"
            ))
            
        # Ensure Provider Earning is recorded
        if not booking.earning:
            commission_rate = booking.provider.commission_rate if booking.provider else 10.0
            commission_cut = round((booking.total_amount * commission_rate) / 100.0, 2)
            net_payout = round(booking.total_amount - commission_cut, 2)
            db.add(ProviderEarning(
                provider_id=booking.provider_id,
                booking_id=booking.id,
                gross_amount=booking.total_amount,
                commission_cut=commission_cut,
                net_payout=net_payout,
                payout_status="PENDING"
            ))
            
        # Send notifications
        db.add(Notification(
            user_id=booking.customer.user_id,
            title="Job Completed!",
            message=f"Work on booking {booking.booking_code} has been marked completed by {tech.full_name}. Please rate your experience!",
            notification_type="JOB_COMPLETED"
        ))
        db.add(Notification(
            user_id=booking.provider.user_id,
            title="Job Completed by Technician",
            message=f"{tech.full_name} completed job {booking.booking_code}.",
            notification_type="PROVIDER_JOB_DONE"
        ))
        
    db.commit()
    return {
        "message": f"Job status updated to {new_status}",
        "assignment_status": assignment.status,
        "booking_status": booking.status.value
    }
