from paynow import Paynow
from core.config import settings
from typing import Dict, Any

class PaynowAdapter:
    def __init__(self):
        self._client = Paynow(
            settings.PAYNOW_INTEGRATION_ID,
            settings.PAYNOW_INTEGRATION_KEY,
            settings.PAYNOW_RETURN_URL,
            settings.PAYNOW_RESULT_URL
        )

    def create_payment(self, order_id: int, email: str, amount: float, method: str, phone: str = None) -> Dict[str, Any]:
        payment = self._client.create_payment(str(order_id), email)
        payment.add(f"Order #{order_id}", amount)

        if method == "web":
            response = self._client.send(payment)
        else:
            # Normalized phone (e.g. 263... for Ecocash)
            if phone and phone.startswith('0'):
                phone = "263" + phone[1:]
            
            response = self._client.send_mobile(payment, phone, method)

        if not response.success:
            return {
                "success": False,
                "error": getattr(response, 'error', 'Payment creation failed')
            }

        return {
            "success": True,
            "order_id": order_id,
            "redirect_url": getattr(response, 'redirect_url', None),
            "poll_url": getattr(response, 'poll_url', None),
            "instructions": getattr(response, 'instructions', None)
        }

    def verify_transaction(self, poll_url: str) -> Dict[str, Any]:
        status = self._client.check_transaction_status(poll_url)
        return {
            "status": status.status,
            "paid": status.status.lower() in ["paid", "awaiting delivery"],
            "reference": status.reference,
            "error": getattr(status, 'error', None)
        }

    def process_callback(self, data: Dict[str, Any]):
        return self._client.process_status_update(data)

paynow_adapter = PaynowAdapter()
