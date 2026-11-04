import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "mysql"

def test_get_categories():
    response = client.get("/api/services/categories")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) >= 8
    cat_names = [c["name"] for c in categories]
    assert "Electrical Services" in cat_names
    assert "AC Repair & Maintenance" in cat_names

def test_get_services_and_filtering():
    # All services
    response = client.get("/api/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) > 0
    
    # Filter by category 1 (Electrical)
    res_filtered = client.get("/api/services?category_id=1")
    assert res_filtered.status_code == 200
    for s in res_filtered.json():
        assert s["category_id"] == 1

    # Search filter
    res_search = client.get("/api/services?search=AC")
    assert res_search.status_code == 200
    assert any("AC" in s["name"] for s in res_search.json())

def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@homeserve.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"

def test_auth_login_customer():
    response = client.post("/api/auth/login", json={
        "email": "customer@homeserve.com",
        "password": "cust123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "CUSTOMER"

def test_auth_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "customer@homeserve.com",
        "password": "wrong_password_999"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_coupon_validation():
    # Valid coupon WELCOME100 on order >= 299
    response = client.post("/api/services/coupons/validate", json={
        "code": "WELCOME100",
        "order_amount": 799.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["discount_amount"] == 100.0

    # Invalid coupon code
    res_invalid = client.post("/api/services/coupons/validate", json={
        "code": "NONEXISTENT",
        "order_amount": 500.0
    })
    assert res_invalid.status_code == 404

    # Order amount below minimum order value
    res_below_min = client.post("/api/services/coupons/validate", json={
        "code": "WELCOME100",
        "order_amount": 100.0
    })
    assert res_below_min.status_code == 400

def test_booking_workflow_and_double_booking_prevention():
    # 1. Login as customer
    login_res = client.post("/api/auth/login", json={
        "email": "customer@homeserve.com",
        "password": "cust123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get customer addresses
    addr_res = client.get("/api/customers/addresses", headers=headers)
    assert addr_res.status_code == 200
    addresses = addr_res.json()
    assert len(addresses) > 0
    addr_id = addresses[0]["id"]
    
    # 3. Create a unique booking
    booking_payload = {
        "provider_id": 1,
        "service_id": 1,
        "address_id": addr_id,
        "booking_date": "2026-12-15",
        "time_slot": "04:00 PM - 06:00 PM",
        "special_instructions": "Pytest automated verification slot",
        "coupon_code": "WELCOME100"
    }
    
    book_res = client.post("/api/bookings", json=booking_payload, headers=headers)
    assert book_res.status_code == 201
    booking_data = book_res.json()
    booking_id = booking_data["id"]
    assert "booking_code" in booking_data
    
    # 4. Double-Booking Prevention Test:
    # Attempting to book the SAME provider on the SAME date and SAME slot must fail with 409 Conflict
    conflict_res = client.post("/api/bookings", json=booking_payload, headers=headers)
    assert conflict_res.status_code == 409
    assert "already reserved" in conflict_res.json()["detail"]
    
    # 5. Payment Simulation Test
    verify_res = client.post("/api/payments/verify", json={
        "booking_id": booking_id,
        "gateway_payment_id": "pay_test_pytest_9999",
        "gateway_order_id": booking_data.get("payment_order_id")
    }, headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True

def test_admin_analytics_access():
    # 1. Customer cannot access admin analytics (403 Forbidden)
    cust_login = client.post("/api/auth/login", json={
        "email": "customer@homeserve.com",
        "password": "cust123"
    })
    cust_token = cust_login.json()["access_token"]
    cust_res = client.get("/api/analytics/admin", headers={"Authorization": f"Bearer {cust_token}"})
    assert cust_res.status_code == 403

    # 2. Admin can access analytics (200 OK)
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@homeserve.com",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_res = client.get("/api/analytics/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    data = admin_res.json()
    assert "kpis" in data
    assert data["kpis"]["total_customers"] >= 2
    assert data["kpis"]["total_providers"] >= 3

