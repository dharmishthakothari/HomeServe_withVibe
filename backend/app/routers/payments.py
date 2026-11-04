from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User, Booking, Payment, Invoice, ProviderEarning, Notification,
    PaymentStatus, BookingStatus, UserRole
)
from backend.app.auth import get_current_user, require_role
from backend.app.schemas import PaymentInitiateRequest, PaymentVerifyRequest

router = APIRouter(prefix="", tags=["Payment & Invoice Management"])

@router.post("/payments/create-order")
def create_payment_order(req: PaymentInitiateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    order_id = f"order_{booking.booking_code.replace('-', '')}"
    amount_in_paise = int(booking.total_amount * 100)
    
    # Update or create payment record
    pay = booking.payment
    if not pay:
        pay = Payment(
            booking_id=booking.id,
            payment_method=req.payment_method,
            gateway_order_id=order_id,
            amount=booking.total_amount,
            status=PaymentStatus.PENDING
        )
        db.add(pay)
    else:
        pay.gateway_order_id = order_id
        pay.payment_method = req.payment_method
        
    db.commit()
    
    return {
        "order_id": order_id,
        "amount": amount_in_paise,
        "currency": "INR",
        "key_id": "rzp_test_HS_apex_2026",
        "booking_code": booking.booking_code,
        "customer_name": booking.customer.full_name,
        "customer_phone": booking.customer.user.phone or "9876543210",
        "service_name": booking.service.name
    }

@router.post("/payments/verify")
def verify_payment(req: PaymentVerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    pay = booking.payment
    if not pay:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    # Mark payment as PAID
    now = datetime.utcnow()
    pay.status = PaymentStatus.PAID
    pay.gateway_payment_id = req.gateway_payment_id
    pay.paid_at = now
    
    # If booking was in PENDING, advance to CONFIRMED
    if booking.status == BookingStatus.PENDING:
        booking.status = BookingStatus.CONFIRMED
        
    # Generate Invoice if not yet created
    if not booking.invoice:
        inv_num = f"INV-2026-{booking.id:04d}"
        tax = round(booking.total_amount * 0.18, 2)
        inv = Invoice(
            invoice_number=inv_num,
            booking_id=booking.id,
            issue_date=now,
            subtotal=booking.subtotal,
            discount=booking.discount,
            tax_amount=tax,
            total_amount=booking.total_amount,
            pdf_url=f"/api/invoices/{inv_num}/html",
            status="PAID"
        )
        db.add(inv)
        
    # Calculate and store Provider Earnings
    if not booking.earning:
        commission_rate = booking.provider.commission_rate if booking.provider else 10.0
        commission_cut = round((booking.total_amount * commission_rate) / 100.0, 2)
        net_payout = round(booking.total_amount - commission_cut, 2)
        earning = ProviderEarning(
            provider_id=booking.provider_id,
            booking_id=booking.id,
            gross_amount=booking.total_amount,
            commission_cut=commission_cut,
            net_payout=net_payout,
            payout_status="PENDING"
        )
        db.add(earning)
        
    # Notifications
    db.add(Notification(
        user_id=booking.customer.user_id,
        title="Payment Successful!",
        message=f"Payment of ₹{booking.total_amount} for booking {booking.booking_code} was successful. Transaction ID: {req.gateway_payment_id}.",
        notification_type="PAYMENT_SUCCESS"
    ))
    db.add(Notification(
        user_id=booking.provider.user_id,
        title="Payment Received",
        message=f"Customer completed payment of ₹{booking.total_amount} for {booking.booking_code}.",
        notification_type="PROVIDER_PAYMENT"
    ))
    db.commit()
    
    return {
        "success": True,
        "message": "Payment verified and recorded successfully!",
        "payment_id": req.gateway_payment_id,
        "booking_status": booking.status.value,
        "invoice_number": booking.invoice.invoice_number if booking.invoice else f"INV-2026-{booking.id:04d}"
    }

@router.get("/invoices/{invoice_number}/html", response_class=HTMLResponse)
def get_invoice_html(invoice_number: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    b = inv.booking
    formatted_date = inv.issue_date.strftime("%B %d, %Y - %I:%M %p")
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice {inv.invoice_number} - HomeServe Horizon</title>
        <style>
            body {{
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                background-color: #f8fafc;
                color: #1e293b;
                margin: 0;
                padding: 40px 20px;
            }}
            .invoice-box {{
                max-width: 750px;
                margin: auto;
                background: #ffffff;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0d9488;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .brand {{
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                display: flex;
                align-items: center;
                gap: 8px;
            }}
            .brand span {{ color: #0d9488; }}
            .inv-badge {{
                background: #ecfdf5;
                color: #059669;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                border: 1px solid #a7f3d0;
            }}
            .details-grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 30px;
                font-size: 14px;
            }}
            .details-col h4 {{
                margin: 0 0 8px 0;
                color: #64748b;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            .table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }}
            .table th {{
                background: #f1f5f9;
                text-align: left;
                padding: 12px 14px;
                font-size: 13px;
                color: #475569;
            }}
            .table td {{
                padding: 14px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
            }}
            .totals {{
                float: right;
                width: 280px;
                font-size: 14px;
            }}
            .totals-row {{
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
            }}
            .totals-row.grand {{
                border-top: 2px solid #0f172a;
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
                padding-top: 10px;
                margin-top: 6px;
            }}
            .footer {{
                clear: both;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px dashed #cbd5e1;
                font-size: 12px;
                color: #94a3b8;
                text-align: center;
            }}
            @media print {{
                body {{ background: #fff; padding: 0; }}
                .invoice-box {{ box-shadow: none; border: none; }}
                .no-print {{ display: none; }}
            }}
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div>
                    <div class="brand">HomeServe <span>Horizon</span></div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">SaaS Home Services Platform</div>
                </div>
                <div>
                    <span class="inv-badge">PAID & VERIFIED</span>
                    <div style="font-weight: 700; font-size: 16px; margin-top: 6px; text-align: right;">{inv.invoice_number}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="details-col">
                    <h4>Billed To (Customer)</h4>
                    <strong>{b.customer.full_name}</strong><br>
                    {b.address.street_address if b.address else ""}<br>
                    {b.address.city if b.address else ""}, {b.address.state if b.address else ""} - {b.address.postal_code if b.address else ""}<br>
                    Phone: {b.customer.user.phone or "N/A"}
                </div>
                <div class="details-col" style="text-align: right;">
                    <h4>Service Provider</h4>
                    <strong>{b.provider.company_name}</strong><br>
                    Booking Reference: <strong>{b.booking_code}</strong><br>
                    Date: {formatted_date}<br>
                    Payment Mode: {b.payment.payment_method if b.payment else "RAZORPAY_TEST"}
                </div>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Duration</th>
                        <th style="text-align: right;">Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>{b.service.name}</strong><br>
                            <span style="font-size: 12px; color: #64748b;">Appointment Date: {b.booking_date} ({b.time_slot})</span>
                        </td>
                        <td>{b.service.duration_minutes} mins</td>
                        <td style="text-align: right;">₹{b.subtotal:.2f}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>₹{b.subtotal:.2f}</span>
                </div>
                <div class="totals-row" style="color: #059669;">
                    <span>Coupon Discount:</span>
                    <span>-₹{b.discount:.2f}</span>
                </div>
                <div class="totals-row">
                    <span>Platform Service Fee:</span>
                    <span>₹{b.platform_fee:.2f}</span>
                </div>
                <div class="totals-row grand">
                    <span>Total Paid:</span>
                    <span>₹{inv.total_amount:.2f}</span>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for choosing HomeServe Horizon! All services come with a 30-day satisfaction guarantee.</p>
                <button class="no-print" onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 10px;">Print / Save as PDF</button>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

