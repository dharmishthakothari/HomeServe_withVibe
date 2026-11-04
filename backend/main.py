import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routers import (
    auth, services, customers, providers,
    technicians, bookings, payments, notifications,
    reviews, analytics
)

# Ensure uploads directory exists
os.makedirs("uploads/kyc", exist_ok=True)
os.makedirs("uploads/services", exist_ok=True)
os.makedirs("uploads/bookings", exist_ok=True)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade Home Services SaaS Booking Platform API with Multi-Role RBAC, Razorpay Test Integration, and MySQL Database.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware (allowing frontend dev & production ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded proofs / work completion photos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include all module routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(services.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(providers.router, prefix=settings.API_V1_STR)
app.include_router(technicians.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "docs_url": "/docs",
        "architecture": "FastAPI + MySQL 8.0 + React 19 SaaS"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": engine.dialect.name,
        "timestamp": os.getenv("API_TIMESTAMP", "2026-11-04")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
