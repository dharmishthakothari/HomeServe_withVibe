from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import get_db
from backend.app.models import ServiceCategory, Service, ProviderService, ServiceProvider, Coupon, UserRole
from backend.app.auth import require_role, get_current_user
from backend.app.schemas import CategoryCreate, CategoryResponse, ServiceCreate, ServiceResponse, CouponValidate

router = APIRouter(prefix="/services", tags=["Service & Category Management"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(ServiceCategory).filter(ServiceCategory.is_active == True).order_by(ServiceCategory.display_order).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), current_user = Depends(require_role(UserRole.ADMIN))):
    new_cat = ServiceCategory(**cat_in.model_dump())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.get("")
def get_services(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.is_active == True)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if search:
        query = query.filter(
            or_(
                Service.name.ilike(f"%{search}%"),
                Service.description.ilike(f"%{search}%")
            )
        )
    if min_price is not None:
        query = query.filter(Service.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Service.base_price <= max_price)
        
    services = query.all()
    results = []
    for s in services:
        results.append({
            "id": s.id,
            "category_id": s.category_id,
            "category_name": s.category.name if s.category else "",
            "category_icon": s.category.icon if s.category else "Wrench",
            "name": s.name,
            "description": s.description,
            "duration_minutes": s.duration_minutes,
            "base_price": s.base_price,
            "image_url": s.image_url,
            "is_active": s.is_active,
            "available_providers_count": len([p for p in s.provider_services if p.is_available])
        })
    return results

@router.get("/{service_id}")
def get_service_detail(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    # Get providers offering this service
    providers_list = []
    for ps in service.provider_services:
        if ps.is_available and ps.provider.is_verified:
            providers_list.append({
                "provider_id": ps.provider.id,
                "company_name": ps.provider.company_name,
                "bio": ps.provider.bio,
                "experience_years": ps.provider.experience_years,
                "avg_rating": ps.provider.avg_rating,
                "total_reviews": ps.provider.total_reviews,
                "price": ps.custom_price or service.base_price,
                "availability_slots": [
                    {
                        "day": a.day_of_week,
                        "time": f"{a.start_time} - {a.end_time}"
                    } for a in ps.provider.availability_slots
                ]
            })
            
    return {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "category_id": service.category_id,
        "category_name": service.category.name if service.category else "",
        "category_icon": service.category.icon if service.category else "Wrench",
        "duration_minutes": service.duration_minutes,
        "base_price": service.base_price,
        "image_url": service.image_url,
        "providers": providers_list
    }

@router.post("", response_model=ServiceResponse)
def create_service(srv_in: ServiceCreate, db: Session = Depends(get_db), current_user = Depends(require_role(UserRole.ADMIN))):
    new_srv = Service(**srv_in.model_dump())
    db.add(new_srv)
    db.commit()
    db.refresh(new_srv)
    return new_srv

@router.post("/coupons/validate")
def validate_coupon(coupon_in: CouponValidate, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(
        Coupon.code == coupon_in.code.upper(),
        Coupon.is_active == True
    ).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
        
    if coupon_in.order_amount < coupon.min_order_value:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum booking amount of ₹{coupon.min_order_value:.0f} required for this coupon"
        )
        
    if coupon.discount_type == "PERCENTAGE":
        discount = (coupon_in.order_amount * coupon.discount_value) / 100.0
        discount = min(discount, coupon.max_discount)
    else:
        discount = min(coupon.discount_value, coupon.max_discount)
        
    return {
        "valid": True,
        "code": coupon.code,
        "discount_amount": round(discount, 2),
        "message": f"Coupon {coupon.code} applied! You saved ₹{discount:.0f}"
    }

@router.get("/coupons/active")
def get_active_coupons(db: Session = Depends(get_db)):
    coupons = db.query(Coupon).filter(Coupon.is_active == True).all()
    return [{
        "code": c.code,
        "discount_type": c.discount_type,
        "discount_value": c.discount_value,
        "min_order_value": c.min_order_value,
        "max_discount": c.max_discount
    } for c in coupons]
