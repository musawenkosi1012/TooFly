from adapters.paynow_adapter import paynow_adapter
from clients.core_client import core_client
from typing import Dict, Any

class PaymentService:
    def initiate_payment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return paynow_adapter.create_payment(
            order_id=data["order_id"],
            email=data["email"],
            amount=data["amount"],
            method=data.get("method", "web"),
            phone=data.get("phone")
        )

    def handle_status_check(self, poll_url: str) -> Dict[str, Any]:
        status_data = paynow_adapter.verify_transaction(poll_url)
        # Optional: Sync with Core Service during check
        return status_data

    def handle_callback(self, form_data: Dict[str, Any]):
        status = paynow_adapter.process_callback(form_data)
        
        if status.success:
            # Normalize status for Core Service (paid/failed)
            normalized_status = "paid" if status.status.lower() in ["paid", "awaiting delivery"] else status.status
            # Async notification would be better here, but synchronous for now
            core_client.update_order_status(
                order_id=int(status.reference), 
                status=normalized_status,
                poll_url=status.poll_url
            )
            
        return {"status": "ok"}

payment_service = PaymentService()
