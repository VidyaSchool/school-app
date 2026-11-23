import io
import sys
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.routes.fees as fees


def test_create_razorpay_order_falls_back_when_gateway_auth_fails(monkeypatch):
    fees.RAZORPAY_KEY_ID = "rzp_test_dummy"
    fees.RAZORPAY_KEY_SECRET = "dummy_secret"

    def failing_urlopen(request, timeout=10):
        raise urllib.error.HTTPError(
            request.full_url,
            401,
            "Unauthorized",
            hdrs=None,
            fp=io.BytesIO(b"{}"),
        )

    monkeypatch.setattr(fees.urllib_request, "urlopen", failing_urlopen)

    order = fees._create_razorpay_order(1000, "TEST")

    assert order["mock_payment"] is True
    assert order["order_id"].startswith("mock_order_")
    assert order["amount"] == 1000
    assert order["currency"] == "INR"
