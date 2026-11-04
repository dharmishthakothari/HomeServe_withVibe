from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Customer, ServiceProvider, Technician, UserRole, UserStatus, KYCStatus
from backend.app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from backend.app.schemas import UserRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Authorization"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    # Create User
    new_user = User(
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        status=UserStatus.ACTIVE
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Role-specific profile
    display_name = user_in.full_name
    if user_in.role == UserRole.CUSTOMER:
        cust = Customer(
            user_id=new_user.id,
            full_name=user_in.full_name,
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
        )
        db.add(cust)
    elif user_in.role == UserRole.PROVIDER:
        company = user_in.company_name or f"{user_in.full_name}'s Services"
        display_name = company
        prov = ServiceProvider(
            user_id=new_user.id,
            company_name=company,
            experience_years=user_in.experience_years or 1,
            bio="Certified professional home service provider.",
            kyc_status=KYCStatus.PENDING,
            is_verified=False
        )
        db.add(prov)
    elif user_in.role == UserRole.TECHNICIAN:
        # Default assign to first provider if not specified
        first_prov = db.query(ServiceProvider).first()
        prov_id = first_prov.id if first_prov else 1
        tech = Technician(
            user_id=new_user.id,
            provider_id=prov_id,
            full_name=user_in.full_name,
            skill_specialization=user_in.skill_specialization or "Multi-skill Technician"
        )
        db.add(tech)
        
    db.commit()
    
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role.value, "user_id": new_user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role.value,
        "user_id": new_user.id,
        "name": display_name,
        "email": new_user.email
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Resolve display name
    name = user.email.split("@")[0].capitalize()
    if user.customer_profile:
        name = user.customer_profile.full_name
    elif user.provider_profile:
        name = user.provider_profile.company_name
    elif user.technician_profile:
        name = user.technician_profile.full_name
    elif user.role == UserRole.ADMIN:
        name = "Super Administrator"

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "name": name,
        "email": user.email
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if current_user.role == UserRole.CUSTOMER and current_user.customer_profile:
        profile_data = {
            "full_name": current_user.customer_profile.full_name,
            "avatar_url": current_user.customer_profile.avatar_url,
            "customer_id": current_user.customer_profile.id
        }
    elif current_user.role == UserRole.PROVIDER and current_user.provider_profile:
        profile_data = {
            "provider_id": current_user.provider_profile.id,
            "company_name": current_user.provider_profile.company_name,
            "kyc_status": current_user.provider_profile.kyc_status.value,
            "is_verified": current_user.provider_profile.is_verified,
            "avg_rating": current_user.provider_profile.avg_rating
        }
    elif current_user.role == UserRole.TECHNICIAN and current_user.technician_profile:
        profile_data = {
            "technician_id": current_user.technician_profile.id,
            "full_name": current_user.technician_profile.full_name,
            "specialization": current_user.technician_profile.skill_specialization,
            "is_available": current_user.technician_profile.is_available,
            "provider_id": current_user.technician_profile.provider_id
        }
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "status": current_user.status.value,
        "profile": profile_data
    }

@router.get("/demo-users")
def get_demo_users():
    """Quick demo user credentials for instant testing & evaluation in UI"""
    return [
        {
            "role": "ADMIN",
            "title": "Super Admin",
            "email": "admin@homeserve.com",
            "password": "admin123",
            "description": "Full access to platform analytics, category CRUD, KYC verification & disputes"
        },
        {
            "role": "CUSTOMER",
            "title": "Customer",
            "email": "customer@homeserve.com",
            "password": "cust123",
            "description": "Explore services, book appointments, track orders, test payments & leave reviews"
        },
        {
            "role": "PROVIDER",
            "title": "Service Provider",
            "email": "provider@homeserve.com",
            "password": "prov123",
            "description": "Accept bookings, dispatch technicians, view revenue & manage services"
        },
        {
            "role": "TECHNICIAN",
            "title": "Field Technician",
            "email": "tech@homeserve.com",
            "password": "tech123",
            "description": "View assigned jobs, 1-click arrival, work completion & upload photos"
        }
    ]

