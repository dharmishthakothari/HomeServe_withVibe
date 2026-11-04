# HomeServe Horizon | Home Services Booking SaaS Platform
> **Vibe Coding Capstone Project • 100 Marks SDLC Production-Ready Submission**  
> Connects Customers, Certified Service Providers, Field Technicians, and Super Administrators in a responsive, multi-role SaaS ecosystem.

---

## 🌟 Technology Snapshot

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React.js 19 (Vite 8.3) |
| **Styling & Design System** | Tailwind CSS v4 + Glassmorphism ("Horizon Apex" UI) |
| **Iconography** | Lucide React |
| **Backend Framework** | Python FastAPI (Asynchronous REST API) |
| **Database** | MySQL 8.0 (Live dialect with 20 normalized tables) |
| **ORM** | SQLAlchemy 2.0 |
| **Authentication & RBAC** | JWT (PyJWT) + Bcrypt Password Hashing |
| **Payment Integration** | Razorpay Test Mode Sandbox Simulation |
| **Automated Testing** | Pytest (Unit/API) + Playwright 1.64 (End-to-End E2E) |
| **API Documentation** | Interactive Swagger UI (`/docs`) & ReDoc (`/redoc`) |
| **Reporting & Invoicing** | Automated GST Tax Invoicing (Printable HTML) + CSV Business Reports |

---

## 🚀 Live Demo Persona Switcher (Instant Evaluation)

The platform features a sticky **Demo Persona Switcher** at the top of the screen allowing instant 1-click evaluation across all 4 roles without manual typing:

| Role | Email | Password | Persona & Capabilities |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `admin@homeserve.com` | `admin123` | Platform revenue KPIs, Commission tracking, Category CRUD, Provider KYC approvals, Customer dispute resolution & CSV exports. |
| 👤 **Customer** | `customer@homeserve.com` | `cust123` | **Rahul Sharma** • Explore services, step-by-step booking wizard, live slot selection, coupon applicator, Razorpay checkout, live order telemetry & review submission. |
| 🛠️ **Service Provider** | `provider@homeserve.com` | `prov123` | **Apex Pro Home Solutions** • Dispatch schedule, accept/reject requests, assign technicians from roster, track net earnings. |
| 👷 **Technician** | `tech@homeserve.com` | `tech123` | **Vikram Singh** • Mobile-first field console, 1-click arrival timestamping, start work, complete job & upload completion proof. |

---

## 🏗️ 10 Functional Modules

1. **Authentication & RBAC**: JWT bearer tokens, secure bcrypt hashing, role validation middleware, protected routes.
2. **Customer Management**: Profile, multi-address management, service discovery, saved locations, booking history.
3. **Service Category & Catalog**: 8 predefined categories (Electrical, Plumbing, AC, Cleaning, Painting, Carpentry, Appliance, Pest Control) with durations, base pricing, and search filters.
4. **Service Provider Management**: Company registration, document verification status (KYC), service area radius, custom pricing.
5. **Booking & Appointment Management**: Dynamic time slot checking, **strict double-booking prevention guard**, unique code generation (`HS-YYYY-XXXX`), live status timeline (`Pending` ➔ `Confirmed` ➔ `Provider Assigned` ➔ `In Progress` ➔ `Completed`).
6. **Technician Management**: Team roster, job dispatching, real-time arrival check-in, remarks, before/after work photo documentation.
7. **Payment & Invoicing**: Razorpay sandbox test simulation, automatic 18% GST tax calculation, platform commission cut (10%), printable HTML tax invoice (`/api/invoices/{inv}/html`).
8. **Notification & Communication System**: Real-time in-app notification center with live unread badge counters and timeago stamps.
9. **Rating, Review & Dispute Management**: Customer 1-to-5 star reviews with rolling average recalculation, provider replies, customer dispute ticket lodging with priority resolution.
10. **Analytics & Reporting Dashboard**: Super Admin financial metrics (Gross Revenue, Commission, Provider Payouts, Resolution Rate), category distribution bars, and 1-click CSV download.

---

## 🗄️ Database Design (MySQL 8.0 & 20 Normalized Tables)

1. `users` (id, email, phone, hashed_password, role, status)
2. `customers` (id, user_id, full_name, avatar_url, default_address_id)
3. `service_providers` (id, user_id, company_name, business_reg_no, experience_years, bio, kyc_status, id_proof_url, commission_rate, avg_rating, is_verified)
4. `technicians` (id, user_id, provider_id, full_name, skill_specialization, is_available, jobs_completed)
5. `addresses` (id, customer_id, title, street_address, city, state, postal_code, landmark, is_default)
6. `service_categories` (id, name, slug, icon, description, is_active, display_order)
7. `services` (id, category_id, name, description, duration_minutes, base_price, image_url, is_active)
8. `provider_services` (id, provider_id, service_id, custom_price, is_available)
9. `service_areas` (id, provider_id, city, postal_code, radius_km)
10. `availability_slots` (id, provider_id, day_of_week, start_time, end_time, max_concurrent_bookings)
11. `bookings` (id, booking_code, customer_id, provider_id, service_id, address_id, booking_date, time_slot, status, subtotal, discount, platform_fee, total_amount, special_instructions)
12. `booking_assignments` (id, booking_id, technician_id, assigned_at, arrival_at, completed_at, status, remarks)
13. `booking_images` (id, booking_id, image_type, image_url, notes)
14. `payments` (id, booking_id, payment_method, gateway_order_id, gateway_payment_id, amount, currency, status, paid_at)
15. `invoices` (id, invoice_number, booking_id, issue_date, subtotal, discount, tax_amount, total_amount, pdf_url, status)
16. `coupons` (id, code, discount_type, discount_value, min_order_value, max_discount, is_active)
17. `reviews` (id, booking_id, customer_id, provider_id, rating, comment, provider_reply)
18. `complaints` (id, booking_id, customer_id, subject, description, priority, status, resolution_notes)
19. `notifications` (id, user_id, title, message, notification_type, is_read, created_at)
20. `provider_earnings` (id, provider_id, booking_id, gross_amount, commission_cut, net_payout, payout_status)

---

## ⚡ Quick Start & Local Execution

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL Server 8.0 running locally on port 3306 (user: `root`, password: `root`)

### 2. Backend Setup
```bash
# Clone repository
git clone https://github.com/your-username/HomeServe.git
cd HomeServe

# Install backend dependencies
pip install -r backend/requirements.txt

# Run migrations and seed multi-role dataset
python -m backend.create_tables
python -m backend.app.utils.seed_data

# Start FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger Docs*: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend Application*: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 🧪 Automated Testing Suite

### Unit & API Testing (Pytest)
```bash
python -m pytest backend/tests/test_api.py -v
```
**Results**:
- `test_health_check` PASSED
- `test_get_categories` PASSED
- `test_get_services_and_filtering` PASSED
- `test_auth_login_admin` PASSED
- `test_auth_login_customer` PASSED
- `test_auth_invalid_password` PASSED
- `test_coupon_validation` PASSED
- `test_booking_workflow_and_double_booking_prevention` PASSED (409 Conflict verified)
- `test_admin_analytics_access` PASSED (403 Forbidden verified)

### End-to-End Automated Testing (Playwright)
```bash
cd frontend
node tests/e2e_workflow.js
```
**Results**:
- Navigates to live application
- Verifies hero branding and interactive search
- Switches through all 4 role personas with real-time UI state transitions
- Verifies Super Admin analytics metrics and category filter execution
- **Verdict**: 100% Passed.
