import requests
from core.config import settings
from typing import Dict, Any

class PaymentServiceClient:
    def __init__(self):
        self._base_url = settings.PAYMENT_SERVICE_URL
        self._headers = {
            "x-internal-key": settings.INTERNAL_API_KEY
        }

    def initiate_payment(self, order_id: int, email: str, amount: float, method: str, phone: str = None) -> Dict[str, Any]:
        try:
            response = requests.post(
                f"{self._base_url}/api/v1/payments/create",
                json={
                    "order_id": order_id,
                    "email": email,
                    "amount": amount,
                    "method": method,
                    "phone": phone
                },
                headers=self._headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            # Handle failure cases: log error, potentially retry or fail gracefully
            print(f"Error calling Payment Service: {e}")
            return {"success": False, "error": str(e)}

    def check_status(self, poll_url: str) -> Dict[str, Any]:
        try:
            response = requests.post(
                f"{self._base_url}/api/v1/payments/status",
                json={"poll_url": poll_url},
                headers=self._headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"status": "error", "error": str(e)}

payment_client = PaymentServiceClient()
