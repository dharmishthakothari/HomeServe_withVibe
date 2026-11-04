from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models import (
    User, Review, Complaint, Booking, ServiceProvider, Notification,
    ComplaintStatus, UserRole
)
from backend.app.auth import get_current_user, require_role
from backend.app.schemas import ReviewCreate, ReviewReply, ComplaintCreate, ComplaintResolve

router = APIRouter(prefix="", tags=["Rating, Review & Complaint Management"])

@router.post("/reviews")
def create_review(rev_in: ReviewCreate, current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    booking = db.query(Booking).filter(Booking.id == rev_in.booking_id, Booking.customer_id == cust.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or does not belong to you")
        
    if booking.review:
        raise HTTPException(status_code=400, detail="Review already submitted for this booking")
        
    if rev_in.rating < 1 or rev_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    new_rev = Review(
        booking_id=booking.id,
        customer_id=cust.id,
        provider_id=booking.provider_id,
        rating=rev_in.rating,
        comment=rev_in.comment
    )
    db.add(new_rev)
    
    # Update Provider's rolling average rating
    provider = booking.provider
    all_revs = db.query(Review).filter(Review.provider_id == provider.id).all()
    total_ratings = sum(r.rating for r in all_revs) + rev_in.rating
    count = len(all_revs) + 1
    provider.avg_rating = round(total_ratings / count, 1)
    provider.total_reviews = count
    
    # Notify provider
    db.add(Notification(
        user_id=provider.user_id,
        title="New Review Received",
        message=f"{cust.full_name} gave you a {rev_in.rating}-star review for booking {booking.booking_code}.",
        notification_type="REVIEW_RECEIVED"
    ))
    db.commit()
    
    return {"message": "Review submitted successfully!", "rating": rev_in.rating}

@router.post("/reviews/{review_id}/reply")
def reply_to_review(review_id: int, reply_in: ReviewReply, current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    rev = db.query(Review).filter(Review.id == review_id, Review.provider_id == prov.id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
        
    rev.provider_reply = reply_in.provider_reply
    db.commit()
    return {"message": "Reply posted successfully"}

@router.post("/complaints")
def raise_complaint(comp_in: ComplaintCreate, current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    booking = db.query(Booking).filter(Booking.id == comp_in.booking_id, Booking.customer_id == cust.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    comp = Complaint(
        booking_id=booking.id,
        customer_id=cust.id,
        subject=comp_in.subject,
        description=comp_in.description,
        priority=comp_in.priority.upper(),
        status=ComplaintStatus.OPEN
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return {"message": "Complaint registered successfully. Support team will investigate.", "complaint_id": comp.id}

@router.get("/complaints")
def get_complaints(current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    results = []
    for c in complaints:
        results.append({
            "id": c.id,
            "booking_code": c.booking.booking_code if c.booking else "",
            "customer_name": c.customer.full_name if c.customer else "",
            "provider_name": c.booking.provider.company_name if c.booking and c.booking.provider else "",
            "subject": c.subject,
            "description": c.description,
            "priority": c.priority,
            "status": c.status.value,
            "resolution_notes": c.resolution_notes,
            "created_at": c.created_at
        })
    return results

@router.post("/complaints/{complaint_id}/resolve")
def resolve_complaint(complaint_id: int, res_in: ComplaintResolve, current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    comp.status = res_in.status
    comp.resolution_notes = res_in.resolution_notes
    
    # Notify customer
    db.add(Notification(
        user_id=comp.customer.user_id,
        title=f"Complaint Status: {res_in.status.value}",
        message=f"Regarding '{comp.subject}': {res_in.resolution_notes}",
        notification_type="COMPLAINT_UPDATE"
    ))
    db.commit()
    return {"message": f"Complaint {complaint_id} status updated to {res_in.status.value}"}
