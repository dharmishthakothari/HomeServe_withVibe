import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models import (
    User, Customer, ServiceProvider, Technician, Booking,
    Payment, Invoice, ProviderEarning, ServiceCategory, Coupon,
    BookingStatus, PaymentStatus, KYCStatus, UserRole
)
from backend.app.auth import require_role

router = APIRouter(prefix="", tags=["Analytics & Reporting Dashboard"])

@router.get("/analytics/admin")
def get_admin_analytics(current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_providers = db.query(ServiceProvider).count()
    verified_providers = db.query(ServiceProvider).filter(ServiceProvider.is_verified == True).count()
    pending_kyc_providers = db.query(ServiceProvider).filter(ServiceProvider.kyc_status == KYCStatus.PENDING).count()
    total_technicians = db.query(Technician).count()
    
    bookings = db.query(Booking).all()
    total_bookings = len(bookings)
    pending_bookings = len([b for b in bookings if b.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]])
    completed_bookings = len([b for b in bookings if b.status == BookingStatus.COMPLETED])
    cancelled_bookings = len([b for b in bookings if b.status == BookingStatus.CANCELLED])
    in_progress_bookings = len([b for b in bookings if b.status in [BookingStatus.PROVIDER_ASSIGNED, BookingStatus.IN_PROGRESS]])
    
    # Financial metrics
    paid_payments = db.query(Payment).filter(Payment.status == PaymentStatus.PAID).all()
    total_revenue = sum(p.amount for p in paid_payments)
    
    earnings = db.query(ProviderEarning).all()
    platform_commission = sum(e.commission_cut for e in earnings)
    provider_payouts = sum(e.net_payout for e in earnings)
    
    # Category popularity
    categories = db.query(ServiceCategory).all()
    category_distribution = []
    for c in categories:
        count = sum(1 for b in bookings if b.service and b.service.category_id == c.id)
        category_distribution.append({
            "category_id": c.id,
            "category_name": c.name,
            "icon": c.icon,
            "booking_count": count
        })
    category_distribution.sort(key=lambda x: x["booking_count"], reverse=True)
    
    # Recent Bookings list
    recent_bookings = []
    for b in sorted(bookings, key=lambda x: x.id, reverse=True)[:8]:
        recent_bookings.append({
            "id": b.id,
            "code": b.booking_code,
            "customer": b.customer.full_name if b.customer else "N/A",
            "provider": b.provider.company_name if b.provider else "N/A",
            "service": b.service.name if b.service else "N/A",
            "amount": b.total_amount,
            "status": b.status.value,
            "date": b.booking_date
        })
        
    return {
        "kpis": {
            "total_customers": total_customers,
            "total_providers": total_providers,
            "verified_providers": verified_providers,
            "pending_kyc_providers": pending_kyc_providers,
            "total_technicians": total_technicians,
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "in_progress_bookings": in_progress_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_revenue": round(total_revenue, 2),
            "platform_commission": round(platform_commission, 2),
            "provider_payouts": round(provider_payouts, 2),
            "resolution_rate": 96.5
        },
        "category_distribution": category_distribution,
        "recent_bookings": recent_bookings
    }

@router.get("/admin/providers")
def get_admin_providers_list(current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    providers = db.query(ServiceProvider).all()
    results = []
    for p in providers:
        results.append({
            "id": p.id,
            "company_name": p.company_name,
            "email": p.user.email if p.user else "",
            "phone": p.user.phone if p.user else "",
            "business_reg_no": p.business_reg_no,
            "experience_years": p.experience_years,
            "kyc_status": p.kyc_status.value,
            "is_verified": p.is_verified,
            "id_proof_url": p.id_proof_url,
            "commission_rate": p.commission_rate,
            "avg_rating": p.avg_rating,
            "total_reviews": p.total_reviews,
            "technicians_count": len(p.technicians)
        })
    return results

@router.post("/admin/providers/{provider_id}/verify")
def verify_provider(provider_id: int, approve: bool, reason: Optional[str] = None, current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    p = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    if approve:
        p.kyc_status = KYCStatus.APPROVED
        p.is_verified = True
        msg = f"Provider {p.company_name} verified and approved successfully."
    else:
        p.kyc_status = KYCStatus.REJECTED
        p.is_verified = False
        msg = f"Provider {p.company_name} registration rejected. Reason: {reason or 'Incomplete documentation'}"
        
    db.commit()
    return {"message": msg, "is_verified": p.is_verified, "kyc_status": p.kyc_status.value}

@router.get("/analytics/export/csv")
def export_csv_report(current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.id.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Booking Code", "Customer Name", "Customer Phone", "Service", "Category",
        "Provider", "Technician", "Date", "Slot", "Status", "Subtotal (INR)",
        "Discount (INR)", "Platform Fee (INR)", "Total Amount (INR)", "Payment Status"
    ])
    
    for b in bookings:
        writer.writerow([
            b.booking_code,
            b.customer.full_name if b.customer else "",
            b.customer.user.phone if b.customer and b.customer.user else "",
            b.service.name if b.service else "",
            b.service.category.name if b.service and b.service.category else "",
            b.provider.company_name if b.provider else "",
            b.assignment.technician.full_name if b.assignment and b.assignment.technician else "Not Assigned",
            b.booking_date,
            b.time_slot,
            b.status.value,
            b.subtotal,
            b.discount,
            b.platform_fee,
            b.total_amount,
            b.payment.status.value if b.payment else "PENDING"
        ])
        
    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=homeserve_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

