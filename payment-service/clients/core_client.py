import requests
from core.config import settings
from typing import Dict, Any

class CoreServiceClient:
    def __init__(self):
        self._base_url = settings.CORE_SERVICE_URL
        self._headers = {
            "x-internal-key": settings.INTERNAL_API_KEY
        }
        # Use a session for connection pooling
        self._session = requests.Session()
        self._session.headers.update(self._headers)

    def update_order_status(self, order_id: int, status: str, poll_url: str = None) -> bool:
        try:
            response = self._session.post(
                f"{self._base_url}/api/v1/internal/payment-update",
                json={
                    "order_id": order_id,
                    "status": status,
                    "poll_url": poll_url
                },
                timeout=5
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            # In a production environment, implement retry logic or a message queue here
            print(f"Failed to notify Core Service: {e}")
            return False

core_client = CoreServiceClient()
