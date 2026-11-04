from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User, ServiceProvider, Technician, Booking, BookingStatus,
    ProviderEarning, UserRole, UserStatus, KYCStatus, Notification
)
from backend.app.auth import require_role, get_current_user, get_password_hash

router = APIRouter(prefix="/providers", tags=["Service Provider Management"])

class TechnicianCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str = "tech123"
    skill_specialization: str

class KYCSubmit(BaseModel):
    business_reg_no: str
    id_proof_url: str
    experience_years: int
    bio: str

@router.get("")
def list_providers(city: Optional[str] = None, category_id: Optional[int] = None, db: Session = Depends(get_db)):
    providers = db.query(ServiceProvider).filter(ServiceProvider.is_verified == True).all()
    results = []
    for p in providers:
        services_list = [{
            "id": ps.service.id,
            "name": ps.service.name,
            "price": ps.custom_price or ps.service.base_price,
            "category": ps.service.category.name if ps.service.category else ""
        } for ps in p.provider_services if ps.is_available]
        
        results.append({
            "id": p.id,
            "company_name": p.company_name,
            "bio": p.bio,
            "experience_years": p.experience_years,
            "avg_rating": p.avg_rating,
            "total_reviews": p.total_reviews,
            "is_verified": p.is_verified,
            "services": services_list
        })
    return results

@router.get("/dashboard/stats")
def get_provider_dashboard_stats(current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    if not prov:
        raise HTTPException(status_code=404, detail="Provider profile not found")
        
    bookings = db.query(Booking).filter(Booking.provider_id == prov.id).all()
    total_bookings = len(bookings)
    pending_bookings = len([b for b in bookings if b.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]])
    completed_bookings = len([b for b in bookings if b.status == BookingStatus.COMPLETED])
    in_progress_bookings = len([b for b in bookings if b.status == BookingStatus.IN_PROGRESS])
    
    # Calculate earnings
    earnings = db.query(ProviderEarning).filter(ProviderEarning.provider_id == prov.id).all()
    total_earnings = sum(e.net_payout for e in earnings)
    pending_payout = sum(e.net_payout for e in earnings if e.payout_status == "PENDING")
    
    return {
        "provider_id": prov.id,
        "company_name": prov.company_name,
        "is_verified": prov.is_verified,
        "kyc_status": prov.kyc_status.value,
        "avg_rating": prov.avg_rating,
        "total_reviews": prov.total_reviews,
        "metrics": {
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "in_progress_bookings": in_progress_bookings,
            "completed_bookings": completed_bookings,
            "total_earnings": round(total_earnings, 2),
            "pending_payout": round(pending_payout, 2)
        }
    }

@router.get("/bookings")
def get_provider_bookings(status: Optional[str] = None, current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    if not prov:
        return []
        
    query = db.query(Booking).filter(Booking.provider_id == prov.id)
    if status:
        query = query.filter(Booking.status == status)
        
    bookings = query.order_by(Booking.id.desc()).all()
    results = []
    for b in bookings:
        results.append({
            "id": b.id,
            "booking_code": b.booking_code,
            "service_id": b.service_id,
            "service_name": b.service.name if b.service else "Service",
            "customer_name": b.customer.full_name if b.customer else "Customer",
            "customer_phone": b.customer.user.phone if b.customer and b.customer.user else None,
            "address": f"{b.address.street_address}, {b.address.city} - {b.address.postal_code}" if b.address else "",
            "booking_date": b.booking_date,
            "time_slot": b.time_slot,
            "status": b.status.value,
            "total_amount": b.total_amount,
            "special_instructions": b.special_instructions,
            "payment_status": b.payment.status.value if b.payment else "PENDING",
            "assigned_technician_id": b.assignment.technician_id if b.assignment else None,
            "assigned_technician_name": b.assignment.technician.full_name if b.assignment and b.assignment.technician else None,
            "technician_status": b.assignment.status if b.assignment else None
        })
    return results

@router.get("/technicians")
def get_provider_technicians(current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    if not prov:
        return []
    techs = db.query(Technician).filter(Technician.provider_id == prov.id).all()
    return [{
        "id": t.id,
        "full_name": t.full_name,
        "email": t.user.email if t.user else "",
        "phone": t.user.phone if t.user else "",
        "skill_specialization": t.skill_specialization,
        "is_available": t.is_available,
        "jobs_completed": t.jobs_completed
    } for t in techs]

@router.post("/technicians")
def add_technician(tech_in: TechnicianCreate, current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    if not prov:
        raise HTTPException(status_code=404, detail="Provider profile not found")
        
    existing = db.query(User).filter(User.email == tech_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
        
    new_user = User(
        email=tech_in.email,
        phone=tech_in.phone,
        hashed_password=get_password_hash(tech_in.password),
        role=UserRole.TECHNICIAN,
        status=UserStatus.ACTIVE
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    tech = Technician(
        user_id=new_user.id,
        provider_id=prov.id,
        full_name=tech_in.full_name,
        skill_specialization=tech_in.skill_specialization,
        is_available=True,
        jobs_completed=0
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)
    
    return {
        "id": tech.id,
        "full_name": tech.full_name,
        "email": tech_in.email,
        "skill_specialization": tech.skill_specialization,
        "is_available": tech.is_available
    }

@router.post("/kyc/submit")
def submit_kyc(kyc_in: KYCSubmit, current_user: User = Depends(require_role(UserRole.PROVIDER)), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    if not prov:
        raise HTTPException(status_code=404, detail="Provider profile not found")
        
    prov.business_reg_no = kyc_in.business_reg_no
    prov.id_proof_url = kyc_in.id_proof_url
    prov.experience_years = kyc_in.experience_years
    prov.bio = kyc_in.bio
    prov.kyc_status = KYCStatus.PENDING
    db.commit()
    
    return {"message": "KYC documentation submitted successfully for Super Admin verification."}
