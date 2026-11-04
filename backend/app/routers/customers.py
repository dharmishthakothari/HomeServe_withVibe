from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Customer, Address, Booking, UserRole
from backend.app.auth import get_current_user, require_role
from backend.app.schemas import CustomerAddressCreate, CustomerAddressResponse

router = APIRouter(prefix="/customers", tags=["Customer Management"])

@router.get("/profile")
def get_customer_profile(current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return {
        "id": cust.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "full_name": cust.full_name,
        "avatar_url": cust.avatar_url,
        "addresses_count": len(cust.addresses),
        "total_bookings": len(cust.bookings)
    }

@router.get("/addresses", response_model=List[CustomerAddressResponse])
def get_addresses(current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return cust.addresses

@router.post("/addresses", response_model=CustomerAddressResponse)
def add_address(addr_in: CustomerAddressCreate, current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=404, detail="Customer profile not found")
        
    if addr_in.is_default:
        for a in cust.addresses:
            a.is_default = False
            
    new_addr = Address(
        customer_id=cust.id,
        **addr_in.model_dump()
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr

@router.delete("/addresses/{address_id}")
def delete_address(address_id: int, current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    addr = db.query(Address).filter(Address.id == address_id, Address.customer_id == cust.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted successfully"}

@router.get("/bookings")
def get_customer_bookings(current_user: User = Depends(require_role(UserRole.CUSTOMER)), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        return []
    bookings = db.query(Booking).filter(Booking.customer_id == cust.id).order_by(Booking.id.desc()).all()
    results = []
    for b in bookings:
        results.append({
            "id": b.id,
            "booking_code": b.booking_code,
            "service_name": b.service.name if b.service else "Service",
            "service_image": b.service.image_url if b.service else None,
            "provider_name": b.provider.company_name if b.provider else "Provider",
            "provider_phone": b.provider.user.phone if b.provider and b.provider.user else None,
            "booking_date": b.booking_date,
            "time_slot": b.time_slot,
            "status": b.status.value,
            "total_amount": b.total_amount,
            "address": f"{b.address.street_address}, {b.address.city}" if b.address else "",
            "payment_status": b.payment.status.value if b.payment else "PENDING",
            "technician_name": b.assignment.technician.full_name if b.assignment and b.assignment.technician else None,
            "technician_phone": b.assignment.technician.user.phone if b.assignment and b.assignment.technician and b.assignment.technician.user else None,
            "technician_status": b.assignment.status if b.assignment else None,
            "has_review": b.review is not None,
            "has_invoice": b.invoice is not None,
            "invoice_number": b.invoice.invoice_number if b.invoice else None
        })
    return results

