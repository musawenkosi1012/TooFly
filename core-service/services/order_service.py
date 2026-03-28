from sqlalchemy.orm import Session
from domain.orders.models import Order, OrderItem
from clients.payment_client import payment_client
from typing import Dict, Any, List

class OrderService:
    def create_order(self, db: Session, user: Any, checkout_data: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Create locally with status pending
        order = Order(
            user_id=user.id,
            total_amount=checkout_data["total"],
        )
        db.add(order)
        db.flush() # Get order ID
        
        # 2. Add items
        for item in checkout_data.get("items", []):
            order_item = OrderItem(
                order_id=order.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                price_at_order=item["price"]
            )
            db.add(order_item)
            
        # 3. Request payment through Service 2
        payment_res = payment_client.initiate_payment(
            order_id=order.id,
            email=user.email,
            amount=order.total_amount,
            method=checkout_data.get("method", "web"),
            phone=checkout_data.get("phone")
        )
        
        if payment_res.get("success"):
            # Store poll_url for later status checks
            order.payment_reference = payment_res.get("poll_url")
            db.commit()
            return {
                "success": True, 
                "order_id": order.id, 
                "redirect_url": payment_res.get("redirect_url"),
                "poll_url": payment_res.get("poll_url"),
                "instructions": payment_res.get("instructions")
            }
        
        # Handle payment initiation failure
        order.status = "failed"
        db.commit()
        return {"success": False, "error": payment_res.get("error", "Payment service unreachable")}

    def process_payment_update(self, db: Session, order_id: int, status: str, poll_url: str = None) -> bool:
        order = db.query(Order).get(order_id)
        if not order:
            return False
            
        # Idempotent status update
        if order.status == "paid":
            return True
            
        order.status = status
        if poll_url:
            order.payment_reference = poll_url
            
        db.commit()
        return True

    def sync_order_status(self, db: Session, order_id: int) -> Dict[str, Any]:
        order = db.query(Order).get(order_id)
        if not order or not order.payment_reference:
            return {"status": "error", "error": "No reference found"}
            
        # Manually poll Payment Service
        status_data = payment_client.check_status(order.payment_reference)
        if status_data.get("paid"):
            order.status = "paid"
            db.commit()
            
        return status_data

order_service = OrderService()
